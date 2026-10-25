"""Regression checks on the real dataset (skipped when dataset/ is not next to the code).

They replay the cached Claude answers, so they need no API key and make no calls.
"""
import csv
import json
import os
import unittest

from ghost_audit import pipeline
from ghost_audit.dataset import Dataset
from ghost_audit.validate import check_row

from evaluation.main import score

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASET = os.path.join(ROOT, "dataset")
HAS_DATA = os.path.exists(os.path.join(DATASET, "deletion_requests.csv"))


def read(path):
    with open(path, encoding="utf-8", newline="") as fh:
        return {r["case_id"]: r for r in csv.DictReader(fh)}


@unittest.skipUnless(HAS_DATA, "dataset/ not present")
class SampleRegressionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = pipeline.run(DATASET, "sample_deletion_requests.csv", llm_mode="cache")

    def test_sample_scores_do_not_drop(self):
        pred = {r["case_id"]: r for r in self.result.rows}
        m = score(pred, read(os.path.join(DATASET, "sample_output.csv")))
        self.assertEqual(m["status_accuracy"], 1.0)
        self.assertGreaterEqual(m["step_f1"], 0.985)
        self.assertGreaterEqual(m["sequence_accuracy"], 28 / 32)

    def test_gold_sample_answers_satisfy_the_validator(self):
        manifest = Dataset(DATASET).manifest
        reqs = read(os.path.join(DATASET, "sample_deletion_requests.csv"))
        for cid, row in read(os.path.join(DATASET, "sample_output.csv")).items():
            with self.subTest(case=cid):
                steps = json.loads(row["steps_json"])
                self.assertEqual(check_row(row["deletion_status"], steps, reqs[cid]["audit_at"], manifest), [])


@unittest.skipUnless(HAS_DATA, "dataset/ not present")
class SubmissionRegressionTest(unittest.TestCase):
    def test_rerun_reproduces_the_committed_output_csv(self):
        result = pipeline.run(DATASET, llm_mode="cache")
        self.assertEqual(result.errors, {})
        committed = os.path.join(ROOT, "output.csv")
        if not os.path.exists(committed):
            self.skipTest("output.csv not present")
        with open(committed, encoding="utf-8", newline="") as fh:
            rows = list(csv.DictReader(fh))
        self.assertEqual(len(rows), 518)
        self.assertEqual(rows, result.rows)


if __name__ == "__main__":
    unittest.main()
