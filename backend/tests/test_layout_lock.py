# Locked shared layout API tests (content_hash + /api/layout)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def chash():
    r = requests.get(f"{BASE_URL}/api/book", timeout=30)
    assert r.status_code == 200
    h = r.json()["content_hash"]
    assert isinstance(h, str) and len(h) == 16
    return h


def test_content_hash_stable(chash):
    r = requests.get(f"{BASE_URL}/api/book", timeout=30)
    assert r.json()["content_hash"] == chash


def test_stored_layout_230_pages(chash):
    r = requests.get(f"{BASE_URL}/api/layout/{chash}:v2", timeout=30)
    if r.status_code == 404:
        pytest.skip("No locked layout yet; load frontend first")
    assert r.status_code == 200
    d = r.json()
    assert "_id" not in d
    assert d["key"] == f"{chash}:v2"
    assert len(d["layout"]["pages"]) == 230


def test_unknown_key_404():
    r = requests.get(f"{BASE_URL}/api/layout/TEST_nonexistent:v2", timeout=15)
    assert r.status_code == 404


def test_post_wrong_key_409():
    r = requests.post(f"{BASE_URL}/api/layout", json={"key": "deadbeef:v2", "layout": {"pages": []}}, timeout=15)
    assert r.status_code == 409


def test_post_invalid_layout_400(chash):
    r = requests.post(f"{BASE_URL}/api/layout", json={"key": f"{chash}:v2", "layout": {"pages": "x"}}, timeout=15)
    assert r.status_code == 400


def test_post_same_key_does_not_overwrite(chash):
    # Safety: never POST junk unless a real layout is already locked (else we would lock junk)
    pre = requests.get(f"{BASE_URL}/api/layout/{chash}:v2", timeout=30)
    if pre.status_code != 200:
        pytest.skip("No locked layout yet; load frontend first")
    r = requests.post(f"{BASE_URL}/api/layout", json={"key": f"{chash}:v2", "layout": {"pages": [{"x": 1}]}}, timeout=30)
    assert r.status_code == 200
    assert len(r.json()["layout"]["pages"]) == 230
    g = requests.get(f"{BASE_URL}/api/layout/{chash}:v2", timeout=30)
    assert len(g.json()["layout"]["pages"]) == 230
