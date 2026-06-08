def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root(client):
    r = client.get("/api/v1/")
    assert r.status_code == 200
    assert "message" in r.json()
