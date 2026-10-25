### Public samples

| metric | value |
|---|---|
| cases | 32 |
| status accuracy | 100.0% |
| step precision | 99.5% |
| step recall | 97.9% |
| step F1 | 98.7% |
| sequence accuracy (exact steps_json) | 87.5% |
| relative order accuracy | 100.0% |

| field | accuracy |
|---|---|
| step_no | 95.3% |
| phase | 97.9% |
| system_id | 97.9% |
| resource_id | 97.9% |
| operation | 97.9% |
| state | 97.9% |
| evidence_id | 97.9% |

Status confusion (gold->pred): COMPLETE->COMPLETE: 10, INCOMPLETE->INCOMPLETE: 22

Mismatched cases:
- case_03 gold COMPLETE / pred COMPLETE: missing 1, extra 1
  - missing `VERIFICATION analytics_platform analytics_9406 VERIFY_RECORD_ANONYMIZED ANONYMIZED evidence_94`
  - extra `VERIFICATION analytics_platform analytics_5589 VERIFY_RECORD_ANONYMIZED ANONYMIZED evidence_94`
- case_04 gold COMPLETE / pred COMPLETE: missing 1, extra 0
  - missing `VERIFICATION account_service account_004 VERIFY_RECORD_ABSENT ABSENT evidence_54`
- case_18 gold INCOMPLETE / pred INCOMPLETE: missing 1, extra 0
  - missing `VERIFICATION security_service audit_record_6645 VERIFY_RECORD_PRESENT PRESENT `
- case_20 gold INCOMPLETE / pred INCOMPLETE: missing 1, extra 0
  - missing `VERIFICATION security_service audit_record_5569 VERIFY_RECORD_PRESENT PRESENT `

### Participant-made cases

| metric | value |
|---|---|
| cases | 4 |
| status accuracy | 100.0% |
| step precision | 100.0% |
| step recall | 100.0% |
| step F1 | 100.0% |
| sequence accuracy (exact steps_json) | 100.0% |
| relative order accuracy | 100.0% |

| field | accuracy |
|---|---|
| step_no | 100.0% |
| phase | 100.0% |
| system_id | 100.0% |
| resource_id | 100.0% |
| operation | 100.0% |
| state | 100.0% |
| evidence_id | 100.0% |

Status confusion (gold->pred): INCOMPLETE->INCOMPLETE: 2, NOT_APPLICABLE->NOT_APPLICABLE: 2
