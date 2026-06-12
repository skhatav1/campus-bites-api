def _auth_headers(client) -> dict:
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "campusbites123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _create_meal(client, headers) -> dict:
    return client.post(
        "/api/v1/meals/",
        json={"name": "Test Meal", "price": 8.0},
        headers=headers,
    ).json()


def test_meal_available_by_default(client):
    headers = _auth_headers(client)
    meal = _create_meal(client, headers)
    assert meal["available"] is True


def test_toggle_marks_sold_out(client):
    headers = _auth_headers(client)
    meal = _create_meal(client, headers)

    r = client.patch(f"/api/v1/meals/{meal['id']}/availability", headers=headers)
    assert r.status_code == 200
    assert r.json()["available"] is False


def test_toggle_twice_restores_availability(client):
    headers = _auth_headers(client)
    meal = _create_meal(client, headers)

    client.patch(f"/api/v1/meals/{meal['id']}/availability", headers=headers)
    r = client.patch(f"/api/v1/meals/{meal['id']}/availability", headers=headers)
    assert r.status_code == 200
    assert r.json()["available"] is True


def test_toggle_requires_auth(client):
    headers = _auth_headers(client)
    meal = _create_meal(client, headers)

    r = client.patch(f"/api/v1/meals/{meal['id']}/availability")
    assert r.status_code == 401


def test_toggle_unknown_meal_returns_404(client):
    headers = _auth_headers(client)
    r = client.patch("/api/v1/meals/9999/availability", headers=headers)
    assert r.status_code == 404
