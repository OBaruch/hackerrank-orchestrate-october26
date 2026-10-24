"""Evidence that is not machine-readable text: PDF documents and application screenshots.

PDFs: text is extracted with pypdf and parsed deterministically (resource ids and identifiers that
appear in the same document). Screenshots (PNG/JPG): a small Claude vision model transcribes the
records shown on screen into a fixed JSON schema; the answer is cached so later runs are offline.
Every extracted fact is turned into the same Observation type the text extractors produce, and only
well-formed resource ids and identifiers are accepted.
"""
from __future__ import annotations

import base64
import re

from . import util
from .observations import Observation

PHONE_RE = re.compile(r"\+\d{1,3}(?: ?\d){6,14}")

STATE = ["PRESENT", "DELETED_OR_NOT_FOUND", "MASKED_OR_ANONYMIZED", "UNKNOWN"]
FLOW = ["ENABLED", "DISABLED", "RESTORE_ALLOWED", "RESTORE_BLOCKED", "NOT_SHOWN"]

VISION_SYSTEM = """You transcribe screenshots of internal admin tools of an e-commerce company for a privacy audit.
List every record shown on the screen. A record is a table row, a profile header or a detail panel; when a
detail panel or page header describes the same record as a table row, merge them into one record.

For each record copy exactly what is shown, character for character:
- labels: every identifier that names the record: resource ids (account_123, support_45, search_6,
  analytics_7, export_8, data_flow_9, backup_10, audit_record_11, tombstone_12, marketing_13, object_14,
  legal_hold_15), user_N references, ticket / order / statement / invoice numbers and file names;
- emails, phones and person names displayed for that record (empty lists when none are shown, and use
  an empty list when the value is masked such as "***" or "[redacted]");
- state: PRESENT when the record is shown as existing, DELETED_OR_NOT_FOUND when the screen says it was
  deleted, purged or not found, MASKED_OR_ANONYMIZED when its personal fields are masked, otherwise UNKNOWN;
- flow: for connectors / sync jobs ENABLED or DISABLED, for backups RESTORE_ALLOWED or RESTORE_BLOCKED when
  the screen states it, otherwise NOT_SHOWN.
Do not invent records or identifiers. Return only the JSON object."""

VISION_SCHEMA = {
    "type": "object",
    "properties": {
        "screen": {"type": "string"},
        "records": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "labels": {"type": "array", "items": {"type": "string"}},
                    "record_type": {"type": "string"},
                    "emails": {"type": "array", "items": {"type": "string"}},
                    "phones": {"type": "array", "items": {"type": "string"}},
                    "names": {"type": "array", "items": {"type": "string"}},
                    "state": {"type": "string", "enum": STATE},
                    "flow": {"type": "string", "enum": FLOW},
                },
                "required": ["labels", "record_type", "emails", "phones", "names", "state", "flow"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["screen", "records"],
    "additionalProperties": False,
}


def _identifiers(text: str) -> set:
    links = {e.lower() for e in util.EMAIL_RE.findall(text)}
    links |= set(util.USER_RE.findall(text))
    links |= set(util.HASH_RE.findall(text))
    links |= {p.strip() for p in PHONE_RE.findall(text)}
    return links


def _category(rid: str, text: str) -> str | None:
    system = util.system_for(rid)
    if system == "support_platform" and re.search(r"\battachment\b|\bfile\b|\.pdf\b|\buploader\b", text, re.I):
        return "SUPPORT_ATTACHMENT"
    return util.SYSTEM_CATEGORY.get(system)


def pdf_observations(file_id: str, captured_at: str, text: str) -> list[Observation]:
    """Each resource id named in the document is observed present at capture time and linked to the
    identifiers printed in the same document (these exports describe one record each)."""
    out = []
    for rid in sorted(set(util.RESOURCE_RE.findall(text))):
        if util.system_for(rid) is None:
            continue
        out.append(record_state(file_id, captured_at, rid, pdf_record(text)))
    return out


def pdf_record(text: str) -> dict:
    """A whole PDF read as one record (the documents are single-subject business artifacts)."""
    links = _identifiers(text)
    return {"labels": sorted(set(util.RESOURCE_RE.findall(text)) | {k for k in links if k.startswith("user_")}),
            "record_type": "attachment" if re.search(r"\battachment\b|\buploader\b", text, re.I) else "document",
            "emails": sorted(k for k in links if "@" in k), "phones": sorted(k for k in links if k.startswith("+")),
            "names": [], "state": "PRESENT", "flow": "NOT_SHOWN", "_text": text}


def record_state(file_id: str, captured_at: str, rid: str, rec: dict, extra_links: set = frozenset()) -> Observation:
    """Translate one transcribed record into the observed state of resource `rid`."""
    system = util.system_for(rid)
    emails = {e.strip().lower() for e in rec.get("emails", []) if util.EMAIL_RE.fullmatch(e.strip())}
    phones = {p.strip() for p in rec.get("phones", []) if PHONE_RE.fullmatch(p.strip())}
    users = {u.strip() for u in rec.get("labels", []) if util.USER_RE.fullmatch(u.strip())}
    names = [n for n in rec.get("names", []) if n.strip()]
    state, flow = rec.get("state", "UNKNOWN"), rec.get("flow", "NOT_SHOWN")
    present = state != "DELETED_OR_NOT_FOUND"
    direct = bool(emails or phones or names)
    if state == "MASKED_OR_ANONYMIZED":
        exposed = False
    elif system == "analytics_platform":
        exposed = direct or bool(users)
    else:
        exposed = direct
    active = None
    if flow in ("ENABLED", "RESTORE_ALLOWED"):
        active = True
    elif flow in ("DISABLED", "RESTORE_BLOCKED"):
        active = False
    elif system in ("integration_service", "backup_service") and present and (direct or users):
        active = True   # a live connector / archive holding the subject's data that nothing stops or blocks
    text = rec.get("_text") or " ".join([rec.get("record_type", "")] + list(rec.get("labels", [])))
    cat = "SUPPORT_ATTACHMENT" if system == "object_storage" else _category(rid, text)
    if cat in ("SECURITY_AUDIT_LOG", "LEGAL_HOLD_RECORD"):
        exposed = None
    return Observation(file_id, captured_at, captured_at, system, rid, category=cat, present=present,
                       exposed=exposed if present else False, active=active if present else None,
                       links=emails | phones | users | set(extra_links), detail="media", kind="record")


def vision_observations(file_id: str, captured_at: str, data: dict) -> list[Observation]:
    out = []
    for rec in data.get("records", []):
        for label in rec.get("labels", []):
            rid = label.strip()
            if util.RESOURCE_RE.fullmatch(rid) and util.system_for(rid):
                out.append(record_state(file_id, captured_at, rid, rec))
    return out


class MediaReader:
    """Callable used by Dataset.extract for .pdf / .png / .jpg evidence."""

    def __init__(self, ds, llm=None):
        self.ds = ds
        self.llm = llm
        self.unread: list[str] = []      # screenshots that could not be transcribed (no key and no cache)
        self.records: dict[str, list[dict]] = {}   # file_id -> transcribed records

    def find_label(self, token: str) -> list[tuple[str, dict]]:
        """(file_id, record) pairs whose labels (or PDF text) contain a catalog reference token."""
        token = token.strip().lower()
        hits = []
        for file_id, recs in self.records.items():
            for rec in recs:
                if "_text" in rec:
                    if len(set(util.USER_RE.findall(rec["_text"]))) > 1:
                        continue   # multi-subject register: a token match says nothing about one record
                    if re.search(r"(?<![\w-])" + re.escape(token) + r"(?![\w-])", rec["_text"].lower()):
                        hits.append((file_id, rec))
                elif any(l.strip().lower() == token for l in rec.get("labels", [])):
                    hits.append((file_id, rec))
        return hits

    def __call__(self, ef) -> list[Observation]:
        if ef.ext == ".pdf":
            text = self.ds.pdf_text(ef)
            self.records[ef.file_id] = [pdf_record(text)]
            return pdf_observations(ef.file_id, ef.captured_at, text)
        if self.llm is None:
            self.unread.append(ef.file_id)
            return []
        with open(self.ds.abspath(ef), "rb") as fh:
            data = base64.standard_b64encode(fh.read()).decode("ascii")
        media_type = "image/png" if ef.ext == ".png" else "image/jpeg"
        content = [{"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}},
                   {"type": "text", "text": "Transcribe the records on this screen."}]
        out = self.llm.json_call("screenshot", VISION_SYSTEM, content, VISION_SCHEMA, max_tokens=4000)
        if out is None:
            self.unread.append(ef.file_id)
            return []
        self.records[ef.file_id] = out.get("records", [])
        return vision_observations(ef.file_id, ef.captured_at, out)
