"""Create a NEW synthetic local SQLite database; refuses an existing target."""
from contextlib import closing
from pathlib import Path
import sqlite3
import sys


def seed(path):
    path = Path(path)
    # Exclusive creation protects an existing user's database from replacement.
    with path.open("xb"):
        pass
    root = Path(__file__).resolve().parent
    with closing(sqlite3.connect(path)) as db:
        db.executescript((root / "schema.sql").read_text() + (root / "fixtures.sql").read_text())


if __name__ == "__main__":
    seed(sys.argv[1] if len(sys.argv) > 1 else "rates.sqlite3")
