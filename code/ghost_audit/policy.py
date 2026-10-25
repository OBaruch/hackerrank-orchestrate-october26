"""Deletion policy (from deletion_rules.csv) and the step vocabulary of the output contract."""
from __future__ import annotations

PHASES = ("FINDING", "REMEDIATION", "VERIFICATION")

OPERATION_ORDER = [
    ("FINDING", "REPORT_REMAINING_RECORD", "PRESENT"),
    ("FINDING", "REPORT_EXPOSED_PII", "PRESENT"),
    ("FINDING", "REPORT_ACTIVE_DATA_FLOW", "ACTIVE"),
    ("FINDING", "REPORT_RESTORE_RISK", "ACTIVE"),
    ("REMEDIATION", "DISABLE_DATA_FLOW", "DISABLED"),
    ("REMEDIATION", "BLOCK_RESTORE", "BLOCKED"),
    ("REMEDIATION", "DELETE_RECORD", "ABSENT"),
    ("REMEDIATION", "REDACT_RECORD", "REDACTED"),
    ("REMEDIATION", "ANONYMIZE_RECORD", "ANONYMIZED"),
    ("VERIFICATION", "VERIFY_RECORD_ABSENT", "ABSENT"),
    ("VERIFICATION", "VERIFY_RECORD_PRESENT", "PRESENT"),
    ("VERIFICATION", "VERIFY_RECORD_REDACTED", "REDACTED"),
    ("VERIFICATION", "VERIFY_RECORD_ANONYMIZED", "ANONYMIZED"),
    ("VERIFICATION", "VERIFY_DATA_FLOW_DISABLED", "DISABLED"),
    ("VERIFICATION", "VERIFY_RESTORE_BLOCKED", "BLOCKED"),
]
OP_RANK = {op: i for i, (_, op, _) in enumerate(OPERATION_ORDER)}
OP_PHASE = {op: ph for ph, op, _ in OPERATION_ORDER}
OP_STATE = {op: st for _, op, st in OPERATION_ORDER}

# Process-like resources that are not data categories in deletion_rules.csv
PROCESS_ACTIONS = {"DATA_FLOW": "DISABLE", "BACKUP_ARCHIVE": "BLOCK_RESTORE"}


class Policy:
    """Maps a data category to the action required by deletion_rules.csv."""

    def __init__(self, rules: list[dict]):
        self.rules = {r["data_category"]: r for r in rules}

    def action(self, category: str) -> str:
        if category == "DATA_FLOW":
            return "DISABLE"
        if category == "BACKUP_ARCHIVE":
            return "BLOCK_RESTORE"  # rule_14: retain the archive, block restore access
        rule = self.rules.get(category)
        if rule is None:
            return "DELETE"
        return rule["required_action"]

    def rule_id(self, category: str) -> str | None:
        rule = self.rules.get(category)
        return rule["rule_id"] if rule else None


def plan_for(action: str, present: bool | None, exposed: bool | None, active: bool | None):
    """Return (finding_op, remediation_op, verification_op) for a resource state.

    finding/remediation are None when the resource already has the required treatment.
    """
    if action == "DELETE":
        if present:
            return "REPORT_REMAINING_RECORD", "DELETE_RECORD", "VERIFY_RECORD_ABSENT"
        return None, None, "VERIFY_RECORD_ABSENT"
    if action == "REDACT":
        if present is False:
            return None, None, "VERIFY_RECORD_ABSENT"
        if exposed:
            return "REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"
        return None, None, "VERIFY_RECORD_REDACTED"
    if action == "ANONYMIZE":
        if present is False:
            return None, None, "VERIFY_RECORD_ABSENT"
        if exposed:
            return "REPORT_EXPOSED_PII", "ANONYMIZE_RECORD", "VERIFY_RECORD_ANONYMIZED"
        return None, None, "VERIFY_RECORD_ANONYMIZED"
    if action == "RETAIN":
        return None, None, "VERIFY_RECORD_PRESENT"
    if action == "DISABLE":
        if active:
            return "REPORT_ACTIVE_DATA_FLOW", "DISABLE_DATA_FLOW", "VERIFY_DATA_FLOW_DISABLED"
        return None, None, "VERIFY_DATA_FLOW_DISABLED"
    if action == "BLOCK_RESTORE":
        if active:
            return "REPORT_RESTORE_RISK", "BLOCK_RESTORE", "VERIFY_RESTORE_BLOCKED"
        return None, None, "VERIFY_RESTORE_BLOCKED"
    raise ValueError(action)


def order_steps(steps: list[dict]) -> list[dict]:
    steps = sorted(steps, key=lambda s: (OP_RANK[s["operation"]], s["system_id"], s["resource_id"]))
    out = []
    for i, s in enumerate(steps, 1):
        out.append({
            "step_no": i, "phase": OP_PHASE[s["operation"]], "system_id": s["system_id"],
            "resource_id": s["resource_id"], "operation": s["operation"], "state": OP_STATE[s["operation"]],
            "evidence_id": s.get("evidence_id", ""),
        })
    return out
