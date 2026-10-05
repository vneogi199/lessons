"""Offline release boundary checks, supplied but not executed."""
import os
from unittest.mock import patch
import pytest
from release import main, required


def test_explicit_opt_in_before_any_command():
    with patch.dict(os.environ, {}, clear=True), patch('release.run') as command:
        with pytest.raises(PermissionError):
            main()
        command.assert_not_called()


@pytest.mark.parametrize('value', ['', 'latest', 'repo@sha256:'+'A'*64, 'repo@sha256:'+'0'*63])
def test_reject_unpinned_base(value):
    with patch.dict(os.environ, {'RUNTIME_IMAGE': value}):
        with pytest.raises(ValueError):
            required('RUNTIME_IMAGE', r'[a-zA-Z0-9./:_-]+@sha256:[0-9a-f]{64}')


def test_digest_contract():
    value = 'registry.example/approved@sha256:'+'a'*64
    with patch.dict(os.environ, {'RUNTIME_IMAGE': value}):
        assert required('RUNTIME_IMAGE', r'[a-zA-Z0-9./:_-]+@sha256:[0-9a-f]{64}') == value
