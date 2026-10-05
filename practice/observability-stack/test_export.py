import pytest
from export_fixture import endpoint


@pytest.mark.parametrize('bad', ['http://example.com', 'https://user:pass@example.com',
                                'https://example.com/?secret=value', 'file:///tmp/output'])
def test_reject_unsafe_endpoint_shape(bad):
    with pytest.raises(ValueError):
        endpoint(bad)


def test_explicit_https_endpoint():
    assert endpoint('https://approved.example/telemetry') == 'https://approved.example/telemetry'
