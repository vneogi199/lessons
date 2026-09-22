-- SQLite teaching schema. Units: notional in currency units; DV01 in currency units/bp.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS desks (desk TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS limits (
  desk TEXT REFERENCES desks(desk), currency TEXT,
  notional_limit INTEGER NOT NULL CHECK(notional_limit >= 0),
  dv01_limit INTEGER NOT NULL CHECK(dv01_limit >= 0), PRIMARY KEY(desk,currency));
CREATE TABLE IF NOT EXISTS positions (
  position_id TEXT PRIMARY KEY, desk TEXT REFERENCES desks(desk), currency TEXT,
  notional INTEGER NOT NULL CHECK(notional >= 0),
  dv01 INTEGER NOT NULL CHECK(dv01 >= 0));
CREATE TABLE IF NOT EXISTS rfqs (
  id TEXT PRIMARY KEY, desk TEXT REFERENCES desks(desk), currency TEXT,
  received_at TEXT NOT NULL, notional INTEGER NOT NULL CHECK(notional > 0),
  status TEXT NOT NULL CHECK(status IN ('parsed','review','rejected')));
CREATE TABLE IF NOT EXISTS rate_ticks (
  currency TEXT, tenor_months INTEGER CHECK(tenor_months > 0),
  observed_at TEXT, rate TEXT NOT NULL,
  PRIMARY KEY(currency,tenor_months,observed_at));
CREATE INDEX IF NOT EXISTS positions_scope ON positions(desk,currency);
CREATE INDEX IF NOT EXISTS rfqs_scope_time ON rfqs(desk,currency,received_at);
-- Store canonical UTC timestamps with identical precision for correct lexical ordering.
