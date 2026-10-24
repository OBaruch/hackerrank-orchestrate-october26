"""Does the request text authorize deletion?

The LLM classifier (multilingual, structured output) is the primary decision when available. A keyword
classifier is the offline fallback and a cross-check: disagreements are recorded in the case trace.
"""
from __future__ import annotations

import re

REQUEST_TYPES = ["DELETION", "DELETION_VERIFICATION", "ACCESS", "EXPORT", "CORRECTION", "MARKETING_OPT_OUT",
                 "ACCOUNT_SUPPORT", "OTHER"]

# explicit statements that the person is NOT asking for erasure (checked first)
NOT_DELETION = re.compile("|".join([
    r"not (?:asking for|a request (?:for|to)) (?:deletion|delet|eras)",
    r"\bnot a request to (?:erase|delete|remove)",
    r"\b(?:don.?t|do not|please don.?t) (?:delete|close|erase|remove|deactivate)",
    r"\bwithout (?:deleting|removing|erasing|closing)",
    r"\bleave (?:the|my) (?:account|profile)[^.]*(?:active|in place|as it is)",
    r"\bkeep (?:the|my) account (?:as it is|active|open)",
    r"\bleave my profile and purchase history in place",
    r"\bI (?:still|want to continue to) (?:need|use|want)\b",
    r"\bcontinue using the service",
    r"\bmarketing lists only\b",
]), re.I)

DELETION = re.compile("|".join([
    r"\bdelet", r"\beras", r"\bremov", r"\bclose (?:my|this|the) account", r"\bclosed\b", r"\bclose the account",
    r"\bclose this account", r"\baccount[- ]deletion", r"\b(?:profile|account) is gone", r"cannot identify me", r"\bpermanent(?:ly)? (?:delet|eras|remov)",
    r"exclus[ãa]o", r"\bapag", r"eliminaci[óo]n", r"\beliminar", r"\bborrar", r"\bsuprim", r"suppression",
    r"\bsupprim", r"\beffac", r"l[öo]sch", r"\bentfern", r"cancellazione", r"cancellare",
    r"삭제", r"削除", r"删除", r"注销", r"удал",
]), re.I)


def keyword_intent(text: str) -> dict:
    if NOT_DELETION.search(text):
        return {"authorizes_deletion": False, "request_type": "OTHER", "source": "keywords",
                "rationale": "explicit non-deletion wording: " + NOT_DELETION.search(text).group(0)}
    m = DELETION.search(text)
    if m:
        return {"authorizes_deletion": True, "request_type": "DELETION", "source": "keywords",
                "rationale": "deletion wording: " + m.group(0)}
    return {"authorizes_deletion": False, "request_type": "OTHER", "source": "keywords",
            "rationale": "no deletion wording"}


SYSTEM = """You review privacy requests received by an e-commerce company.
Decide whether the request text authorizes deletion (erasure) of the person's account or personal data.

Count as authorizing deletion:
- asking to delete, erase, remove, close permanently or finish deleting the account or profile;
- asking to verify, audit or finish a deletion that was already requested, or to remove leftover copies.

Count as NOT authorizing deletion:
- access or copy-of-data requests, data export or download, correcting or changing details,
  marketing opt-out only, login or account support, invoices, or anything that asks to keep the account.
- a text that mentions deletion only to say it is not wanted.

The request may be written in any language. Return only the JSON object."""

SCHEMA = {
    "type": "object",
    "properties": {
        "authorizes_deletion": {"type": "boolean"},
        "request_type": {"type": "string", "enum": REQUEST_TYPES},
        "language": {"type": "string"},
        "rationale": {"type": "string"},
    },
    "required": ["authorizes_deletion", "request_type", "language", "rationale"],
    "additionalProperties": False,
}


class IntentClassifier:
    def __init__(self, llm=None):
        self.llm = llm

    def classify(self, text: str) -> dict:
        kw = keyword_intent(text)
        if self.llm is None:
            return kw
        out = self.llm.json_call("intent", SYSTEM, [{"type": "text", "text": "Request text:\n" + text}],
                                 SCHEMA, max_tokens=400)
        if not out:
            return kw
        out = dict(out, source="llm")
        if out["authorizes_deletion"] != kw["authorizes_deletion"]:
            out["keyword_disagreement"] = kw["rationale"]
        return out
