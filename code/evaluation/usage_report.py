"""Render code/runs/usage.json (written by code/main.py) as code/evaluation/usage_report.md.

    python code/evaluation/usage_report.py [--usage code/runs/usage.json] [--first-run code/runs/usage_live.json]

--first-run points at the usage file of the run that actually called the API (the cache-filling run);
the final run may replay every answer from the cache and therefore bill nothing itself.
"""
from __future__ import annotations

import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CODE = os.path.dirname(HERE)


def table(u: dict, requests: int) -> list[str]:
    lines = ["| model | provider | calls | live calls | cached replays | input tokens | output tokens | "
             "total tokens | avg tokens / request | est. cost (USD) | est. cost / request (USD) |",
             "|---|---|---|---|---|---|---|---|---|---|---|"]
    for model, m in u["models"].items():
        tot = m["input_tokens"] + m["output_tokens"]
        lines.append(f"| `{model}` | Anthropic | {m['calls']} | {m['live_calls']} | {m['cached_calls']} | "
                     f"{m['input_tokens']:,} | {m['output_tokens']:,} | {tot:,} | {tot / requests:,.1f} | "
                     f"{m['cost_usd']:.4f} | {m['cost_usd'] / requests:.6f} |")
    t = u["total"]
    tot = t["input_tokens"] + t["output_tokens"]
    lines.append(f"| **all models** | | {t['calls']} | {t['live_calls']} | {t['cached_calls']} | "
                 f"{t['input_tokens']:,} | {t['output_tokens']:,} | {tot:,} | {tot / requests:,.1f} | "
                 f"{t['cost_usd']:.4f} | {t['cost_usd'] / requests:.6f} |")
    return lines


def purposes(u: dict) -> list[str]:
    lines = ["| model | purpose | calls | input tokens | output tokens |", "|---|---|---|---|---|"]
    for model, m in u["models"].items():
        for p, v in sorted(m["by_purpose"].items()):
            lines.append(f"| `{model}` | {p} | {v['calls']} | {v['input_tokens']:,} | {v['output_tokens']:,} |")
    return lines


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--usage", default=os.path.join(CODE, "runs", "usage.json"))
    ap.add_argument("--first-run", default=os.path.join(CODE, "runs", "usage_live.json"))
    ap.add_argument("--out", default=os.path.join(HERE, "usage_report.md"))
    args = ap.parse_args(argv)
    with open(args.usage, encoding="utf-8") as fh:
        u = json.load(fh)
    n = u["requests"]
    out = ["# Token usage report", "",
           f"Final full-dataset run that produced `output.csv`: {n} requests "
           f"(`dataset/deletion_requests.csv`), wall time {u['seconds']} s.", "",
           "Model provider: Anthropic (Claude API). Only one model is used. Prices are Anthropic list prices "
           "per million tokens (input / output): " + ", ".join(
               f"`{m}` ${v['price_per_mtok'][0]:.2f} / ${v['price_per_mtok'][1]:.2f}"
               for m, v in u["models"].items() if v.get("price_per_mtok")) + ".", "",
           "Token counts include every Claude answer the run used. *Live calls* were billed during this run; "
           "*cached replays* are answers stored by an earlier identical call (`code/cache/llm/`), counted with the "
           "tokens and cost of that original call so the total reflects what the answers cost to produce.", "",
           "## Per model and overall", ""]
    out += table(u, n)
    out += ["", "## By purpose", "", "Intent calls are made once per distinct request text and reused for "
            "identical texts; the run classifies the texts of both request files because sample requests are part "
            "of the batch context. Screenshot calls are one per image in the evidence manifest.", ""]
    out += purposes(u)
    if os.path.exists(args.first_run):
        with open(args.first_run, encoding="utf-8") as fh:
            f = json.load(fh)
        t = f["total"]
        out += ["", "## Cache-filling run (the run that called the API)", "",
                f"{t['live_calls']} live calls, {t['input_tokens']:,} input and {t['output_tokens']:,} output tokens, "
                f"billed ${t['live_cost_usd']:.4f}."]
    out += ["", f"API failures or invalid answers that fell back to the deterministic path: {u.get('failures', 0)}.",
            "", "The deterministic core (evidence parsing, identity, state reconstruction, policy, ordering) uses no "
            "model calls. With `--llm off` the whole run makes zero calls and still writes a valid `output.csv`."]
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
