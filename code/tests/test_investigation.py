"""Identity history, the evidence window, state at audit_at and whole cases on the fictional fixture."""
import csv
import json
import os
import tempfile
import unittest

from ghost_audit import pipeline
from ghost_audit.dataset import Dataset
from ghost_audit.identity import IdentityResolver
from ghost_audit.investigate import Investigator
from ghost_audit.validate import check_row

from tests import fixtures


class FixtureCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = fixtures.build(cls.tmp.name)
        cls.ds = Dataset(cls.root)
        cls.inv = Investigator(cls.ds)
        cls.requests = {r["case_id"]: r for r in cls.ds.requests()}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()


class IdentityTest(FixtureCase):
    def test_historical_email_resolves_to_the_same_user(self):
        subj = IdentityResolver(self.ds.identities, self.ds.audit_log).resolve("ANA.VIEJA@example.test")
        self.assertEqual((subj.user_id, subj.matched_via), ("user_901", "history"))
        self.assertEqual(subj.emails, {"ana.vieja@example.test", "ana.nueva@example.test"})
        self.assertIn(fixtures.sha("ana.vieja@example.test"), subj.hashes)
        self.assertIn(fixtures.sha("ana.nueva@example.test"), subj.hashes)
        self.assertEqual(subj.evidence_ids, ["audit_9001"])

    def test_unknown_email_still_matches_by_its_hash(self):
        subj = IdentityResolver(self.ds.identities, self.ds.audit_log).resolve("nobody@example.test")
        self.assertIsNone(subj.user_id)
        self.assertEqual(subj.link_keys, {"nobody@example.test", fixtures.sha("nobody@example.test")})


class StateAtAuditTest(FixtureCase):
    def test_evidence_captured_after_audit_at_is_ignored(self):
        st = self.inv.resource_state("account_9001", "2026-03-01T00:00:00Z", "2026-03-10T00:00:00Z")
        self.assertEqual((st.present, st.evidence_id), (True, "evidence_901"))

    def test_a_later_audit_sees_the_later_snapshot(self):
        st = self.inv.resource_state("account_9001", "2026-03-01T00:00:00Z", "2026-03-25T00:00:00Z")
        self.assertEqual((st.present, st.evidence_id), (False, "evidence_903"))
        flow = self.inv.resource_state("data_flow_9001", "2026-03-01T00:00:00Z", "2026-03-25T00:00:00Z")
        self.assertIs(flow.active, False)

    def test_evidence_captured_before_the_request_is_ignored(self):
        st = self.inv.resource_state("account_9002", "2026-03-01T00:00:00Z", "2026-03-10T00:00:00Z")
        self.assertEqual((st.present, st.evidence_id), (False, "evidence_902"))


class CaseTest(FixtureCase):
    def steps(self, result):
        return [(s["phase"], s["system_id"], s["resource_id"], s["operation"], s["evidence_id"]) for s in result.steps]

    def test_incomplete_case_reports_plans_and_verifies(self):
        res = self.inv.audit(self.requests["case_9001"])
        self.assertEqual(res.status, "INCOMPLETE")
        self.assertEqual(self.steps(res), fixtures.CASE_9001)
        self.assertEqual(check_row(res.status, res.steps, "2026-03-10T00:00:00Z", self.ds.manifest), [])

    def test_complete_case_cites_the_proof(self):
        res = self.inv.audit(self.requests["case_9002"])
        self.assertEqual(res.status, "COMPLETE")
        self.assertEqual(self.steps(res), [
            ("VERIFICATION", "account_service", "account_9002", "VERIFY_RECORD_ABSENT", "evidence_902")])

    def test_non_deletion_request_has_no_steps(self):
        res = self.inv.audit(self.requests["case_9004"], is_deletion=False)
        self.assertEqual((res.status, res.steps), ("NOT_APPLICABLE", []))


class PipelineTest(FixtureCase):
    def test_offline_run_writes_a_valid_sorted_output(self):
        result = pipeline.run(self.root, llm_mode="off")
        self.assertEqual(result.errors, {})
        self.assertEqual([r["case_id"] for r in result.rows], ["case_9001", "case_9002", "case_9004"])
        self.assertEqual([r["deletion_status"] for r in result.rows], ["INCOMPLETE", "COMPLETE", "NOT_APPLICABLE"])
        out = os.path.join(self.tmp.name, "output.csv")
        pipeline.write_output(result.rows, out)
        with open(out, encoding="utf-8", newline="") as fh:
            rows = list(csv.DictReader(fh))
        self.assertEqual(list(rows[0]), ["case_id", "deletion_status", "steps_json"])
        self.assertEqual(json.loads(rows[2]["steps_json"]), [])
        self.assertEqual(result.usage["total"]["calls"], 0)


if __name__ == "__main__":
    unittest.main()
