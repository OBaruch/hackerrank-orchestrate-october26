"""End-to-end run: intent -> evidence extraction -> batch attribution -> per-case audit -> validated rows."""
from __future__ import annotations

import csv
import json
import os
import time
from dataclasses import dataclass

from .dataset import Dataset
from .intent import IntentClassifier
from .investigate import Investigator
from .llm import LLM, UsageTracker
from .media import MediaReader
from .validate import check_row, serialize

CONTEXT_FILES = ("sample_deletion_requests.csv", "deletion_requests.csv")


def case_num(cid: str) -> int:
    try:
        return int(cid.rsplit("_", 1)[1])
    except (IndexError, ValueError):
        return 10 ** 9


@dataclass
class RunResult:
    rows: list
    traces: list
    usage: dict
    errors: dict
    seconds: float
    unread_media: list


def run(dataset_dir: str, requests_file: str = "deletion_requests.csv", llm_mode: str = "auto",
        model: str | None = None, extra_requests: list | None = None) -> RunResult:
    t0 = time.time()
    tracker = UsageTracker()
    llm = None if llm_mode == "off" else LLM(model=model, mode=llm_mode, tracker=tracker)
    ds = Dataset(dataset_dir)
    media = MediaReader(ds, llm)
    ds.media_reader = media
    inv = Investigator(ds)
    clf = IntentClassifier(llm)

    targets = ds.requests(requests_file) if extra_requests is None else extra_requests
    # every participant-visible request is batch context: worker runs mix requests from both files
    context, seen = [], set()
    for name in CONTEXT_FILES:
        path = os.path.join(dataset_dir, name)
        if os.path.exists(path):
            for r in ds.requests(name):
                if r["case_id"] not in seen:
                    seen.add(r["case_id"])
                    context.append(dict(r))
    for r in targets:
        if r["case_id"] not in seen:
            seen.add(r["case_id"])
            context.append(dict(r))
    intents, by_text = {}, {}
    for r in context:
        text = r["request_text"]
        if text not in by_text:
            by_text[text] = clf.classify(text)
        intents[r["case_id"]] = by_text[text]
        r["_deletion"] = by_text[text]["authorizes_deletion"]
    inv.attribute_batches(context)

    rows, traces, errors = [], [], {}
    for r in sorted(targets, key=lambda x: case_num(x["case_id"])):
        intent = intents[r["case_id"]]
        res = inv.audit(r, is_deletion=intent["authorizes_deletion"])
        errs = check_row(res.status, res.steps, r["audit_at"], ds.manifest)
        if errs:
            errors[r["case_id"]] = errs
        rows.append({"case_id": r["case_id"], "deletion_status": res.status, "steps_json": serialize(res.steps)})
        traces.append({
            "case_id": r["case_id"], "status": res.status, "intent": intent,
            "subject": res.subject.to_dict() if res.subject else None,
            "resources": [s.to_dict() for s in res.resources], "notes": res.notes, "contract_errors": errs,
        })
    return RunResult(rows, traces, tracker.summary(), errors, time.time() - t0, sorted(set(media.unread)))


def write_output(rows: list, path: str):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["case_id", "deletion_status", "steps_json"], lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def write_traces(traces: list, path: str):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        for t in traces:
            fh.write(json.dumps(t, ensure_ascii=False, sort_keys=True) + "\n")
