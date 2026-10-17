import os

import pytest

from quantity import parse_quantity


@pytest.mark.parametrize("raw, expected", [(" 12 ", 12), (3, 3), ("001", 1)])
def test_quantity(raw, expected):
    assert parse_quantity(raw) == expected


@pytest.mark.parametrize("raw", [None, True, "", "1.5", 0, -1, "-2", "１", 1.0])
def test_invalid_quantity(raw):
    with pytest.raises(ValueError, match="positive integer"):
        parse_quantity(raw)


@pytest.fixture
def quantity_file(tmp_path):
    path = tmp_path / "quantity.txt"
    path.write_text(" 12 ", encoding="utf-8")
    return path


def test_file_input(quantity_file):
    assert parse_quantity(quantity_file.read_text(encoding="utf-8")) == 12


def test_environment_input(monkeypatch):
    monkeypatch.setenv("LESSON_QUANTITY", "7")
    assert parse_quantity(os.environ["LESSON_QUANTITY"]) == 7
