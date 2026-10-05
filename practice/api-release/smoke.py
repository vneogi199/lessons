"""Execute inside the running container. Never sends a write request."""
import json
from urllib.error import HTTPError
from urllib.request import urlopen


def smoke():
    with urlopen('http://127.0.0.1:8000/healthz', timeout=2) as response:
        assert response.status == 200
        assert json.load(response)['mode'] == 'authentication-disabled-demo'
    try:
        urlopen('http://127.0.0.1:8000/rfqs', timeout=2)
    except HTTPError as error:
        assert error.code == 401
    else:
        raise AssertionError('RFQ route unexpectedly public')


if __name__ == '__main__':
    smoke()
