from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import openpyxl

from db.session import get_db
from schemas.data import DataCreate, DataUpdate, DataRead
from db.data import create_new_data, retrive_all_data, retrive_data_by_id, update_data, delete_data
from services.excel_exporter import generate_estimate_workbook, generate_raw_upload_workbook

data_router = APIRouter(tags=["data"])


@data_router.post("/", response_model=DataRead)
def create_data(data: DataCreate, db: Session = Depends(get_db)):
    data = create_new_data(data=data, db=db)
    return data


@data_router.get("/", response_model=list[DataRead])
def get_all_data(db: Session = Depends(get_db)):
    data = retrive_all_data(db=db)
    return data


@data_router.get("/{id}", response_model=DataRead)
def get_data_by_id(id: int, db: Session = Depends(get_db)):
    data = retrive_data_by_id(id=id, db=db)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data not found")
    return data


@data_router.put("/{id}", response_model=DataRead)
def update_data_endpoint(id: int, data: DataUpdate, db: Session = Depends(get_db)):
    updated_data = update_data(id=id, data=data, db=db)
    if not updated_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data not found")
    return updated_data


@data_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_endpoint(id: int, db: Session = Depends(get_db)):
    deleted = delete_data(id=id, db=db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@data_router.get("/project/{project_id}/export")
def export_project_data(
    project_id: int,
    mode: str = Query(default="structured", pattern="^(structured|raw)$"),
    db: Session = Depends(get_db),
):
    rows = retrive_all_data(db)
    project_rows = [row for row in rows if row.project_id == project_id]
    if not project_rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No data for this project.")
    if mode == "raw":
        wb = generate_raw_upload_workbook(project_rows)
    else:
        wb = generate_estimate_workbook(project_rows)
    byte_io = BytesIO()
    wb.save(byte_io)
    byte_io.seek(0)
    filename = f"project_{project_id}_estimate_{mode}.xlsx"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(byte_io, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)