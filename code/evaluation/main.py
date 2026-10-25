"""Score predictions against a labelled answer file.

    python code/evaluation/main.py                         # run the agent on the 32 public samples and score
    python code/evaluation/main.py --pred code/runs/sample_output.csv --gold dataset/sample_output.csv
    python code/evaluation/main.py --custom                # also run the participant-made cases

Metrics
- status accuracy: deletion_status equal.
- step precision / recall / F1: steps compared as (phase, system_id, resource_id, operation, state, evidence_id)
  multisets, micro-averaged over cases.
- field accuracy: gold steps aligned to predicted steps by (system_id, resource_id, phase); share of each
  field that matches, over all gold steps (an unmatched gold step counts as wrong on every field).
- sequence accuracy: share of cases whose steps_json array equals the gold array exactly (order included);
  plus order accuracy: share of cases whose commonly-found steps appear in the same relative order.
"""
from __future__ import annotations

import argparse
import collections
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CODE = os.path.dirname(HERE)
ROOT = os.path.dirname(CODE)
sys.path.insert(0, CODE)

KEY = ("phase", "system_id", "resource_id", "operation", "state", "evidence_id")
FIELDS = ("step_no", "phase", "system_id", "resource_id", "operation", "state", "evidence_id")


def load(path):
    with open(path, encoding="utf-8", newline="") as fh:
        return {r["case_id"]: r for r in csv.DictReader(fh)}


def score(pred: dict, gold: dict) -> dict:
    n = len(gold)
    status_ok = exact = order_ok = 0
    tp = fp = fn = 0
    field_hits = collections.Counter()
    gold_steps_total = 0
    confusion = collections.Counter()
    per_case = []
    for cid, g in sorted(gold.items()):
        p = pred.get(cid, {"deletion_status": "MISSING", "steps_json": "[]"})
        gs, ps = json.loads(g["steps_json"]), json.loads(p["steps_json"])
        confusion[(g["deletion_status"], p["deletion_status"])] += 1
        s_ok = g["deletion_status"] == p["deletion_status"]
        status_ok += s_ok
        exact += gs == ps
        gk = collections.Counter(tuple(s[k] for k in KEY) for s in gs)
        pk = collections.Counter(tuple(s[k] for k in KEY) for s in ps)
        c_tp = sum((gk & pk).values())
        tp += c_tp
        fp += sum(pk.values()) - c_tp
        fn += sum(gk.values()) - c_tp
        # field accuracy
        pool = collections.defaultdict(list)
        for s in ps:
            pool[(s["system_id"], s["resource_id"], s["phase"])].append(s)
        for s in gs:
            gold_steps_total += 1
            cand = pool.get((s["system_id"], s["resource_id"], s["phase"]))
            if not cand:
                continue
            best = max(cand, key=lambda x: sum(x[f] == s[f] for f in FIELDS))
            cand.remove(best)
            for f in FIELDS:
                field_hits[f] += best[f] == s[f]
        # relative order of the steps both sides share
        common = [tuple(s[k] for k in KEY) for s in gs if tuple(s[k] for k in KEY) in pk]
        pred_order = [tuple(s[k] for k in KEY) for s in ps if tuple(s[k] for k in KEY) in gk]
        order_ok += common == pred_order
        if not s_ok or gs != ps:
            per_case.append({
                "case_id": cid, "gold_status": g["deletion_status"], "pred_status": p["deletion_status"],
                "missing": [list(k) for k in (gk - pk).elements()], "extra": [list(k) for k in (pk - gk).elements()],
            })
    prec = tp / (tp + fp) if tp + fp else 1.0
    rec = tp / (tp + fn) if tp + fn else 1.0
    return {
        "cases": n,
        "status_accuracy": status_ok / n if n else 0,
        "step_precision": prec, "step_recall": rec,
        "step_f1": 2 * prec * rec / (prec + rec) if prec + rec else 0,
        "steps": {"gold": tp + fn, "pred": tp + fp, "matched": tp},
        "field_accuracy": {f: field_hits[f] / gold_steps_total if gold_steps_total else 0 for f in FIELDS},
        "sequence_accuracy": exact / n if n else 0,
        "order_accuracy": order_ok / n if n else 0,
        "status_confusion": {f"{g}->{p}": c for (g, p), c in sorted(confusion.items())},
        "mismatches": per_case,
    }


def fmt(m: dict, title: str) -> str:
    lines = [f"### {title}", "",
             "| metric | value |", "|---|---|",
             f"| cases | {m['cases']} |",
             f"| status accuracy | {m['status_accuracy']:.1%} |",
             f"| step precision | {m['step_precision']:.1%} |",
             f"| step recall | {m['step_recall']:.1%} |",
             f"| step F1 | {m['step_f1']:.1%} |",
             f"| sequence accuracy (exact steps_json) | {m['sequence_accuracy']:.1%} |",
             f"| relative order accuracy | {m['order_accuracy']:.1%} |",
             "", "| field | accuracy |", "|---|---|"]
    lines += [f"| {f} | {v:.1%} |" for f, v in m["field_accuracy"].items()]
    lines += ["", "Status confusion (gold->pred): " + ", ".join(f"{k}: {v}" for k, v in m["status_confusion"].items())]
    if m["mismatches"]:
        lines += ["", "Mismatched cases:"]
        for c in m["mismatches"]:
            lines.append(f"- {c['case_id']} gold {c['gold_status']} / pred {c['pred_status']}: "
                         f"missing {len(c['missing'])}, extra {len(c['extra'])}")
            for k in c["missing"]:
                lines.append(f"  - missing `{' '.join(k)}`")
            for k in c["extra"]:
                lines.append(f"  - extra `{' '.join(k)}`")
    return "\n".join(lines)


def run_agent(requests: list | None, requests_file: str, llm: str, model: str | None = None):
    from ghost_audit.pipeline import run

    res = run(os.path.join(ROOT, "dataset"), requests_file, llm_mode=llm, model=model, extra_requests=requests)
    return {r["case_id"]: r for r in res.rows}, res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pred", help="existing prediction CSV (skip running the agent)")
    ap.add_argument("--gold", default=os.path.join(ROOT, "dataset", "sample_output.csv"))
    ap.add_argument("--llm", default="auto", choices=["auto", "cache", "live", "off"])
    ap.add_argument("--model", default=None, help="Claude model id (default: the agent's default model)")
    ap.add_argument("--custom", action="store_true", help="also score evaluation/custom_cases.json")
    ap.add_argument("--json", help="write the metrics as JSON here")
    args = ap.parse_args(argv)

    gold = load(args.gold)
    if args.pred:
        pred = load(args.pred)
    else:
        pred, _ = run_agent(None, "sample_deletion_requests.csv", args.llm, args.model)
    m = score(pred, gold)
    out = {"samples": m}
    print(fmt(m, "Public samples"))

    if args.custom:
        with open(os.path.join(HERE, "custom_cases.json"), encoding="utf-8") as fh:
            custom = json.load(fh)
        reqs = [c["request"] for c in custom]
        cpred, _ = run_agent(reqs, "deletion_requests.csv", args.llm, args.model)
        cgold = {c["request"]["case_id"]: {"case_id": c["request"]["case_id"], "deletion_status": c["expected_status"],
                                           "steps_json": json.dumps(c["expected_steps"])} for c in custom}
        cm = score(cpred, cgold)
        out["custom"] = cm
        print()
        print(fmt(cm, "Participant-made cases"))
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(out, fh, indent=2)


if __name__ == "__main__":
    main()
