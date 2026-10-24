"""Ghost Data Still Exists: deletion-audit agent.

Usage (from the repository root):
    python code/main.py                       # writes ./output.csv for dataset/deletion_requests.csv
    python code/main.py --llm off             # fully offline: keyword intent, no screenshot reading
    python code/main.py --requests sample_deletion_requests.csv --out code/runs/sample_output.csv

The API key, when used, is read from ORCHESTRATE_ANTHROPIC_API_KEY (or ANTHROPIC_API_KEY).
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from ghost_audit.pipeline import run, write_output, write_traces  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dataset", default=os.path.join(ROOT, "dataset"))
    ap.add_argument("--requests", default="deletion_requests.csv", help="request file inside --dataset")
    ap.add_argument("--out", default=os.path.join(ROOT, "output.csv"))
    ap.add_argument("--llm", choices=["auto", "cache", "live", "off"], default="auto",
                    help="auto: call Claude when a key is set, otherwise replay cached answers")
    ap.add_argument("--model", default=None, help="Claude model id (default claude-haiku-5-5)")
    ap.add_argument("--trace", default=os.path.join(HERE, "runs", "trace.jsonl"))
    ap.add_argument("--usage", default=os.path.join(HERE, "runs", "usage.json"))
    args = ap.parse_args(argv)

    res = run(args.dataset, args.requests, llm_mode=args.llm, model=args.model)
    write_output(res.rows, args.out)
    write_traces(res.traces, args.trace)
    usage = dict(res.usage, requests=len(res.rows), seconds=round(res.seconds, 2), unread_media=res.unread_media)
    with open(args.usage, "w", encoding="utf-8") as fh:
        json.dump(usage, fh, indent=2, sort_keys=True)

    counts = {}
    for r in res.rows:
        counts[r["deletion_status"]] = counts.get(r["deletion_status"], 0) + 1
    print(f"wrote {len(res.rows)} rows to {args.out}: {counts}")
    t = res.usage["total"]
    print(f"LLM: {t['calls']} calls ({t['live_calls']} live, {t['cached_calls']} cached), "
          f"{t['input_tokens']} in / {t['output_tokens']} out tokens, ~${t['cost_usd']:.4f}")
    if res.unread_media:
        print(f"screenshots not transcribed (no key and no cache): {', '.join(res.unread_media)}")
    if res.errors:
        print(f"contract violations in {len(res.errors)} cases:")
        for cid, errs in list(res.errors.items())[:20]:
            print("  ", cid, errs)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
