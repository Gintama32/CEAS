def test_create_project_success(client):
    payload = {
        "project_name": "Test Project",
        "project_location": "Somewhere",
        "client_name": "Client A",
        "prepared_by": "Tester"
    }
    resp = client.post("/api/v1/project/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] >= 1
    assert data["project_name"] == payload["project_name"]
    assert data["client_name"] == payload["client_name"]


def test_create_project_validation_error(client):
    # Missing required field project_name
    payload = {
        "project_location": "Somewhere",
        "client_name": "Client A",
        "prepared_by": "Tester"
    }
    resp = client.post("/api/v1/project/", json=payload)
    assert resp.status_code == 422


def test_get_all_projects(client):
    resp = client.get("/api/v1/project/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
