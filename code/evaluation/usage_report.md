# Token usage report

Final full-dataset run that produced `output.csv`: 518 requests (`dataset/deletion_requests.csv`), wall time 1.65 s.

Model provider: Anthropic (Claude API). Only one model is used. Prices are Anthropic list prices per million tokens (input / output): `claude-haiku-5-5` $0.10 / $0.50.

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

API failures or invalid answers that fell back to the deterministic path: 0.

The deterministic core (evidence parsing, identity, state reconstruction, policy, ordering) uses no model calls. With `--llm off` the whole run makes zero calls and still writes a valid `output.csv`.
