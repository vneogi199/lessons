import unittest
import json
from pathlib import Path
import tempfile
from unittest.mock import Mock

from provision import Run, wait
from roles import trust


class ProvisionTests(unittest.TestCase):
    def test_two_stage_recipe_records_ids_and_pins_version(self):
        config = json.loads(Path(__file__).with_name("config.example.json").read_text())
        api = Mock()
        api.create_knowledge_base.return_value = {"knowledgeBase": {"knowledgeBaseId": "KB12345678"}}
        api.get_knowledge_base.return_value = {"knowledgeBase": {"status": "ACTIVE"}}
        api.create_data_source.return_value = {"dataSource": {"dataSourceId": "DS12345678"}}
        api.get_data_source.return_value = {"dataSource": {"status": "AVAILABLE"}}
        api.start_ingestion_job.return_value = {"ingestionJob": {"ingestionJobId": "JOB1234567"}}
        api.get_ingestion_job.return_value = {"ingestionJob": {"status": "COMPLETE", "statistics": {"numberOfDocumentsFailed": 0}}}
        api.create_agent.return_value = {"agent": {"agentId": "AG12345678"}}
        api.get_agent.side_effect = [{"agent": {"agentStatus": value}} for value in
                                    ("NOT_PREPARED", "NOT_PREPARED", "PREPARED")]
        api.create_agent_alias.return_value = {"agentAlias": {"agentAliasId": "AL12345678"}}
        api.get_agent_alias.return_value = {"agentAlias": {"agentAliasStatus": "PREPARED",
                                                          "routingConfiguration": [{"agentVersion": "1"}]}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.sqlite"
            run = Run(path, config, api)
            self.assertEqual(run.knowledge_base(), "KB12345678")
            self.assertEqual(run.agent()["version"], "1")
            run.db.close()
            resumed = Run(path, config, api)
            resumed.knowledge_base()
            self.assertEqual(resumed.get("alias"), "AL12345678")
            resumed.db.close()
        api.create_knowledge_base.assert_called_once()
        api.start_ingestion_job.assert_called_once()
        api.prepare_agent.assert_called_once()
        self.assertEqual(api.create_data_source.call_args.kwargs["dataSourceConfiguration"]["s3Configuration"]["inclusionPrefixes"],
                         [config["prefix"]])

    def test_readiness_and_failure(self):
        fetch = Mock(side_effect=[{"status": "CREATING"}, {"status": "ACTIVE"}])
        pause = Mock()
        self.assertEqual(wait(fetch, "status", {"ACTIVE"}, pause=pause)["status"], "ACTIVE")
        pause.assert_called_once_with(5)
        with self.assertRaises(RuntimeError):
            wait(lambda: {"status": "FAILED"}, "status", {"ACTIVE"})
        clock = Mock(side_effect=[0, 2])
        with self.assertRaises(TimeoutError):
            wait(fetch, "status", {"ACTIVE"}, seconds=1, clock=clock)

    def test_trust_has_account_and_resource_conditions(self):
        conditions = trust("123456789012", "us-east-1", "agent", "ABCDEF1234")["Statement"][0]["Condition"]
        self.assertEqual(conditions["StringEquals"]["aws:SourceAccount"], "123456789012")
        self.assertTrue(conditions["ArnLike"]["aws:SourceArn"].endswith("agent/ABCDEF1234"))


if __name__ == "__main__":
    unittest.main()
