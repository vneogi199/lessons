from unittest.mock import Mock
import pytest
from databases import odbc_value
from typed_sql import compile_intent, execute_intent


def test_typed_sql_does_not_accept_arbitrary_sql_or_tenant():
    raw = {"query": "latest_rfq", "desk": "RATES", "as_of": "2026-10-04"}
    sql, params = compile_intent(raw, "tenant-a", {"RATES"})
    assert "tenant-a" not in sql and params[0] == "tenant-a"
    assert "rfq_id DESC" in sql
    for changed in ({**raw, "query": "DROP TABLE x"}, {**raw, "tenant": "b"},
                    {**raw, "desk": "x';DELETE"}):
        with pytest.raises(ValueError):
            compile_intent(changed, "tenant-a", {"RATES"})
    with pytest.raises(PermissionError):
        compile_intent(raw, "tenant-a", {"OTHER"})


def test_bounded_results_and_cleanup():
    connection = Mock()
    connection.cursor.return_value.fetchmany.return_value = []
    result = execute_intent(connection, {"query": "exposure_by_desk", "desk": "RATES",
                            "as_of": "2026-10-04"}, "a", {"RATES"})
    assert result["status"] == "no_data"
    connection.cursor.return_value.fetchmany.assert_called_once_with(2)
    connection.cursor.return_value.close.assert_called_once()
    assert odbc_value("a}b;c") == "{a}}b;c}"
