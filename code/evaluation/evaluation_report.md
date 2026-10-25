# Evaluation report

How to reproduce:

```bash
python code/evaluation/main.py --custom              # agent on the 32 public samples + participant-made cases
python code/evaluation/main.py --llm off --custom    # same, with no model call at all
```

The evaluator (`code/evaluation/main.py`) compares the agent's rows with `dataset/sample_output.csv`. It reports these metrics:

| metric | definition |
|---|---|
| status accuracy | Share of cases whose `deletion_status` matches. |
| step precision / recall / F1 | Steps compared as `(phase, system_id, resource_id, operation, state, evidence_id)` multisets, micro-averaged over all cases. |
| field accuracy | Gold steps are aligned to predicted steps by `(system_id, resource_id, phase)`. Each field is then compared. A gold step with no prediction counts as wrong on every field. |
| sequence accuracy | Share of cases whose `steps_json` array equals the gold array exactly, including order and `step_no`. |
| relative order accuracy | Share of cases where the steps found by both sides appear in the same order. |

## 1. Results on the 32 public samples

<!-- RESULTS:SAMPLES -->
Final configuration: deterministic core plus Claude `claude-haiku-5-5` for intent and screenshots. The cached answers make the run reproducible. Intent is never the error source on the samples: all 32 public requests are deletion requests, and both the model and the keyword fallback classify them correctly.

| metric | value |
|---|---|
| cases | 32 |
| status accuracy | **100.0 %** (32 / 32) |
| step precision | 99.5 % |
| step recall | 97.9 % |
| step F1 | **98.7 %** (189 of 193 gold steps found, 1 extra) |
| sequence accuracy (exact `steps_json`) | **87.5 %** (28 / 32) |
| relative order accuracy | 100.0 % |

| field | accuracy |
|---|---|
| step_no | 95.3 % |
| phase | 97.9 % |
| system_id | 97.9 % |
| resource_id | 97.9 % |
| operation | 97.9 % |
| state | 97.9 % |
| evidence_id | 97.9 % |

Status confusion (gold → predicted): COMPLETE → COMPLETE 10, INCOMPLETE → INCOMPLETE 22.

The four remaining mismatches:

| case | difference | why |
|---|---|---|
| case_03 | `analytics_9406` expected, `analytics_5589` predicted | Two already-anonymized analytics rows were treated in the same worker run for two requests. Neither row carries any identifier in any file, so the pairing is a 50/50 tie that is broken in a stable order. |
| case_04 | `account_004 VERIFY_RECORD_ABSENT evidence_54` missing | `account_004` does not appear in any participant-visible file or activity row. |
| case_18 | `audit_record_6645 VERIFY_RECORD_PRESENT` missing | The record id appears in no participant-visible file. |
| case_20 | `audit_record_5569 VERIFY_RECORD_PRESENT` missing | Same as case_18. |
With `--llm off`, which uses only the keyword intent and PDFs and makes no model call, the sample metrics are identical. The public samples contain no screenshot-dependent request.

### Claude's contribution on the evaluation set

- **Intent.** Claude classified all 398 distinct request texts. It marks exactly 10 of the 518 evaluation requests as not authorizing deletion (case_533 to case_542):
  - phone, name or email corrections;
  - marketing opt-out;
  - data export;
  - access and invoice requests;
  - login help.

  The keyword fallback agrees on every evaluation request.
- **Screenshots.** Claude vision transcribed the 11 screenshots into records: labels, identifiers, masking, and connector or restore state. Twelve evaluation requests depend on a screenshot or a PDF that the data catalog links to the subject. Without the screenshots, nine of them come out empty and case_46 lacks its tombstone step. With the transcriptions:

| case | evidence | result |
|---|---|---|
| case_33 | PDF statement NST-2026-0718-1842 (`evidence_18`) | `export_1842` still downloadable → REPORT_REMAINING_RECORD |
| case_34 | customer console (`evidence_04`) | `account_5762` shown live with email and phone → REPORT_REMAINING_RECORD |
| case_35 | search inspector (`evidence_09`) | `search_428` still indexed; the similar `g.silva76.jr@` document is left alone |
| case_39 | connector console (`evidence_14`) | `data_flow_1121` healthy and syncing the subject → REPORT_ACTIVE_DATA_FLOW |
| case_45 | security explorer (`evidence_37`) | six signed `user_03` audit events retained → VERIFY_RECORD_PRESENT, COMPLETE |
| case_46 | customer reference registry (`evidence_42`) | tombstone keeps only `user_17`, no name or contact → VERIFY_RECORD_REDACTED, COMPLETE |
| case_50 | analytics profile (`evidence_19`) | `analytics_7438` still shows email and name → REPORT_EXPOSED_PII |
| case_52 | download center (`evidence_23`) | `export_1260` still listed → REPORT_REMAINING_RECORD |
| case_53 | support console (`evidence_28`) | `support_1034` still shows the customer's name and email → REPORT_EXPOSED_PII |
| case_55 | backup console (`evidence_32`) | archive `backup_9287` holds the account with no restore block → REPORT_RESTORE_RISK |
| case_61 | object storage browser (`evidence_46`) | `delivery_confirmation_19.pdf` (`object_19`) still stored → REPORT_REMAINING_RECORD |
| case_63 | marketing console (`evidence_60`) | `marketing_001` live → REPORT_REMAINING_RECORD |
<!-- /RESULTS:SAMPLES -->

## 2. Participant-made evaluation cases

These cases are in `code/evaluation/custom_cases.json`. They are scored with the same evaluator (`--custom`). Each one isolates one behavior, and its expected answer was derived from the participant-visible evidence alone.

### custom_01: Spanish access request that refuses deletion

- Request: `carlos.mendoza@gmail.com`, *"¿Pueden enviarme una copia de los datos personales que tienen sobre mí? No quiero borrar la cuenta."*
- Tests: intent. The text contains the deletion verb *borrar*, but it is a copy-of-data request that explicitly says not to delete.
- Expected: `NOT_APPLICABLE`, `[]`.

### custom_02: Portuguese marketing opt-out

- Request: the subject of case_24, *"Quero apenas deixar de receber e-mails promocionais. Não excluam minha conta."*
- Tests: intent in another language. This is an opt-out only, with an instruction not to delete. Evidence for this person exists, but it must not be used.
- Expected: `NOT_APPLICABLE`, `[]`.

### custom_03: Request sent from a historical email address

- Request: public case_12 resent from `minjun.kim90@gmail.com`. That is the subject's previous email, replaced on 2026-05-18 (`user_audit_log` audit_282).
- Tests: identity resolution through history. The agent must resolve `user_12` and reach exactly the public answer of case_12 (5 steps: exposed `analytics_9914` to anonymize, `account_9797` absent, `audit_record_2945` retained).
- Expected: `INCOMPLETE` with the case_12 gold steps.

### custom_04: Later audit time makes a newer snapshot citable

- Request: public case_24 with `audit_at` moved from 2026-09-15T12:00 to 2026-09-18T12:00.
- Tests: the `audit_at` cutoff in both directions.
  - Snapshot `evidence_02`, captured 2026-09-17, was outside the original window. It is now inside it, and its observation (2026-09-15T12:00) is later than the one in `evidence_92` (09:41 and 10:01). So `evidence_02` becomes the citation for both remaining records.
  - Retained audit record `audit_record_7095`, documented only in `evidence_02`, now belongs to the post-remediation checks.
- Expected: `INCOMPLETE`, 7 steps:

| # | phase | system_id | resource_id | operation | evidence |
|---|---|---|---|---|---|
| 1 | FINDING | account_service | account_5334 | REPORT_REMAINING_RECORD | evidence_02 |
| 2 | FINDING | search_service | search_5577 | REPORT_REMAINING_RECORD | evidence_02 |
| 3 | REMEDIATION | account_service | account_5334 | DELETE_RECORD | |
| 4 | REMEDIATION | search_service | search_5577 | DELETE_RECORD | |
| 5 | VERIFICATION | account_service | account_5334 | VERIFY_RECORD_ABSENT | |
| 6 | VERIFICATION | search_service | search_5577 | VERIFY_RECORD_ABSENT | |
| 7 | VERIFICATION | security_service | audit_record_7095 | VERIFY_RECORD_PRESENT | |

### Results on the participant-made cases

<!-- RESULTS:CUSTOM -->
| metric | value |
|---|---|
| cases | 4 |
| status accuracy | 100 % (4 / 4) |
| step F1 | 100 % |
| sequence accuracy | 100 % (4 / 4) |
| field accuracy (all fields) | 100 % |

custom_01 failed in the first version of the keyword fallback, which read *borrar* as a deletion request. See failure 9 below.
<!-- /RESULTS:CUSTOM -->

## 3. Failures found and improvements made

The work was iterated against the public samples. Each row is a failure the evaluator exposed, with the change that fixed it. The sample score after each change is shown as statuses / exact `steps_json` (out of 32) where it was recorded. Steps 0 to 3 were measured case by case and their aggregate scores were not kept.

| # | failure found | change | samples after |
|---|---|---|---|
| 1 | Records still present on a failover or reporting replica were reported deleted, because a newer but empty primary snapshot hid them (replica drift, e.g. `evidence_90` vs `evidence_54`). | Complete snapshots now only prove absence of a record that nothing else shows. The latest observation wins, and merges are conservative. | not recorded |
| 2 | Worker targets with no identifiers (404 profiles, anonymized analytics) were missing, or were given to a request from an adjacent run. | Batch attribution: requests sharing `reported_at` form a run. Each worker message template has its own timing window. Only targets visible in the request's own evidence files are eligible. | not recorded |
| 3 | Invisible profiles were swapped between requests of the same run (case_18, case_20). | A profile's worker result must match the request's `reported_status` (COMPLETE↔SUCCESS, PARTIALLY_COMPLETE↔PARTIAL, NOT_STARTED↔FAILED). | not recorded |
| 4 | Analytics targets went to requests whose own run had failures (case_09). | "Policy action completed" targets are not given to requests whose run reported failing results. | 31 / 22 |
| 5 | Incomplete cases missed the retained security audit record (cases 09, 23, 24, 29, 30). That record's link to the subject is only documented by a snapshot captured after `audit_at`. | Retained records linked to the subject by such later evidence join the post-remediation checks (`VERIFY_RECORD_PRESENT`, no citation). They never decide the state. | 31 / 26 |
| 6 | A single-request run lost its analytics proof after rule 2 was tightened (case_04 regression). | A request with no other visible evidence becomes a lower-priority fallback owner. | 31 / 26 |
| 7 | case_07 was reported COMPLETE although the identity document the customer sent to support was still stored. The proof was only in a PDF. | PDF text extraction (pypdf) plus a parser for resource ids and identifiers. The attachment category follows rule_06. | 32 / 27 |
| 8 | A three-way tie between invisible profiles in one run (case_23 `account_410`). | The worker handles a run's profiles in submission order, starting at an arbitrary request (a ring). This was measured on 42 runs whose owners are known from identifiers: 42 / 42 are rotations of the submission order. Anchored on known owners, the ring settles most ties. Remaining ambiguity is labelled `batch-guess` in the trace. | 32 / 28 |
| 9 | The keyword fallback read *"No quiero borrar la cuenta"* as a deletion request (custom_01). | Explicit non-deletion phrases in Spanish, Portuguese, French, German, Korean, Japanese and Chinese are checked before the deletion words. With a key, Claude classifies intent and the keywords serve as a cross-check. | custom 4 / 4 |
| 10 | Eval requests whose only evidence is a screenshot or a PDF statement produced empty answers (12 requests, e.g. case_33, case_34). The data catalog names the record by a reference such as the statement number `NST-2026-0718-1842` or `user_17`, not by its resource id. | Catalog references are matched against the records transcribed from screenshots by Claude vision and against PDF text. The matched record's visible identifiers, masking and connector or restore state give the resource state. | n/a (eval only) |
| 11 | Comparing the cache-filling run with a later cached rerun showed 12 evaluation rows whose analytics tie was paired differently (cases 59/60, 77/79, 80/81, 380/381, 411/412, 497/499). One tie-solving loop iterated over a Python `set`, so its order depended on the interpreter's hash seed. | All tie loops iterate in a sorted order. The output is now byte-identical across `PYTHONHASHSEED` values (checked with seeds 0 to 5). | 32 / 28 (unchanged) |

## 4. Known limitations

- Two-way ties between identifier-less analytics rows in one worker run cannot be settled from the evidence. They are paired in a stable order.
- On the evaluation set, 39 profile assignments remain ambiguous after the ring rule and are guesses, labelled `batch-guess` in `code/runs/trace.jsonl`.
- Screenshot reading depends on the vision transcription. The output validates identifiers and resource ids, but a misread status would change the finding. All 11 transcriptions are cached and can be inspected in `code/cache/llm/`.
