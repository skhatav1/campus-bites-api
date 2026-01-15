def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root(client):
    r = client.get("/api/v1/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_greet_default(client):
    r = client.get("/api/v1/greet")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello Guest"}


def test_greet_name(client):
    r = client.get("/api/v1/greet?name=Swar")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello Swar"}
