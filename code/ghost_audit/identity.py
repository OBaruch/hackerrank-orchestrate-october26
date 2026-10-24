"""Identity resolution: current snapshot + audit history -> every identifier of the subject."""
from __future__ import annotations

from dataclasses import dataclass, field

from . import util


@dataclass
class Subject:
    request_email: str
    user_id: str | None
    name: str | None = None
    emails: set = field(default_factory=set)
    phones: set = field(default_factory=set)
    hashes: set = field(default_factory=set)
    matched_via: str = ""          # "current" | "history" | "unresolved"
    evidence_ids: list = field(default_factory=list)  # audit_ids used

    @property
    def link_keys(self) -> set:
        keys = set(self.emails) | set(self.hashes) | set(self.phones)
        if self.user_id:
            keys.add(self.user_id)
        return keys

    def to_dict(self):
        return {
            "user_id": self.user_id, "name": self.name, "matched_via": self.matched_via,
            "emails": sorted(self.emails), "phones": sorted(self.phones), "hashes": sorted(self.hashes),
            "audit_ids": self.evidence_ids,
        }


class IdentityResolver:
    def __init__(self, identities: list[dict], audit_log: list[dict]):
        self.by_user = {r["user_id"]: r for r in identities}
        self.current_email = {r["email"].lower(): r["user_id"] for r in identities}
        self.history: dict[str, list[dict]] = {}
        self.email_owner_hist: dict[str, str] = {}
        for a in audit_log:
            self.history.setdefault(a["user_id"], []).append(a)
            if a["field_name"] == "email":
                for v in (a["old_value"], a["new_value"]):
                    self.email_owner_hist.setdefault(v.lower(), a["user_id"])

    def resolve(self, email: str) -> Subject:
        e = email.strip().lower()
        uid, via = self.current_email.get(e), "current"
        if uid is None:
            uid, via = self.email_owner_hist.get(e), "history"
        subj = Subject(request_email=e, user_id=uid, matched_via=via if uid else "unresolved")
        subj.emails.add(e)
        if uid is None:
            subj.hashes.add(util.sha256(e))
            return subj
        cur = self.by_user.get(uid)
        if cur:
            subj.name = cur["name"]
            subj.emails.add(cur["email"].lower())
            subj.phones.add(cur["phone"])
            subj.hashes.add(cur["email_hash"])
        for a in sorted(self.history.get(uid, []), key=lambda r: r["event_time"]):
            subj.evidence_ids.append(a["audit_id"])
            if a["field_name"] == "email":
                subj.emails.update({a["old_value"].lower(), a["new_value"].lower()})
            elif a["field_name"] == "phone":
                subj.phones.update({a["old_value"], a["new_value"]})
            elif a["field_name"] == "email_hash":
                subj.hashes.update({a["old_value"], a["new_value"]})
        subj.hashes.update(util.sha256(x) for x in subj.emails)
        subj.emails.discard("")
        return subj
