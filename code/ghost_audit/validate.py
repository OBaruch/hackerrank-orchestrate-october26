"""Contract checks applied to every answer before it is written (and reused by the evaluator)."""
from __future__ import annotations

import json

from . import policy as P

STATUSES = ("COMPLETE", "INCOMPLETE", "NOT_APPLICABLE")
FIELDS = ("step_no", "phase", "system_id", "resource_id", "operation", "state", "evidence_id")


def check_row(status: str, steps: list, audit_at: str | None = None, manifest: dict | None = None,
              known_ids: set | None = None) -> list[str]:
    """Return a list of contract violations (empty when the row is valid)."""
    errs = []
    if status not in STATUSES:
        errs.append(f"bad status {status}")
    if status == "NOT_APPLICABLE" and steps:
        errs.append("NOT_APPLICABLE must have no steps")
    if status == "INCOMPLETE" and not any(s.get("phase") == "FINDING" for s in steps):
        errs.append("INCOMPLETE without findings")
    if status == "COMPLETE" and any(s.get("phase") != "VERIFICATION" for s in steps):
        errs.append("COMPLETE with non-verification steps")
    last_phase = 0
    for i, s in enumerate(steps, 1):
        if set(s) != set(FIELDS):
            errs.append(f"step {i}: fields {sorted(s)}")
            continue
        if s["step_no"] != i:
            errs.append(f"step {i}: step_no {s['step_no']}")
        op = s["operation"]
        if op not in P.OP_PHASE:
            errs.append(f"step {i}: unknown operation {op}")
            continue
        if P.OP_PHASE[op] != s["phase"] or P.OP_STATE[op] != s["state"]:
            errs.append(f"step {i}: phase/state mismatch for {op}")
        rank = P.PHASES.index(s["phase"])
        if rank < last_phase:
            errs.append(f"step {i}: phase order")
        last_phase = rank
        ev = s["evidence_id"]
        if s["phase"] == "FINDING" and not ev:
            errs.append(f"step {i}: finding without evidence")
        if status == "INCOMPLETE" and s["phase"] != "FINDING" and ev:
            errs.append(f"step {i}: future step cites evidence")
        if status == "COMPLETE" and not ev:
            errs.append(f"step {i}: verification without evidence")
        if ev and manifest is not None and ev.startswith("evidence_"):
            ef = manifest.get(ev)
            if ef is None:
                errs.append(f"step {i}: unknown evidence {ev}")
            elif audit_at and ef.captured_at > audit_at:
                errs.append(f"step {i}: evidence {ev} captured after audit_at")
        if ev and known_ids is not None and not ev.startswith("evidence_") and ev not in known_ids:
            errs.append(f"step {i}: unknown evidence {ev}")
    return errs


def serialize(steps: list) -> str:
    return json.dumps(steps, ensure_ascii=False, separators=(",", ":"))
