# Back cover photo (v2, CCTV-free crop) + tagline/summary meta tests
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


def _meta():
    r = requests.get(f"{BASE_URL}/api/book", timeout=30)
    assert r.status_code == 200
    return r.json()["meta"]


def test_meta_back_photo_v2():
    m = _meta()
    assert m["back_photo"] == "back_photo_v2.jpg"


def test_meta_back_tagline_and_summary():
    m = _meta()
    assert m["back_tagline"] == "There is no easy in becoming The New No. 1"
    assert isinstance(m.get("back_summary"), str) and len(m["back_summary"]) > 80


def test_back_photo_v2_served():
    r = requests.get(f"{BASE_URL}/api/assets/back_photo_v2.jpg", timeout=30)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")
    assert r.content[:3] == b"\xff\xd8\xff"
    assert len(r.content) > 50000
