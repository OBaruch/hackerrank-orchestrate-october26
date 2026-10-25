"""A tiny fictional dataset in the participant format, written to a temporary directory.

Two subjects, four evidence files and three requests are enough to exercise identity history, the
evidence window, policy actions, step ordering and the NOT_APPLICABLE path without the real corpus.

    case_9001  ana.vieja@example.test (a historical email of user_901), audited 2026-03-10
               profile still present, CRM connector enabled, support message exposes PII,
               backup restore already blocked, security audit record retained.
               A snapshot captured after audit_at shows the profile deleted; it must be ignored.
    case_9002  luis.ensayo@example.test, audited 2026-03-10
               a lookup inside the window proves the profile is gone. A snapshot captured before
               requested_at still lists it; it must be ignored.
    case_9004  asks for a copy of the data and says not to delete anything.
"""
from __future__ import annotations

import csv
import hashlib
import os
import tempfile

RULES = [
    ("rule_01", "USER_PROFILE", "Always", "DELETE"),
    ("rule_02", "SECONDARY_IDENTIFIER", "Always", "DELETE"),
    ("rule_03", "SEARCH_INDEX_ENTRY", "Always", "DELETE"),
    ("rule_05", "SUPPORT_MESSAGE", "Shared context must be retained", "REDACT"),
    ("rule_06", "SUPPORT_ATTACHMENT", "Attachment belongs only to the subject", "DELETE"),
    ("rule_07", "ANALYTICS_PROFILE", "Record is still attributable to a user", "ANONYMIZE"),
    ("rule_09", "USER_EXPORT", "Always", "DELETE"),
    ("rule_12", "SECURITY_AUDIT_LOG", "Record is within the retention period", "RETAIN"),
    ("rule_14", "BACKUP_ARCHIVE", "Restore access can be blocked", "RETAIN"),
    ("rule_15", "ACCOUNT_TOMBSTONE", "Only the stable user_id is needed", "REDACT"),
]

SCHEMA = """
CREATE TABLE snapshot_scope (origin_system TEXT PRIMARY KEY, captured_at TEXT NOT NULL);
CREATE TABLE customer_profiles (resource_id TEXT PRIMARY KEY, customer_reference TEXT, full_name TEXT, email TEXT,
  phone TEXT, email_hash TEXT, account_status TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE connector_subscriptions (resource_id TEXT PRIMARY KEY, customer_reference TEXT, customer_email TEXT,
  connector_name TEXT NOT NULL, enabled INTEGER NOT NULL, last_delivery_status TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE backup_restore_entries (resource_id TEXT PRIMARY KEY, customer_reference TEXT, customer_email TEXT,
  archive_key TEXT NOT NULL, restore_allowed INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE security_audit_records (resource_id TEXT PRIMARY KEY, subject_reference TEXT NOT NULL,
  event_code TEXT NOT NULL, retention_until TEXT NOT NULL, updated_at TEXT NOT NULL);
"""


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _snapshot(at: str, profiles=(), connectors=(), backups=(), audits=()) -> str:
    out = ["BEGIN TRANSACTION;", SCHEMA]
    for system in ("account_service", "integration_service", "backup_service", "security_service"):
        out.append(f"INSERT INTO snapshot_scope VALUES ('{system}', '{at}');")
    for rid, uid, name, email, status in profiles:
        out.append(f"INSERT INTO customer_profiles VALUES ('{rid}', '{uid}', '{name}', '{email}', '+34 600 000 000', "
                   f"'{sha(email)}', '{status}', '{at}');")
    for rid, uid, email, enabled in connectors:
        out.append(f"INSERT INTO connector_subscriptions VALUES ('{rid}', '{uid}', '{email}', 'crm_sync', {enabled}, "
                   f"'DELIVERED', '{at}');")
    for rid, uid, email, allowed in backups:
        out.append(f"INSERT INTO backup_restore_entries VALUES ('{rid}', '{uid}', '{email}', 'arc/{rid}', {allowed}, "
                   f"'{at}');")
    for rid, uid in audits:
        out.append(f"INSERT INTO security_audit_records VALUES ('{rid}', '{uid}', 'LOGIN', '2033-01-01', '{at}');")
    out.append("COMMIT;")
    return "\n".join(out) + "\n"


LOG = "\n".join([
    # a lookup line carries the identifier; the scan line of the same trace only carries the resource
    "2026-03-06T08:00:00Z level=INFO service=support_platform trace_id=tr-901 event=ticket_lookup_started "
    "lookup_key=ana.nueva@example.test",
    "2026-03-06T08:00:01Z level=INFO service=support_platform trace_id=tr-901 event=message_pii_scan "
    "resource_id=support_9001",
    '2026-03-06T09:00:00Z INFO service=downstream_delivery_service event=record_lookup seq=1 system="account_service" '
    'resource_id="account_9002" record_type="USER_PROFILE" result="NOT_FOUND" subject_reference="luis.ensayo@example.test"',
]) + "\n"


def _write_csv(path, header, rows):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


def build(root: str | None = None) -> str:
    """Write the fixture dataset and return its directory."""
    root = root or tempfile.mkdtemp(prefix="ghost_fixture_")
    os.makedirs(os.path.join(root, "evidence", "databases"), exist_ok=True)
    os.makedirs(os.path.join(root, "evidence", "logs"), exist_ok=True)
    _write_csv(os.path.join(root, "user_identities.csv"), ["user_id", "name", "email", "phone", "email_hash", "updated_at"], [
        ["user_901", "Ana Prueba", "ana.nueva@example.test", "+34 600 000 901", sha("ana.nueva@example.test"),
         "2026-01-02T00:00:00Z"],
        ["user_902", "Luis Ensayo", "luis.ensayo@example.test", "+34 600 000 902", sha("luis.ensayo@example.test"),
         "2026-01-02T00:00:00Z"],
    ])
    _write_csv(os.path.join(root, "user_audit_log.csv"),
               ["audit_id", "user_id", "event_time", "field_name", "old_value", "new_value"],
               [["audit_9001", "user_901", "2026-01-01T09:00:00Z", "email", "ana.vieja@example.test",
                 "ana.nueva@example.test"]])
    _write_csv(os.path.join(root, "system_activity.csv"),
               ["activity_id", "event_time", "event_type", "source_system", "target_system", "resource_id",
                "reported_result", "details"], [])
    _write_csv(os.path.join(root, "deletion_rules.csv"), ["rule_id", "data_category", "condition", "required_action"],
               RULES)
    _write_csv(os.path.join(root, "evidence_files.csv"), ["file_id", "file_path", "origin", "captured_at"], [
        ["evidence_901", "evidence/databases/inventory_20260305.sql", "database_snapshot", "2026-03-05T00:00:00Z"],
        ["evidence_902", "evidence/logs/support_trace_20260306.log", "application_log", "2026-03-06T12:00:00Z"],
        ["evidence_903", "evidence/databases/inventory_20260320.sql", "database_snapshot", "2026-03-20T00:00:00Z"],
        ["evidence_904", "evidence/databases/inventory_20260220.sql", "database_snapshot", "2026-02-20T00:00:00Z"],
    ])
    files = {
        "evidence/databases/inventory_20260305.sql": _snapshot(
            "2026-03-05T00:00:00Z",
            profiles=[("account_9001", "user_901", "Ana Prueba", "ana.nueva@example.test", "ACTIVE")],
            connectors=[("data_flow_9001", "user_901", "ana.vieja@example.test", 1)],
            backups=[("backup_9001", "user_901", "ana.nueva@example.test", 0)],
            audits=[("audit_record_9001", "user_901")]),
        "evidence/logs/support_trace_20260306.log": LOG,
        "evidence/databases/inventory_20260320.sql": _snapshot(
            "2026-03-20T00:00:00Z",
            profiles=[("account_9001", "user_901", "Ana Prueba", "ana.nueva@example.test", "DELETED")],
            connectors=[("data_flow_9001", "user_901", "ana.vieja@example.test", 0)]),
        "evidence/databases/inventory_20260220.sql": _snapshot(
            "2026-02-20T00:00:00Z",
            profiles=[("account_9002", "user_902", "Luis Ensayo", "luis.ensayo@example.test", "ACTIVE")]),
    }
    for rel, text in files.items():
        with open(os.path.join(root, rel), "w", encoding="utf-8") as fh:
            fh.write(text)
    _write_csv(os.path.join(root, "deletion_requests.csv"),
               ["case_id", "email", "requested_at", "reported_status", "reported_at", "audit_at", "request_text"], [
        ["case_9001", "ana.vieja@example.test", "2026-03-01T00:00:00Z", "COMPLETE", "2026-03-04T00:00:00Z",
         "2026-03-10T00:00:00Z", "Please delete my account and all my personal data."],
        ["case_9002", "luis.ensayo@example.test", "2026-03-01T00:00:00Z", "COMPLETE", "2026-03-04T00:00:00Z",
         "2026-03-10T00:00:00Z", "Bitte löschen Sie mein Konto und alle meine Daten."],
        ["case_9004", "luis.ensayo@example.test", "2026-03-01T00:00:00Z", "NOT_STARTED", "2026-03-04T00:00:00Z",
         "2026-03-10T00:00:00Z", "Please send me a copy of my data; do not delete anything."],
    ])
    return root


# expected answer for case_9001: (phase, system_id, resource_id, operation, evidence_id) in output order
CASE_9001 = [
    ("FINDING", "account_service", "account_9001", "REPORT_REMAINING_RECORD", "evidence_901"),
    ("FINDING", "support_platform", "support_9001", "REPORT_EXPOSED_PII", "evidence_902"),
    ("FINDING", "integration_service", "data_flow_9001", "REPORT_ACTIVE_DATA_FLOW", "evidence_901"),
    ("REMEDIATION", "integration_service", "data_flow_9001", "DISABLE_DATA_FLOW", ""),
    ("REMEDIATION", "account_service", "account_9001", "DELETE_RECORD", ""),
    ("REMEDIATION", "support_platform", "support_9001", "REDACT_RECORD", ""),
    ("VERIFICATION", "account_service", "account_9001", "VERIFY_RECORD_ABSENT", ""),
    ("VERIFICATION", "security_service", "audit_record_9001", "VERIFY_RECORD_PRESENT", ""),
    ("VERIFICATION", "support_platform", "support_9001", "VERIFY_RECORD_REDACTED", ""),
    ("VERIFICATION", "integration_service", "data_flow_9001", "VERIFY_DATA_FLOW_DISABLED", ""),
    ("VERIFICATION", "backup_service", "backup_9001", "VERIFY_RESTORE_BLOCKED", ""),
]
