"""Evidence extraction: turn every participant-visible evidence file into Observations.

An Observation is one grounded fact about one resource at one point in time:
"in file F, at time T, resource R of system S was present/absent, did/did not
expose direct identifiers, was/was not active, and is linked to identifiers L".

Each supported format has a small parser. The parsers never decide which case a
record belongs to; they only record the identifiers found next to the record.
"""
from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass, field

from . import util

LOOKUP_KEYS = ("lookup_key", "subject_key", "match_key", "scan_key", "subject_ref", "query", "lookup_value")
IDENT_FIELDS = (
    "email", "phone", "full_name", "name", "display_name", "email_hash", "customer_reference", "user_id",
    "requester_email", "requester_phone", "requester_name", "owner_email", "owner_phone", "customer_email",
    "subject_reference", "subject_selector", "matched_value", "correlation_key", "uploaded_by",
)
DIRECT_FIELDS = (
    "email", "phone", "full_name", "name", "display_name", "email_hash", "requester_email", "requester_phone",
    "requester_name", "owner_email", "owner_phone", "customer_email", "matched_value",
)


@dataclass
class Observation:
    file_id: str
    captured_at: str          # capture time of the evidence file (citation eligibility)
    ts: str                   # time the fact was observed
    system: str
    resource_id: str
    category: str | None = None
    present: bool | None = None
    exposed: bool | None = None   # direct identifiers (or a user link for analytics) still visible
    active: bool | None = None    # data flow enabled / restore allowed
    links: set = field(default_factory=set)
    detail: str = ""
    kind: str = "record"         # record | lookup | absence | scope
    scope_system: str | None = None  # for kind == "scope": a complete snapshot of this system

    def key(self):
        return (self.system, self.resource_id)


def _links_from(d: dict, keys=IDENT_FIELDS + LOOKUP_KEYS) -> set:
    out = set()
    for k in keys:
        v = util.norm_id(d.get(k))
        if v:
            out.add(v)
    return out


def _direct_exposed(d: dict, extra=()) -> bool:
    for k in DIRECT_FIELDS + tuple(extra):
        if k in d and not util.is_null(d.get(k)):
            v = str(d.get(k))
            if v.strip().upper() == "[REDACTED]":
                continue
            return True
    return False


def _text_exposes(text: str | None) -> bool:
    if util.is_null(text):
        return False
    t = str(text)
    if "[REDACTED]" in t.upper() and not util.EMAIL_RE.search(t):
        return False
    return bool(util.EMAIL_RE.search(t) or re.search(r"\+\d[\d ()\-]{6,}", t))


# --------------------------------------------------------------------------- records
def record_observation(file_id, captured_at, ts, system, rec: dict, collection: str = "", detail="") -> Observation | None:
    """Interpret a structured record (SQL row / JSON record) from any data store."""
    rid = rec.get("resource_id")
    if not rid:
        return None
    system = system or util.system_for(rid)
    if system is None:
        return None
    doc = rec.get("document") if isinstance(rec.get("document"), dict) else {}
    merged = dict(rec)
    merged.update({k: v for k, v in doc.items() if k not in merged or util.is_null(merged.get(k))})
    links = _links_from(merged)
    if "message_text" in merged and not util.is_null(merged["message_text"]):
        links |= {e.lower() for e in util.EMAIL_RE.findall(str(merged["message_text"]))}
    obs = Observation(file_id, captured_at, ts, system, rid, present=True, links=links, detail=detail or collection)
    cat = util.SYSTEM_CATEGORY.get(system)
    if system == "support_platform" and (collection == "ticket_attachments" or "file_name" in merged
                                         or merged.get("storage_class") == "ticket_attachment"):
        cat = "SUPPORT_ATTACHMENT"
    obs.category = cat
    if system == "analytics_platform":
        obs.exposed = _direct_exposed(merged) or not util.is_null(merged.get("user_id")) or not util.is_null(merged.get("customer_reference"))
    elif system == "support_platform":
        if cat == "SUPPORT_ATTACHMENT":
            obs.exposed = True
        else:
            obs.exposed = _direct_exposed(merged) or _text_exposes(merged.get("message_text")) or _text_exposes(merged.get("message_excerpt")) and _direct_exposed(merged)
    elif system == "identity_service":
        obs.exposed = _direct_exposed(merged)
    elif system == "integration_service":
        obs.active = util.truthy(merged.get("enabled"))
    elif system == "backup_service":
        obs.active = util.truthy(merged.get("restore_allowed"))
    elif system == "export_service":
        avail = util.truthy(merged.get("download_available", merged.get("available")))
        if avail is False:
            # expired export metadata still identifies the user; treat as present record
            obs.present = True
        obs.exposed = True
    else:
        obs.exposed = _direct_exposed(merged)
    status = str(merged.get("account_status") or "").upper()
    if system == "account_service" and status in ("DELETED", "PURGED"):
        obs.present = False
    return obs


RESULT_MAP = {
    "FOUND": dict(present=True),
    "NOT_FOUND": dict(present=False),
    "ABSENT": dict(present=False),
    "DELETED": dict(present=False),
    "IDENTIFIABLE": dict(present=True, exposed=True),
    "ANONYMIZED": dict(present=True, exposed=False),
    "REDACTED": dict(present=True, exposed=False),
    "ACTIVE": dict(present=True, active=True),
    "ENABLED": dict(present=True, active=True),
    "DISABLED": dict(present=True, active=False),
    "BLOCKED": dict(present=True, active=False),
    "RETAINED": dict(present=True),
}


def lookup_observation(file_id, captured_at, ts, system, rid, record_type, result, subject, detail="") -> Observation:
    system = system or util.system_for(rid)
    res = RESULT_MAP.get(str(result).upper(), {})
    obs = Observation(file_id, captured_at, ts, system, rid, category=record_type or util.SYSTEM_CATEGORY.get(system),
                      links=_links_from({"subject_reference": subject}), detail=detail, kind="lookup", **res)
    if obs.exposed is None and obs.present:
        if record_type in ("SUPPORT_ATTACHMENT", "USER_PROFILE", "SEARCH_INDEX_ENTRY", "USER_EXPORT"):
            obs.exposed = True
    return obs


# --------------------------------------------------------------------------- logs
KV_RE = re.compile(r'([A-Za-z_]+)=("(?:[^"\\]|\\.)*"|\S+)')


def _kv(text: str) -> dict:
    d = {}
    for k, v in KV_RE.findall(text):
        if v.startswith('"'):
            v = v[1:-1].replace('\\"', '"')
        d[k] = v
    return d


def parse_log_line(line: str) -> dict | None:
    line = line.rstrip("\n")
    m = re.match(r"(\d{4}-\d\d-\d\dT[\d:]+Z)\s+(?:\|\s+)?(.*)", line)
    if not m:
        return None
    ts, rest = m.groups()
    d = {"ts": ts}
    if rest.startswith("{"):
        try:
            j = json.loads(rest)
        except json.JSONDecodeError:
            return d
        d.update({k: (str(v) if v is not None else "null") for k, v in j.items()})
        d["service"] = j.get("service") or j.get("logger")
        d["level"] = j.get("severity") or j.get("level")
        return d
    m = re.match(r"\[(\w+)\] \[(\w+)\] \[([\w-]+)\] (\w+): (.*)", rest)
    if m:
        d.update(level=m[1], service=m[2], trace_id=m[3], event=m[4])
        d.update(_kv(m[5]))
        return d
    m = re.match(r"(\w+) \| (\w+) \| ([\w-]+) \| (\w+) \| (.*)", rest)
    if m:
        d.update(level=m[1], service=m[2], trace_id=m[3], event=m[4])
        d.update(_kv(m[5]))
        return d
    m = re.match(r'requestId=(\S+) level=(\w+) function=(\w+) message="(.*)"$', rest)
    if m:
        d.update(trace_id=m[1], level=m[2], service=m[3])
        d.update(_kv(m[4].replace('\\"', '"')))
        return d
    m = re.match(r"<\d+>\d+ \S+ (\w+) ([\w-]+) - - (.*)", rest)
    if m:
        d.update(service=m[1], trace_id=m[2])
        d.update(_kv(m[3]))
        return d
    d.update(_kv(rest))
    return d


def _int(v, default=None):
    try:
        return int(str(v).strip('"'))
    except (TypeError, ValueError):
        return default


def log_line_observation(file_id, captured_at, d: dict, trace_links: set) -> Observation | None:
    rid = d.get("resource_id")
    event = d.get("event") or ""
    if not rid or not util.RESOURCE_RE.fullmatch(rid):
        return None
    if event.endswith("_started") or event in ("thumbnail_failed", "cache_lookup"):
        return None
    if event == "record_lookup":
        return lookup_observation(file_id, captured_at, d["ts"], d.get("system"), rid, d.get("record_type"),
                                  d.get("result"), d.get("subject_reference"), detail=event)
    system = util.system_for(rid)
    svc = d.get("service") or ""
    links = set(trace_links) | _links_from(d)
    obs = Observation(file_id, captured_at, d["ts"], system, rid, category=util.SYSTEM_CATEGORY.get(system),
                      links=links, detail=f"{svc}:{event}")
    if event == "profile_lookup_completed":
        rows = _int(d.get("rows"))
        http = _int(d.get("http_status"))
        obs.present = (rows or 0) > 0 or http == 200
        if rows == 0 or http == 404:
            obs.present = False
        obs.exposed = obs.present and _direct_exposed(d)
    elif event == "index_query_completed":
        res = (d.get("result") or "").lower()
        hits = _int(d.get("total_hits"))
        obs.present = res == "hit" or (hits or 0) > 0
        if res in ("miss", "none", "empty") or hits == 0:
            obs.present = False
        obs.exposed = obs.present
    elif event in ("analytics_profile_read_completed", "analytics_profile_read"):
        obs.present = True
        di = _int(d.get("direct_identifiers"))
        obs.exposed = bool(di) or _direct_exposed(d) or not util.is_null(d.get("customer_reference"))
    elif event == "analytics_identity_scan":
        obs.present = True
        obs.exposed = _int(d.get("direct_identifiers"), 1) != 0 or not util.is_null(d.get("matched_value"))
    elif event == "contact_lookup_completed":
        # marketing-contact copy kept in the analytics platform: a secondary identifier record
        obs.category = "SECONDARY_IDENTIFIER"
        obs.present = (_int(d.get("rows")) or 0) > 0
        obs.exposed = obs.present
    elif event in ("restore_candidate_evaluated",):
        eligible = util.truthy(d.get("eligible"))
        block = util.truthy(d.get("deletion_block"))
        obs.present = True
        obs.active = bool(eligible) and not bool(block)
    elif event == "restore_policy_read_completed":
        obs.present = util.truthy(d.get("archive_present")) is not False
        obs.active = util.truthy(d.get("restore_allowed"))
    elif event == "restore_authorization_completed":
        obs.present = True
        obs.active = (d.get("decision") or "").lower() in ("allow", "allowed", "permit", "approved")
    elif event in ("export_download_check_completed", "export_metadata_read_completed"):
        avail = util.truthy(d.get("available"))
        obs.present = avail is not False
        obs.exposed = obs.present
    elif event in ("connector_config_loaded", "connector_heartbeat", "connector_config_read_completed"):
        obs.present = True
        en = util.truthy(d.get("enabled"))
        sched = util.truthy(d.get("scheduler_registered"))
        obs.active = bool(en) or bool(sched)
        if en is False and sched is not True:
            obs.active = False
    elif event == "audit_record_read_completed":
        obs.present = (_int(d.get("rows"), 1) or 0) > 0
    elif event == "attachment_pii_scan":
        obs.category = "SUPPORT_ATTACHMENT"
        obs.present = True
        obs.exposed = True
    elif event == "message_pii_scan":
        obs.category = "SUPPORT_MESSAGE"
        obs.present = True
        obs.exposed = True
    elif event == "message_read":
        obs.category = "SUPPORT_MESSAGE"
        obs.present = True
        obs.exposed = _text_exposes(d.get("message_text"))
    elif event == "support_ticket_read_completed":
        obs.category = "SUPPORT_MESSAGE"
        obs.present = True
        obs.exposed = _direct_exposed(d)
    elif event in ("contact_query_completed", "deletion_marker_check"):
        # legacy support-replica contact copy of the user: must be removed
        obs.category = "SECONDARY_IDENTIFIER"
        if event == "contact_query_completed":
            obs.present = (_int(d.get("rows")) or 0) > 0
        else:
            obs.present = util.truthy(d.get("marker_found")) is False
        obs.exposed = obs.present
    elif event == "retained_order_loaded":
        obs.present = True
    else:
        return None
    return obs


def extract_log(file_id, captured_at, text: str) -> list[Observation]:
    lines = [parse_log_line(l) for l in text.splitlines()]
    lines = [d for d in lines if d]
    trace_keys: dict[str, set] = {}
    for d in lines:
        tid = d.get("trace_id")
        if not tid:
            continue
        ks = {util.norm_id(d.get(k)) for k in LOOKUP_KEYS}
        ks.discard(None)
        if ks:
            trace_keys.setdefault(tid, set()).update(ks)
    out = []
    for d in lines:
        obs = log_line_observation(file_id, captured_at, d, trace_keys.get(d.get("trace_id"), set()))
        if obs:
            out.append(obs)
    return out


# --------------------------------------------------------------------------- SQL
def extract_sql(file_id, captured_at, text: str) -> list[Observation]:
    con = sqlite3.connect(":memory:")
    con.executescript(text)
    out: list[Observation] = []
    tables = [r[0] for r in con.execute("select name from sqlite_master where type='table'")]
    scope = {}
    if "snapshot_scope" in tables:
        for system, at in con.execute("select origin_system, captured_at from snapshot_scope"):
            scope[system] = at
    table_system = {
        "customer_profiles": "account_service", "customer_search_documents": "search_service",
        "customer_analytics_profiles": "analytics_platform", "support_records": "support_platform",
        "customer_exports": "export_service", "connector_subscriptions": "integration_service",
        "backup_restore_entries": "backup_service", "security_audit_records": "security_service",
    }
    covered = set()
    for t in tables:
        if t == "snapshot_scope":
            continue
        cols = [r[1] for r in con.execute(f'pragma table_info("{t}")')]
        rows = [dict(zip(cols, r)) for r in con.execute(f'select * from "{t}"')]
        topology = "replica" if "replica" in t else "primary"
        for row in rows:
            if "record_json" in row:
                rec = json.loads(row["record_json"])
                system = row.get("origin_system")
                ts = row.get("updated_at") or captured_at
                obs = record_observation(file_id, captured_at, captured_at, system, rec, row.get("collection_name", ""),
                                         detail=f"{t}")
            else:
                rec = dict(row)
                system = table_system.get(t) or util.system_for(rec.get("resource_id", ""))
                if t.startswith("customer_profiles"):
                    system = "account_service"
                if t.startswith("search_documents"):
                    system = "search_service"
                if "enabled" in rec:
                    rec["enabled"] = bool(rec["enabled"])
                if "restore_allowed" in rec:
                    rec["restore_allowed"] = bool(rec["restore_allowed"])
                ts = scope.get(system, captured_at)
                obs = record_observation(file_id, captured_at, ts, system, rec, t, detail=t)
            if obs:
                out.append(obs)
                covered.add(obs.system)
    # complete snapshots: a system in scope (or a dedicated profile/search table) proves absence of unlisted rows
    for system, at in scope.items():
        out.append(Observation(file_id, captured_at, at, system, "*", kind="scope", scope_system=system,
                               detail="snapshot_scope"))
    if not scope:
        for t in tables:
            if t.startswith("customer_profiles_"):
                out.append(Observation(file_id, captured_at, captured_at, "account_service", "*", kind="scope",
                                       scope_system="account_service", detail=t))
            if t.startswith("search_documents_"):
                out.append(Observation(file_id, captured_at, captured_at, "search_service", "*", kind="scope",
                                       scope_system="search_service", detail=t))
    return out


# --------------------------------------------------------------------------- JSON / text records
def extract_json(file_id, captured_at, data) -> list[Observation]:
    out: list[Observation] = []
    if isinstance(data, dict) and "snapshots" in data:
        for snap in data["snapshots"]:
            at = snap.get("captured_at") or captured_at
            store = snap.get("data_store")
            coll = snap.get("collection", "")
            if coll == "operational_record_history":
                for r in snap.get("records", []):
                    out.append(lookup_observation(file_id, captured_at, r.get("recorded_at") or at, r.get("system"),
                                                  r["resource_id"], r.get("record_type"), r.get("result"),
                                                  r.get("lookup_value") or r.get("subject_reference"), detail=coll))
                continue
            for r in snap.get("records", []):
                obs = record_observation(file_id, captured_at, at, store, r, coll, detail=coll)
                if obs:
                    out.append(obs)
            if store and coll in ("customer_profiles", "customer_search_documents", "deleted_customer_references"):
                out.append(Observation(file_id, captured_at, at, store, "*", kind="scope", scope_system=store,
                                       detail=coll))
        return out
    if isinstance(data, dict) and "service_exports" in data:
        for system, groups in data["service_exports"].items():
            for gname, items in groups.items():
                for it in items:
                    out.extend(_service_export_item(file_id, captured_at, system, gname, it))
        return out
    if isinstance(data, dict) and isinstance(data.get("records"), list):
        recs = data["records"]
        at = data.get("captured_at") or data.get("exported_at") or captured_at
        coll = data.get("collection", "")
        for r in recs:
            if "record_type" in r and "result" in r:
                out.append(lookup_observation(file_id, captured_at, r.get("recorded_at") or at, r.get("system"),
                                              r["resource_id"], r["record_type"], r["result"],
                                              r.get("subject_reference") or r.get("lookup_value"), detail=coll or "lookup"))
            else:
                obs = record_observation(file_id, captured_at, at, None, r, coll, detail=coll)
                if obs:
                    if obs.system == "export_service":
                        obs.present = util.truthy(r.get("download_available")) is not False or True
                    out.append(obs)
    return out


def _service_export_item(file_id, captured_at, system, group, it) -> list[Observation]:
    rid = it.get("resource_id")
    at = it.get("observed_at") or captured_at
    if system == "account_service":
        status = _int(it.get("status_code"))
        prof = it.get("profile") or {}
        obs = Observation(file_id, captured_at, at, system, rid, category="USER_PROFILE",
                          present=bool(prof) and status != 404, links=_links_from(prof), detail=group)
        obs.exposed = obs.present
        return [obs]
    if system == "search_service":
        hits = (it.get("hits") or {})
        docs = hits.get("documents") or []
        out = []
        q = util.norm_id(it.get("query"))
        for doc in docs:
            o = Observation(file_id, captured_at, at, system, doc.get("resource_id") or rid,
                            category="SEARCH_INDEX_ENTRY", present=True, exposed=True,
                            links=_links_from(doc) | ({q} if q else set()), detail=group)
            out.append(o)
        if not docs and rid:
            out.append(Observation(file_id, captured_at, at, system, rid, category="SEARCH_INDEX_ENTRY",
                                   present=False, links={q} if q else set(), detail=group))
        return out
    obs = record_observation(file_id, captured_at, at, system, it, group, detail=group)
    return [obs] if obs else []


HANDOVER_RE = re.compile(
    r"^-\s*(\S+)\s*\|\s*(\w+)\s*\|\s*([a-z_]+_\d+)\s*\|\s*([A-Z_]+)\s*\|\s*([A-Z_]+)\s*\|\s*(.+?)\s*$")


def extract_text_record(file_id, captured_at, text) -> list[Observation]:
    out = []
    for line in text.splitlines():
        m = HANDOVER_RE.match(line.strip())
        if m:
            ts, system, rid, rtype, result, subject = m.groups()
            subj = subject if "@" in subject or subject.startswith("user_") else None
            out.append(lookup_observation(file_id, captured_at, ts, system, rid, rtype, result, subj, detail="handover"))
    return out
