"""Opt-in ONLY: approved synthetic views and dedicated DB principal required."""
import os
import pytest
from databases import sql_server

pytestmark = pytest.mark.skipif(os.environ.get("LESSON_SQLSERVER_INTEGRATION") != "1",
                                reason="requires separately approved SQL Server integration")


def test_dedicated_principal_can_read_but_cannot_update():
    pyodbc = pytest.importorskip("pyodbc")
    # Credentials must be injected by the approved secret mechanism, never committed.
    with sql_server(os.environ["LESSON_DB_HOST"], os.environ["LESSON_DB_NAME"],
                    os.environ["LESSON_DB_USER"], os.environ["LESSON_DB_PASSWORD"]) as db:
        cursor = db.cursor()
        try:
            cursor.execute("SELECT TOP (1) rfq_id FROM reporting.RFQ")
            cursor.fetchall()
            cursor.execute("SELECT HAS_PERMS_BY_NAME('reporting.RFQ','OBJECT','UPDATE')")
            assert cursor.fetchone()[0] == 0
            with pytest.raises(pyodbc.ProgrammingError) as failure:
                # Predicate prevents changed rows even if grants are wrong.
                cursor.execute("UPDATE reporting.RFQ SET instrument=instrument WHERE 1=0")
            assert "229" in str(failure.value)  # SQL Server permission-denied error.
        finally:
            cursor.close()
