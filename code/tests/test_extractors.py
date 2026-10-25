"""Evidence parsers: the six log formats, trace joins, SQL snapshots and record interpretation."""
import os
import tempfile
import unittest

from ghost_audit import observations as O
from ghost_audit import util

from tests import fixtures

LOG_FORMATS = {
    "json": '2026-03-06T08:00:00Z {"severity":"INFO","logger":"account_service","service":"account_service",'
            '"trace_id":"tr-1","event":"profile_lookup_completed","resource_id":"account_9001","rows":1}',
    "brackets": '2026-03-06T08:00:00Z [INFO] [search_service] [tr-2] index_query_completed: '
                'resource_id="search_9001" result="miss"',
    "pipes": '2026-03-06T08:00:00Z | INFO | account_service | tr-3 | profile_lookup_completed | '
             'resource_id="account_9001" rows="0"',
    "function": '2026-03-06T08:00:00Z requestId=tr-4 level=INFO function=search_service message="resource_id=\\"search_9001\\" '
                'event=\\"index_query_completed\\" total_hits=\\"2\\""',
    "syslog": '2026-03-06T08:00:00Z <14>1 node-1 account_service tr-5 - - resource_id="account_9001" '
              'event="profile_lookup_completed" http_status="404"',
    "key_value": "2026-03-06T08:00:00Z level=INFO service=integration_service trace_id=tr-6 "
                 "event=connector_config_read_completed resource_id=data_flow_9001 enabled=true",
}


class LogParserTest(unittest.TestCase):
    def test_every_format_yields_service_trace_and_resource(self):
        expected = {
            "json": ("account_service", "tr-1", "account_9001"),
            "brackets": ("search_service", "tr-2", "search_9001"),
            "pipes": ("account_service", "tr-3", "account_9001"),
            "function": ("search_service", "tr-4", "search_9001"),
            "syslog": ("account_service", "tr-5", "account_9001"),
            "key_value": ("integration_service", "tr-6", "data_flow_9001"),
        }
        for name, line in LOG_FORMATS.items():
            with self.subTest(fmt=name):
                d = O.parse_log_line(line)
                self.assertEqual((d["service"], d["trace_id"], d["resource_id"]), expected[name])
                self.assertEqual(d["ts"], "2026-03-06T08:00:00Z")

    def test_events_become_states(self):
        state = {}
        for name, line in LOG_FORMATS.items():
            obs = O.log_line_observation("evidence_x", "2026-03-07T00:00:00Z", O.parse_log_line(line), set())
            state[name] = (obs.present, obs.exposed, obs.active)
        self.assertEqual(state["json"][0], True)          # rows=1
        self.assertEqual(state["brackets"][0], False)     # index miss
        self.assertEqual(state["pipes"][0], False)        # rows=0
        self.assertEqual(state["function"][:2], (True, True))  # hits on an index entry expose the person
        self.assertEqual(state["syslog"][0], False)       # HTTP 404
        self.assertEqual(state["key_value"][2], True)     # connector enabled

    def test_started_events_and_unknown_resources_are_ignored(self):
        d = O.parse_log_line("2026-03-06T08:00:00Z level=INFO service=x event=export_started resource_id=account_1")
        self.assertIsNone(O.log_line_observation("e", "t", d, set()))
        d = O.parse_log_line("2026-03-06T08:00:00Z level=INFO service=x event=message_read resource_id=order_77")
        self.assertIsNone(O.log_line_observation("e", "t", d, set()))

    def test_trace_join_links_identifier_free_lines(self):
        obs = O.extract_log("evidence_902", "2026-03-06T12:00:00Z", fixtures.LOG)
        by_rid = {o.resource_id: o for o in obs}
        support = by_rid["support_9001"]
        self.assertIn("ana.nueva@example.test", support.links)   # from the lookup line of the same trace
        self.assertEqual((support.category, support.present, support.exposed),
                         ("SUPPORT_MESSAGE", True, True))
        lookup = by_rid["account_9002"]
        self.assertEqual((lookup.kind, lookup.present), ("lookup", False))
        self.assertIn("luis.ensayo@example.test", lookup.links)


class SqlSnapshotTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = fixtures.build(tmp.name)
        with open(os.path.join(root, "evidence", "databases", "inventory_20260305.sql"), encoding="utf-8") as fh:
            self.obs = O.extract_sql("evidence_901", "2026-03-05T00:00:00Z", fh.read())

    def test_rows_become_observations_with_links(self):
        by_rid = {o.resource_id: o for o in self.obs if o.kind != "scope"}
        self.assertEqual(set(by_rid), {"account_9001", "data_flow_9001", "backup_9001", "audit_record_9001"})
        acc = by_rid["account_9001"]
        self.assertEqual((acc.system, acc.present, acc.exposed), ("account_service", True, True))
        self.assertTrue({"user_901", "ana.nueva@example.test", fixtures.sha("ana.nueva@example.test")} <= acc.links)
        self.assertIs(by_rid["data_flow_9001"].active, True)
        self.assertIs(by_rid["backup_9001"].active, False)
        self.assertEqual(by_rid["audit_record_9001"].system, "security_service")

    def test_snapshot_scope_marks_complete_systems(self):
        scopes = {o.scope_system for o in self.obs if o.kind == "scope"}
        self.assertEqual(scopes, {"account_service", "integration_service", "backup_service", "security_service"})


class RecordTest(unittest.TestCase):
    def rec(self, system, **fields):
        return O.record_observation("e", "2026-03-05T00:00:00Z", "2026-03-05T00:00:00Z", system, fields)

    def test_analytics_is_exposed_while_attributable(self):
        self.assertTrue(self.rec("analytics_platform", resource_id="analytics_1", customer_reference="user_1").exposed)
        self.assertFalse(self.rec("analytics_platform", resource_id="analytics_1", customer_reference=None,
                                  email=None, audience_cohort="c1").exposed)

    def test_deleted_account_status_means_absent(self):
        self.assertFalse(self.rec("account_service", resource_id="account_1", account_status="DELETED").present)

    def test_redacted_values_are_not_exposure(self):
        self.assertFalse(self.rec("identity_service", resource_id="tombstone_1", user_id="user_1",
                                  email="[REDACTED]", full_name=None).exposed)


class UtilTest(unittest.TestCase):
    def test_identifier_normalisation(self):
        self.assertEqual(util.norm_id(" Ana.Nueva@Example.TEST "), "ana.nueva@example.test")
        self.assertIsNone(util.norm_id("null"))
        self.assertIsNone(util.norm_id("[REDACTED]"))
        self.assertEqual(util.system_for("audit_record_12"), "security_service")
        self.assertEqual(util.system_for("data_flow_3"), "integration_service")
        self.assertIsNone(util.system_for("order_3"))

    def test_truthy(self):
        self.assertTrue(util.truthy("enabled"))
        self.assertFalse(util.truthy("blocked"))
        self.assertIsNone(util.truthy("maybe"))


if __name__ == "__main__":
    unittest.main()
