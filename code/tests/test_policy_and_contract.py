"""Policy mapping, step ordering and the output-contract validator."""
import json
import unittest

from ghost_audit import policy as P
from ghost_audit.validate import check_row, serialize

from tests import fixtures


class PolicyTest(unittest.TestCase):
    def setUp(self):
        rules = [dict(zip(("rule_id", "data_category", "condition", "required_action"), r)) for r in fixtures.RULES]
        self.policy = P.Policy(rules)

    def test_actions_follow_the_rules_file(self):
        self.assertEqual(self.policy.action("USER_PROFILE"), "DELETE")
        self.assertEqual(self.policy.action("SUPPORT_MESSAGE"), "REDACT")
        self.assertEqual(self.policy.action("ANALYTICS_PROFILE"), "ANONYMIZE")
        self.assertEqual(self.policy.action("SECURITY_AUDIT_LOG"), "RETAIN")
        self.assertEqual(self.policy.action("ACCOUNT_TOMBSTONE"), "REDACT")

    def test_processes_are_disabled_or_blocked_not_deleted(self):
        self.assertEqual(self.policy.action("DATA_FLOW"), "DISABLE")
        # rule_14 says RETAIN the archive; the answer blocks its restore path instead of deleting it
        self.assertEqual(self.policy.action("BACKUP_ARCHIVE"), "BLOCK_RESTORE")

    def test_plan_for_each_action(self):
        cases = {
            ("DELETE", True, None, None): ("REPORT_REMAINING_RECORD", "DELETE_RECORD", "VERIFY_RECORD_ABSENT"),
            ("DELETE", False, None, None): (None, None, "VERIFY_RECORD_ABSENT"),
            ("REDACT", True, True, None): ("REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"),
            ("REDACT", True, False, None): (None, None, "VERIFY_RECORD_REDACTED"),
            ("REDACT", False, None, None): (None, None, "VERIFY_RECORD_ABSENT"),
            ("ANONYMIZE", True, True, None): ("REPORT_EXPOSED_PII", "ANONYMIZE_RECORD", "VERIFY_RECORD_ANONYMIZED"),
            ("ANONYMIZE", True, False, None): (None, None, "VERIFY_RECORD_ANONYMIZED"),
            ("RETAIN", True, True, None): (None, None, "VERIFY_RECORD_PRESENT"),
            ("DISABLE", True, None, True): ("REPORT_ACTIVE_DATA_FLOW", "DISABLE_DATA_FLOW", "VERIFY_DATA_FLOW_DISABLED"),
            ("DISABLE", True, None, False): (None, None, "VERIFY_DATA_FLOW_DISABLED"),
            ("BLOCK_RESTORE", True, None, True): ("REPORT_RESTORE_RISK", "BLOCK_RESTORE", "VERIFY_RESTORE_BLOCKED"),
            ("BLOCK_RESTORE", True, None, False): (None, None, "VERIFY_RESTORE_BLOCKED"),
        }
        for args, expected in cases.items():
            with self.subTest(args=args):
                self.assertEqual(P.plan_for(*args), expected)

    def test_order_steps_phases_then_operation_then_resource(self):
        raw = [
            dict(system_id="account_service", resource_id="account_2", operation="VERIFY_RECORD_ABSENT"),
            dict(system_id="account_service", resource_id="account_2", operation="DELETE_RECORD"),
            dict(system_id="integration_service", resource_id="data_flow_1", operation="DISABLE_DATA_FLOW"),
            dict(system_id="account_service", resource_id="account_2", operation="REPORT_REMAINING_RECORD",
                 evidence_id="evidence_01"),
            dict(system_id="account_service", resource_id="account_1", operation="REPORT_REMAINING_RECORD",
                 evidence_id="evidence_01"),
        ]
        steps = P.order_steps(raw)
        self.assertEqual([s["step_no"] for s in steps], [1, 2, 3, 4, 5])
        self.assertEqual([(s["operation"], s["resource_id"]) for s in steps], [
            ("REPORT_REMAINING_RECORD", "account_1"), ("REPORT_REMAINING_RECORD", "account_2"),
            ("DISABLE_DATA_FLOW", "data_flow_1"),  # data flows stop before records change
            ("DELETE_RECORD", "account_2"), ("VERIFY_RECORD_ABSENT", "account_2"),
        ])
        self.assertEqual(steps[2]["state"], "DISABLED")
        self.assertEqual(steps[4]["evidence_id"], "")


def _incomplete():
    return P.order_steps([
        dict(system_id="account_service", resource_id="account_1", operation="REPORT_REMAINING_RECORD",
             evidence_id="evidence_01"),
        dict(system_id="account_service", resource_id="account_1", operation="DELETE_RECORD"),
        dict(system_id="account_service", resource_id="account_1", operation="VERIFY_RECORD_ABSENT"),
    ])


class FakeEvidence:
    def __init__(self, captured_at):
        self.captured_at = captured_at


class ContractTest(unittest.TestCase):
    manifest = {"evidence_01": FakeEvidence("2026-03-05T00:00:00Z")}

    def test_valid_rows_pass(self):
        self.assertEqual(check_row("INCOMPLETE", _incomplete(), "2026-03-10T00:00:00Z", self.manifest), [])
        complete = P.order_steps([dict(system_id="account_service", resource_id="account_1",
                                       operation="VERIFY_RECORD_ABSENT", evidence_id="evidence_01")])
        self.assertEqual(check_row("COMPLETE", complete, "2026-03-10T00:00:00Z", self.manifest), [])
        self.assertEqual(check_row("NOT_APPLICABLE", []), [])

    def test_violations_are_reported(self):
        steps = _incomplete()
        self.assertTrue(check_row("NOT_APPLICABLE", steps))
        self.assertTrue(check_row("COMPLETE", steps))
        self.assertTrue(check_row("DONE", []))
        no_finding = [dict(s, step_no=i) for i, s in enumerate(steps[1:], 1)]
        self.assertIn("INCOMPLETE without findings", check_row("INCOMPLETE", no_finding))
        cites_future = [dict(s) for s in steps]
        cites_future[1]["evidence_id"] = "evidence_01"
        self.assertTrue(any("future step cites evidence" in e for e in check_row("INCOMPLETE", cites_future)))
        swapped = [dict(steps[1], step_no=1), dict(steps[0], step_no=2), steps[2]]
        self.assertTrue(any("phase order" in e for e in check_row("INCOMPLETE", swapped)))
        wrong_state = [dict(s) for s in steps]
        wrong_state[2]["state"] = "PRESENT"
        self.assertTrue(any("phase/state mismatch" in e for e in check_row("INCOMPLETE", wrong_state)))

    def test_evidence_captured_after_audit_at_is_rejected(self):
        errs = check_row("INCOMPLETE", _incomplete(), "2026-03-01T00:00:00Z", self.manifest)
        self.assertTrue(any("captured after audit_at" in e for e in errs))

    def test_serialize_is_compact_and_round_trips(self):
        steps = _incomplete()
        text = serialize(steps)
        self.assertNotIn(" ", text)
        self.assertEqual(json.loads(text), steps)


if __name__ == "__main__":
    unittest.main()
