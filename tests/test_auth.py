import pytest


def test_login_success(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "campusbites123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_login_wrong_username(client):
    r = client.post("/api/v1/auth/login", json={"username": "hacker", "password": "campusbites123"})
    assert r.status_code == 401


def _get_token(client) -> str:
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "campusbites123"})
    return r.json()["access_token"]


def test_create_meal_requires_auth(client):
    r = client.post("/api/v1/meals/", json={"name": "No Auth Meal", "price": 5.0})
    assert r.status_code == 401


def test_create_meal_with_token(client):
    token = _get_token(client)
    r = client.post(
        "/api/v1/meals/",
        json={"name": "Auth Meal", "price": 6.0},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    assert r.json()["name"] == "Auth Meal"


def test_update_meal_requires_auth(client):
    token = _get_token(client)
    created = client.post(
        "/api/v1/meals/",
        json={"name": "Edit Me", "price": 5.0},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    r = client.put(f"/api/v1/meals/{created['id']}", json={"price": 9.0})
    assert r.status_code == 401


def test_delete_meal_requires_auth(client):
    token = _get_token(client)
    created = client.post(
        "/api/v1/meals/",
        json={"name": "Delete Me", "price": 5.0},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    r = client.delete(f"/api/v1/meals/{created['id']}")
    assert r.status_code == 401


def test_invalid_token_rejected(client):
    r = client.post(
        "/api/v1/meals/",
        json={"name": "Bad Token Meal", "price": 5.0},
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert r.status_code == 401


def test_get_meals_still_public(client):
    r = client.get("/api/v1/meals/")
    assert r.status_code == 200
