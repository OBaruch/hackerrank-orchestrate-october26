# Token usage report

Final full-dataset run that produced `output.csv`: 518 requests (`dataset/deletion_requests.csv`), wall time 1.65 s.

Model provider: Anthropic (Claude API). The run that produced `output.csv` uses one model; cross-check runs of other models are listed at the end with per-model and overall totals. Prices are Anthropic list prices per million tokens (input / output): `claude-haiku-5-5` $0.10 / $0.50.

Token counts include every Claude answer the run used. *Live calls* were billed during this run; *cached replays* are answers stored by an earlier identical call (`code/cache/llm/`), counted with the tokens and cost of that original call so the total reflects what the answers cost to produce.

## Per model and overall

| model | provider | calls | live calls | cached replays | input tokens | output tokens | total tokens | avg tokens / request | est. cost (USD) | est. cost / request (USD) |
|---|---|---|---|---|---|---|---|---|---|---|
| `claude-haiku-5-5` | Anthropic | 409 | 0 | 409 | 311,344 | 39,099 | 350,443 | 676.5 | 0.0507 | 0.000098 |
| **all models** | | 409 | 0 | 409 | 311,344 | 39,099 | 350,443 | 676.5 | 0.0507 | 0.000098 |

## By purpose

Intent calls are made once per distinct request text and reused for identical texts; the run classifies the texts of both request files because sample requests are part of the batch context. Screenshot calls are one per image in the evidence manifest.

| model | purpose | calls | input tokens | output tokens |
|---|---|---|---|---|
| `claude-haiku-5-5` | intent | 398 | 270,299 | 35,920 |
| `claude-haiku-5-5` | screenshot | 11 | 41,045 | 3,179 |

## Cache-filling run (the run that called the API)

409 live calls, 311,344 input and 39,099 output tokens, billed $0.0507, wall time 582.03 s. The final run replays exactly these answers from the cache, so it bills nothing itself.

Cache-filling run on commit 33983bb (helper thread with the API key), as reported by that run: 409 live calls, 0 failures. Token counts per call are the ones stored with each cached answer.

## All full runs, by model

Cache-filling runs over the same 518 requests (same prompts and schemas), the final model first. Their answers are cached too, so `python code/main.py --model <id>` reproduces each run for free. List prices of the other models (input / output per million tokens): `claude-opus-5-5` $4.00 / $20.00.

| model | calls | input tokens | output tokens | total tokens | avg tokens / request | cost (USD) | cost / request (USD) | wall time (s) | failures |
|---|---|---|---|---|---|---|---|---|---|
| `claude-haiku-5-5` | 409 | 311,344 | 39,099 | 350,443 | 676.5 | 0.0507 | 0.000098 | 582.03 | 0 |
| `claude-opus-5-5` | 409 | 311,753 | 38,075 | 349,828 | 675.3 | 2.0085 | 0.003877 | 1193.34 | 0 |
| **all runs** | 818 | 623,097 | 77,174 | 700,271 | 1,351.9 | 2.0592 | 0.003975 | | |

Cross-check run with `claude-opus-5-5` (2026-10-25, `python code/main.py --llm live --model claude-opus-5-5`): 405 live calls plus 4 answers cached by a smoke test minutes earlier with the same prompts, 0 failures. Opus 5.5 cannot run with thinking disabled, so its requests use adaptive thinking at effort low with 4,096 extra max_tokens; thinking tokens are included in the output tokens. Its output.csv is identical to the Haiku run, row for row. Scoring the participant-made cases with Opus afterwards made 2 more intent calls for their new texts (1,333 input and 155 output tokens, about $0.008), not included in the table.

API failures or invalid answers that fell back to the deterministic path: 0.

The deterministic core (evidence parsing, identity, state reconstruction, policy, ordering) uses no model calls. With `--llm off` the whole run makes zero calls and still writes a valid `output.csv`.
