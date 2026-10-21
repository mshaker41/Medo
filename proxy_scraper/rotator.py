"""Fetch pages through a rotating pool of free HTTP proxies.

Intended for scraping sites you are allowed to scrape: it honours robots.txt
and waits between requests. Free proxies are unreliable and can read your
traffic, so don't send credentials or payment data through them.
"""
import itertools
import random
import time
import urllib.robotparser
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import requests

PROXY_LIST_URL = "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt"
CHECK_URL = "https://httpbin.org/ip"
USER_AGENT = "Mozilla/5.0 (compatible; ProxyRotatorScraper/1.0)"


def fetch_proxies(url=PROXY_LIST_URL):
    text = requests.get(url, timeout=15).text
    return [l.strip() for l in text.splitlines() if l.strip().count(":") == 1]


def is_alive(proxy, timeout=6):
    try:
        r = requests.get(CHECK_URL, proxies={"http": f"http://{proxy}", "https": f"http://{proxy}"},
                         timeout=timeout)
        return r.ok
    except requests.RequestException:
        return False


def working_proxies(candidates, limit=20, workers=50):
    random.shuffle(candidates)
    with ThreadPoolExecutor(workers) as pool:
        alive = [p for p, ok in zip(candidates[:400], pool.map(is_alive, candidates[:400])) if ok]
    return alive[:limit]


class RotatingFetcher:
    def __init__(self, proxies, delay=3.0):
        if not proxies:
            raise ValueError("no working proxies")
        self.pool = list(proxies)
        self.cycle = itertools.cycle(self.pool)
        self.delay = delay
        self._robots = {}

    def allowed(self, url):
        parts = urlparse(url)
        base = f"{parts.scheme}://{parts.netloc}"
        if base not in self._robots:
            rp = urllib.robotparser.RobotFileParser(base + "/robots.txt")
            try:
                rp.read()
            except Exception:
                rp = None
            self._robots[base] = rp
        rp = self._robots[base]
        return rp is None or rp.can_fetch(USER_AGENT, url)

    def get(self, url, retries=5):
        if not self.allowed(url):
            raise PermissionError(f"robots.txt disallows {url}")
        for _ in range(retries):
            proxy = next(self.cycle)
            try:
                r = requests.get(url, headers={"User-Agent": USER_AGENT},
                                 proxies={"http": f"http://{proxy}", "https": f"http://{proxy}"},
                                 timeout=10)
                if r.ok:
                    time.sleep(self.delay)
                    return r
            except requests.RequestException:
                pass
            # dead or blocked proxy: drop it and try the next one
            if proxy in self.pool:
                self.pool.remove(proxy)
                self.cycle = itertools.cycle(self.pool or [proxy])
        raise RuntimeError(f"all retries failed for {url}")


if __name__ == "__main__":
    import sys

    urls = sys.argv[1:] or ["https://httpbin.org/ip"]
    fetcher = RotatingFetcher(working_proxies(fetch_proxies()))
    for u in urls:
        print(u, fetcher.get(u).text[:200])
