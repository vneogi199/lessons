from urllib.parse import urlsplit
from locust import HttpUser, task, between


class SyntheticUser(HttpUser):
    host = 'http://127.0.0.1:8000'
    wait_time = between(.2, .5)

    def on_start(self):
        target = urlsplit(self.host)
        if (target.scheme != 'http' or target.hostname != '127.0.0.1' or target.port != 8000
                or target.username or target.password or target.path or target.query or target.fragment):
            raise ValueError('Only the approved loopback fixture target is supported')

    @task
    def work(self):
        self.client.get('/work', timeout=2, allow_redirects=False)
