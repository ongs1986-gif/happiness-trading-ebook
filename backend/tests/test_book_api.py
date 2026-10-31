# Happiness Trading book API regression tests
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def book():
    r = requests.get(f"{BASE_URL}/api/book", timeout=30)
    assert r.status_code == 200
    return r.json()


# Root
def test_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


# Book meta + sections
def test_book_meta(book):
    m = book["meta"]
    assert m["author"] == "Ongah Hermanto"
    assert "Happiness" in m["title"]
    assert isinstance(m["config"], dict)
    assert "_id" not in m


def test_sections_count_and_order(book):
    s = book["sections"]
    assert len(s) == 38
    orders = [x["order"] for x in s]
    assert orders == sorted(orders)
    assert len({x["key"] for x in s}) == 38
    assert all("_id" not in x for x in s)


def test_sections_structure(book):
    s = book["sections"]
    chapters = [x for x in s if x["type"] == "chapter"]
    parts = [x for x in s if x["type"] == "part"]
    quizzes = [x for x in s if x["type"] == "quiz"]
    assert len(chapters) == 20
    assert len(parts) == 5
    assert len(quizzes) == 5
    assert sorted(c["chapter_number"] for c in chapters) == list(range(1, 21))
    for q in quizzes:
        assert q["quiz"]["questions"]
        for qq in q["quiz"]["questions"]:
            assert 0 <= qq["answer"] < len(qq["options"])
    keys = {x["key"] for x in s}
    assert "penutup" in keys and "profil-penulis" in keys and "bab-5" in keys


def test_chapter_illustrations_exist(book):
    for c in [x for x in book["sections"] if x["type"] == "chapter" and x.get("illustration")]:
        r = requests.get(f"{BASE_URL}/api/assets/{c['illustration']}", timeout=15)
        assert r.status_code == 200, c["illustration"]


# Assets
def test_asset_image():
    r = requests.get(f"{BASE_URL}/api/assets/bab01.jpg", timeout=15)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/")
    assert len(r.content) > 1000


def test_asset_missing():
    r = requests.get(f"{BASE_URL}/api/assets/nope.jpg", timeout=15)
    assert r.status_code == 404


def test_asset_traversal():
    r = requests.get(f"{BASE_URL}/api/assets/..%2Fserver.py", timeout=15)
    assert r.status_code == 404
