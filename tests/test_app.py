import sys
import os
import urllib.parse
from fastapi.testclient import TestClient

# Ensure workspace root is on sys.path so `src.app` can be imported
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.app import app


client = TestClient(app)


def ensure_removed(activity_name: str, email: str):
    # helper to remove an email if present; ignore 404
    path = f"/activities/{urllib.parse.quote(activity_name)}/participants?email={urllib.parse.quote(email)}"
    client.delete(path)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic sanity: some known activities exist
    assert "Chess Club" in data


def test_signup_and_prevent_duplicate():
    activity = "Chess Club"
    email = "teststudent@example.com"

    # Ensure clean state
    ensure_removed(activity, email)

    # Signup should succeed first time
    path = f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
    resp = client.post(path)
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Second signup should fail with 400
    resp2 = client.post(path)
    assert resp2.status_code == 400
    data2 = resp2.json()
    assert "already" in data2.get("detail", "").lower()

    # cleanup
    del_path = f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
    resp3 = client.delete(del_path)
    assert resp3.status_code == 200


def test_unregister_nonexistent():
    activity = "Chess Club"
    email = "no-such-user@example.com"
    path = f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
    resp = client.delete(path)
    # either 404 (not found) or 200 if it was removed; we expect 404
    assert resp.status_code == 404
