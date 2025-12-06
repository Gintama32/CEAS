from datetime import datetime

from db.models.project import Project
from db.models.excel_data import ExcelData
from db.models.data import Data


def _create_project(db_session):
    project = Project(
        project_name="Test Project",
        project_location="Test City",
        client_name="Test Client",
        prepared_by="Tester",
        estimate_date=datetime.utcnow(),
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


def _create_excel_data(db_session, project_id):
    excel_data = ExcelData(
        project_id=project_id,
        original_filename="test.xlsx",
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        stored_path="/tmp/test.xlsx",
        status="processed",
        row_count=0,
        file_size=0,
    )
    db_session.add(excel_data)
    db_session.commit()
    db_session.refresh(excel_data)
    return excel_data


def test_create_data_success(client, db_session):
    project = _create_project(db_session)
    excel_data = _create_excel_data(db_session, project.id)
    payload = {
        "project_id": project.id,
        "excel_data_id": excel_data.id,
        "description": "Concrete",
        "csi_code": "01 00 00",
        "csi_title": "General Requirements",
        "quantity": 10.0,
        "unit": "CY",
        "material_unit_cost": 120.5,
        "material_amount": 1205.0,
        "labor_unit_cost": 80.25,
        "labor_amount": 802.5,
        "total_unit_cost": 200.75,
        "total_amount": 2007.5,
    }
    resp = client.post("/api/v1/data/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] >= 1
    assert data["description"] == payload["description"]
    assert data["project_id"] == project.id
    assert data["excel_data_id"] == excel_data.id


def test_create_data_validation_error(client, db_session):
    project = _create_project(db_session)
    excel_data = _create_excel_data(db_session, project.id)
    payload = {
        "project_id": project.id,
        "excel_data_id": excel_data.id,
        "quantity": 5,
        "unit": "EA",
    }
    resp = client.post("/api/v1/data/", json=payload)
    assert resp.status_code == 422


def test_delete_data_success(client, db_session):
    project = _create_project(db_session)
    excel_data = _create_excel_data(db_session, project.id)
    data_row = Data(
        project_id=project.id,
        excel_data_id=excel_data.id,
        description="Demo row",
        csi_code="01 00 00",
        csi_title="General Requirements",
        quantity=1,
    )
    db_session.add(data_row)
    db_session.commit()
    db_session.refresh(data_row)

    resp = client.delete(f"/api/v1/data/{data_row.id}")
    assert resp.status_code == 204
    assert db_session.get(Data, data_row.id) is None
