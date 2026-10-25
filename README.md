# Ghost Data Still Exists: deletion-audit agent

Submission for HackerRank Orchestrate, October 2026. The challenge contract is in
[`problem_statement.md`](./problem_statement.md).

For every request in `dataset/deletion_requests.csv`, the agent does four things:

1. It decides whether the text authorizes deletion. Claude classifies the intent, with a multilingual keyword fallback.
2. It rebuilds who the person is, using the current identity and every historical email, phone and hash.
3. It reconstructs the state of each of the person's records at `audit_at` from the evidence files and the activity stream.
4. It applies `deletion_rules.csv` and writes `COMPLETE`, `INCOMPLETE` or `NOT_APPLICABLE` with the ordered finding, remediation and verification steps.

## Setup

Python 3.10 or newer.

```bash
pip install -r code/requirements.txt
```

The Claude API key is optional and is read from the environment only:

```bash
export ORCHESTRATE_ANTHROPIC_API_KEY=...   # or ANTHROPIC_API_KEY
```

Every Claude answer is cached in `code/cache/llm/`, and the cache ships with the code. A run without a key
replays those cached answers and produces the same `output.csv` byte for byte.

## Run

From the repository root:

```bash
python code/main.py                 # writes ./output.csv (518 rows)
python code/main.py --llm off       # fully offline: keyword intent, PDFs only, no screenshot reading
python code/main.py --llm live      # require the API (fails if no key is set)
python code/main.py --requests sample_deletion_requests.csv --out code/runs/sample_output.csv
```

Each run also writes:

- `code/runs/trace.jsonl`: one line per case with the resolved identity, every resource with its state, its evidence and why it was linked, and the intent decision.
- `code/runs/usage.json`: model calls, tokens and cost.

The run takes about 2 seconds when the cache is warm. The cache-filling run with live calls took about 10 minutes and cost about $0.05 (`code/evaluation/usage_report.md`).

## Evaluate

```bash
python code/evaluation/main.py --custom     # runs the 32 public samples and the participant-made cases
python code/evaluation/main.py --pred some.csv --gold dataset/sample_output.csv
```

Unit and regression tests (standard library only, no API key, about 3 seconds):

```bash
python -m unittest discover -s code/tests -t code -v
```

- `test_extractors.py`: the six log formats, trace-id joins, SQL snapshots and how records become states.
- `test_policy_and_contract.py`: every policy action, step ordering and each output-contract violation.
- `test_investigation.py`: a small fictional dataset (`code/tests/fixtures.py`) with a historical email, evidence
  captured before `requested_at` and after `audit_at`, and one `INCOMPLETE`, one `COMPLETE` and one
  `NOT_APPLICABLE` case checked step by step.
- `test_intent_and_llm.py`: multilingual keyword intent, the LLM fallback and the response cache.
- `test_regression.py`: sample scores must not drop, the gold samples pass the validator, and a rerun reproduces
  `output.csv` byte for byte. It is skipped when `dataset/` is not present.

The results, the custom cases and the failure log are in
[`code/evaluation/evaluation_report.md`](code/evaluation/evaluation_report.md). Token usage and cost are in
[`code/evaluation/usage_report.md`](code/evaluation/usage_report.md).

## Architecture

```
request ──► intent (Claude Haiku, keyword fallback) ──► NOT_APPLICABLE → []
              │
              ▼
identity resolver (snapshot + audit log: emails, phones, hashes, sha256(email), user_id)
              │
              ▼
evidence extractors ──► Observation(file, captured_at, ts, resource, present / exposed / active, links)
  logs (6 formats, trace-id joins) · SQLite snapshots and replicas · JSON snapshots, exports, lookups
  · handover text · PDFs (pypdf) · screenshots (Claude vision, cached)
              │
              ▼
investigator
  · find the subject's resources: observations whose identifiers match, inside [requested_at, audit_at]
  · catalog links (LINK_RESOURCE_IDENTITY) and the documents they reference
  · batch attribution of identifier-less worker targets (see below)
  · state at audit_at = latest observation not after audit_at, from a file captured in the window
              │
              ▼
policy (deletion_rules.csv) ──► findings → remediation → verification, ordered and numbered
              │
              ▼
contract validator (operations, states, phase order, evidence rules, no evidence after audit_at) ──► output.csv
```

| Module | Role |
|---|---|
| `code/ghost_audit/dataset.py` | Loads the CSVs and the evidence manifest and dispatches files to the extractors. |
| `code/ghost_audit/observations.py` | Parsers for logs, SQL (run in in-memory SQLite), JSON and text records. |
| `code/ghost_audit/media.py` | PDF parsing and the Claude vision transcription of screenshots (prompt and schema are here). |
| `code/ghost_audit/identity.py` | Current and historical identifiers of the subject. |
| `code/ghost_audit/investigate.py` | Resource discovery, state at `audit_at`, batch attribution and planning. |
| `code/ghost_audit/policy.py` | Rule lookup, the step vocabulary and step ordering. |
| `code/ghost_audit/intent.py` | Intent prompt and schema, plus the keyword fallback. |
| `code/ghost_audit/llm.py` | Claude client: structured JSON output, response cache, token and cost accounting. |
| `code/ghost_audit/validate.py` | Output contract checks, also used by the evaluator. |
| `code/ghost_audit/pipeline.py` | End-to-end run. |

### Investigation rules

- **Claims are not proof.** `reported_status`, workflow results and "completed" messages never decide a state. Only an observation of the record does: a row in a snapshot, a lookup that returned rows or a 404, a scan, an export entry, a connector or restore setting, a document or a screen.
- **Time.** An observation counts when its file was captured inside `[requested_at, audit_at]` and the fact itself is not later than `audit_at`. When several files describe a record, the latest observation wins. Facts with the same timestamp are merged conservatively: present if any copy is present.
- **Replica drift.** A complete snapshot that does not list a record proves absence only when nothing else in the window shows the record. An empty primary snapshot never hides a record that is still on a failover replica.
- **Policy.**
  - `DELETE`: a present record gives `REPORT_REMAINING_RECORD`, then `DELETE_RECORD`, then `VERIFY_RECORD_ABSENT`.
  - `REDACT` and `ANONYMIZE`: exposed identifiers give `REPORT_EXPOSED_PII`, then `REDACT_RECORD` or `ANONYMIZE_RECORD`, then the matching verification. A tombstone keeps the stable `user_id`.
  - `RETAIN`: security audit logs and legal holds give `VERIFY_RECORD_PRESENT`.
  - Data flows that are active give `REPORT_ACTIVE_DATA_FLOW`, then `DISABLE_DATA_FLOW`, then `VERIFY_DATA_FLOW_DISABLED`.
  - Backups that can still be restored give `REPORT_RESTORE_RISK`, then `BLOCK_RESTORE`, then `VERIFY_RESTORE_BLOCKED`.
- **Ordering.** Steps go FINDING, then REMEDIATION, then VERIFICATION. Within each phase they follow the operation order of the contract table, so data flows are disabled and restores blocked before records change. Ties are broken by system and resource.
- **Evidence.**
  - Findings cite the file that shows the problem.
  - In an `INCOMPLETE` case, remediation and verification steps have an empty `evidence_id`.
  - A `COMPLETE` case lists only verification steps that cite the evidence proving the compliant state.
  - For absence, the proof is the latest complete snapshot of that system in the window that does not list the record.
  - Retained records whose link to the subject is documented only after `audit_at` are added to the post-remediation checks of an incomplete case. They are never cited.

### Batch attribution

Some deletion-worker targets carry no identifier anywhere, for example a profile lookup that returns 404 or an analytics row that is already anonymized. Requests that share a `reported_at` were processed in one worker run. Each worker event is placed in the run whose timing matches its template. The event's target is then given to the request that:

- still lacks a resource of that system;
- shows the target in the same evidence files as its other resources;
- has a reported status that matches the worker result (for example, `NOT_STARTED` matches `FAILED`).

The worker handles a run's profiles in the order the requests were submitted, starting at an arbitrary request (a ring). That ring, anchored on profiles whose owner is known from identifiers, settles most remaining ties. Assignments that stay ambiguous are marked `batch-guess` in the trace.

## Use of Claude

- Model: `claude-haiku-5-5`, the smallest current model. Override it with `--model` or `GHOST_AUDIT_MODEL`.
- Cross-check: the full set was also run with `claude-opus-5-5`. It agreed on all 398 intent decisions and all 11
  screenshots and wrote an identical `output.csv`, at 40 times the cost ($2.01 against $0.05). Its answers are cached,
  so it replays for free (`code/evaluation/evaluation_report.md`, section 4):
  `python code/main.py --llm cache --model claude-opus-5-5 --out code/runs/output_opus.csv --usage code/runs/usage_opus.json`.
- Calls:
  - one intent call per distinct request text (398 texts across both request files);
  - one vision call per screenshot (11).
- Every call uses structured JSON output with a fixed schema and low effort. Thinking is off, except on models that
  cannot turn it off (such as Opus 5.5), where it runs adaptive at low effort. Answers are validated: resource ids and identifiers must be well formed, and the step plan always comes from the deterministic core.
- If the API is missing or fails, the pipeline falls back to the keyword classifier and to PDF-only media. The output stays valid.
- Prompts live in `code/ghost_audit/intent.py` and `code/ghost_audit/media.py`.

## Repository layout

```
code/main.py                 CLI entry point
code/ghost_audit/            agent package
code/evaluation/main.py      evaluator (status, step, field and sequence accuracy)
code/evaluation/custom_cases.json   participant-made cases
code/evaluation/*.md         evaluation and usage reports
code/tests/                  unit and regression tests
code/cache/llm/              cached Claude answers (no secrets)
output.csv                   predictions for dataset/deletion_requests.csv
log.txt                      coding-agent transcript (AGENTS.md)
```

## Packaging

```bash
zip -rD code.zip README.md code -x "*/__pycache__/*" "*/.venv/*" "*/venv/*" "code/runs/*.jsonl"
```
