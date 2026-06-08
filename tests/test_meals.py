import pytest


def _auth_headers(client) -> dict:
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "campusbites123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_seeded_meals_exist(client):
    r = client.get("/api/v1/meals")
    assert r.status_code == 200
    meals = r.json()
    assert isinstance(meals, list)
    assert len(meals) == 3


def test_create_meal(client):
    payload = {"name": "Test Meal", "price": 5.55}
    r = client.post("/api/v1/meals", json=payload, headers=_auth_headers(client))
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["name"] == "Test Meal"
    assert data["price"] == 5.55


def test_get_meal_by_id(client):
    headers = _auth_headers(client)
    created = client.post("/api/v1/meals", json={"name": "Find Me", "price": 9.99}, headers=headers).json()
    meal_id = created["id"]

    r = client.get(f"/api/v1/meals/{meal_id}")
    assert r.status_code == 200
    assert r.json()["id"] == meal_id


def test_update_meal_partial(client):
    headers = _auth_headers(client)
    created = client.post("/api/v1/meals", json={"name": "Old", "price": 1.0}, headers=headers).json()
    meal_id = created["id"]

    r = client.put(f"/api/v1/meals/{meal_id}", json={"price": 2.5}, headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Old"
    assert r.json()["price"] == 2.5


def test_delete_meal(client):
    headers = _auth_headers(client)
    created = client.post("/api/v1/meals", json={"name": "Delete Me", "price": 3.33}, headers=headers).json()
    meal_id = created["id"]

    r = client.delete(f"/api/v1/meals/{meal_id}", headers=headers)
    assert r.status_code == 204
    assert r.content == b""

    r2 = client.get(f"/api/v1/meals/{meal_id}")
    assert r2.status_code == 404
    assert r2.json()["detail"] == "Meal not found"


def test_create_meal_rejects_invalid_payload(client):
    r = client.post("/api/v1/meals", json={"name": "", "price": 0}, headers=_auth_headers(client))
    assert r.status_code == 422


def test_update_meal_rejects_invalid_payload(client):
    headers = _auth_headers(client)
    created = client.post("/api/v1/meals", json={"name": "Valid", "price": 3.33}, headers=headers).json()
    meal_id = created["id"]

    r = client.put(f"/api/v1/meals/{meal_id}", json={"price": -1}, headers=headers)
    assert r.status_code == 422


def test_missing_meal_returns_404(client):
    r = client.get("/api/v1/meals/999")
    assert r.status_code == 404
    assert r.json()["detail"] == "Meal not found"
