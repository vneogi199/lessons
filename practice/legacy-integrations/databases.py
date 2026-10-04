"""Explicit connection recipes. No credentials, connections or calls at import."""
from contextlib import contextmanager


def odbc_value(value):
    if not isinstance(value, str) or "\x00" in value:
        raise ValueError("invalid_odbc_value")
    return "{" + value.replace("}", "}}") + "}"


@contextmanager
def sql_server(host, database, user, password):
    import pyodbc
    connection = pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};SERVER=" + odbc_value(host) +
        ";DATABASE=" + odbc_value(database) + ";UID=" + odbc_value(user) +
        ";PWD=" + odbc_value(password) + ";Encrypt=yes;TrustServerCertificate=no;",
        timeout=5, autocommit=False)
    connection.timeout = 5
    try:
        yield connection
    finally:
        try:
            connection.rollback()
        finally:
            connection.close()


def sqlalchemy_engine(host, database, user, password):
    from sqlalchemy import URL, create_engine, event
    url = URL.create("mssql+pyodbc", username=user, password=password, host=host,
                     database=database, query={"driver": "ODBC Driver 18 for SQL Server",
                                              "Encrypt": "yes", "TrustServerCertificate": "no"})
    engine = create_engine(url, pool_size=3, max_overflow=0, pool_timeout=2,
                           pool_pre_ping=True, connect_args={"timeout": 5})
    @event.listens_for(engine, "connect")
    def query_timeout(dbapi_connection, record):
        dbapi_connection.timeout = 5
    return engine


def oracle_pool(host, service, user, password, wallet_directory):
    import oracledb
    params = oracledb.ConnectParams(host=host, port=2484, service_name=service,
        protocol="tcps", ssl_server_dn_match=True, wallet_location=wallet_directory,
        tcp_connect_timeout=5)
    return oracledb.create_pool(user=user, password=password, params=params,
        min=1, max=3, increment=1, getmode=oracledb.POOL_GETMODE_TIMEDWAIT,
        wait_timeout=2000, timeout=60)


@contextmanager
def oracle_session(pool):
    connection = pool.acquire()
    connection.call_timeout = 5000
    try:
        yield connection
    finally:
        try:
            connection.rollback()
        finally:
            connection.close()
