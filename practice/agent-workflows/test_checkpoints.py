import sqlite3
import subprocess
import sys
from pathlib import Path

import pytest
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from checkpoints import persistent_graph, thread_config
from approval import Approvals


def test_reopen_resume_and_idempotent_effect(tmp_path):
    path = str(tmp_path / "checkpoint.sqlite")
    config = thread_config("a", "run-1")
    with SqliteSaver.from_conn_string(path) as saver:
        graph = persistent_graph(saver, path, "a", crash_after_effect=True)
        graph.invoke({"tenant": "a", "schema_version": 1, "operation": "ticket-1"}, config)
        with pytest.raises(RuntimeError, match="synthetic_crash"):
            graph.invoke(Command(resume=True), config)
    with SqliteSaver.from_conn_string(path) as saver:
        result = persistent_graph(saver, path, "a").invoke(None, config)
        assert result["completed"] is True
    db = sqlite3.connect(path)
    try:
        assert db.execute("SELECT COUNT(*) FROM effects").fetchone()[0] == 1
    finally:
        db.close()
    assert thread_config("b", "run-1") != config


def test_separate_process_restart(tmp_path):
    path = str(tmp_path / "process.sqlite")
    common = (
        "from langgraph.checkpoint.sqlite import SqliteSaver\n"
        "from langgraph.types import Command\n"
        "from checkpoints import persistent_graph, thread_config\n"
        "import sys\n"
        "with SqliteSaver.from_conn_string(sys.argv[1]) as saver:\n"
        "    graph = persistent_graph(saver, sys.argv[1], 'a')\n"
        "    config = thread_config('a', 'restart')\n")
    start = common + "    graph.invoke({'tenant':'a','schema_version':1,'operation':'x'}, config)\n"
    resume = common + "    assert graph.invoke(Command(resume=True), config)['completed']\n"
    for script in (start, resume):
        subprocess.run([sys.executable, "-c", script, path], check=True, timeout=20,
                       cwd=Path(__file__).parent)


def test_wrong_scope_or_schema_is_rejected(tmp_path):
    with SqliteSaver.from_conn_string(str(tmp_path / "bad.sqlite")) as saver:
        graph = persistent_graph(saver, str(tmp_path / "bad.sqlite"), "a")
        for tenant, version in (("b", 1), ("a", 2)):
            with pytest.raises(ValueError, match="checkpoint_scope_or_version"):
                graph.invoke({"tenant": tenant, "schema_version": version, "operation": "x"},
                             thread_config(tenant, str(version)))


def test_authenticated_payload_bound_resume(tmp_path):
    store = Approvals(str(tmp_path / "approvals.sqlite"))
    token = store.issue_session("reviewer", "a", True)
    payload = {"source_version": "v1", "destination": "synthetic"}
    item = store.propose("a", payload)
    store.decide(token, item["id"], item["hash"], True)
    path = str(tmp_path / "checkpoint.sqlite")
    config = thread_config("a", item["id"])
    with SqliteSaver.from_conn_string(path) as saver:
        graph = persistent_graph(saver, path, "a")
        graph.invoke({"tenant": "a", "schema_version": 1, "operation": item["id"]}, config)
        with pytest.raises(PermissionError):
            store.resume_checked(token, item["id"], {**payload, "source_version": "v2"}, graph, config)
        result, approval = store.resume_checked(token, item["id"], payload, graph, config)
        assert result["completed"] and approval["reviewer"] == "reviewer"
        with pytest.raises(ValueError):
            store.resume_checked(token, item["id"], payload, graph, config)
