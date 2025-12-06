from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
from pathlib import Path

from db.session import get_db
from db.excel_data import create_excel_data_record, list_excel_data, get_excel_data, delete_excel_data
from db.data import bulk_insert_data_records, delete_data_by_excel_data_id
from schemas.excel_data import ExcelDataRead
from services.excel_parser import parse_estimate_rows, ExcelParsingError
from settings import settings


excel_data_router = APIRouter(prefix="/excel-data", tags=["excel-data"])


def _ensure_upload_dir() -> Path:
    upload_dir = Path(settings.FILE_UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


@excel_data_router.post(
    "/upload",
    response_model=ExcelDataRead,
    status_code=status.HTTP_201_CREATED
)
async def upload_excel_file(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xlsm files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    upload_dir = _ensure_upload_dir()
    safe_filename = f"{uuid4().hex}_{file.filename}"
    stored_path = upload_dir / safe_filename

    with stored_path.open("wb") as out_file:
        out_file.write(file_bytes)

    record = create_excel_data_record(
        db=db,
        project_id=project_id,
        original_filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        stored_path=str(stored_path),
        status="uploaded",
        row_count=0,
        file_size=len(file_bytes),
    )
    try:
        parsed_rows = parse_estimate_rows(file_bytes)
        payloads = [
            {
                "project_id": project_id,
                "excel_data_id": record.id,
                **row,
            }
            for row in parsed_rows
        ]
        bulk_insert_data_records(db, payloads)
        record.row_count = len(parsed_rows)
        record.status = "processed"
        db.add(record)
        db.commit()
        db.refresh(record)
    except ExcelParsingError as exc:
        record.status = "error"
        record.data = str(exc)
        db.add(record)
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        record.status = "error"
        record.data = str(exc)
        db.add(record)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to process Excel file.") from exc
    return record


@excel_data_router.get("/", response_model=List[ExcelDataRead])
def list_uploaded_excel_files(db: Session = Depends(get_db)):
    return list_excel_data(db)


@excel_data_router.get("/{excel_data_id}", response_model=ExcelDataRead)
def get_excel_file_metadata(excel_data_id: int, db: Session = Depends(get_db)):
    record = get_excel_data(db, excel_data_id)
    if not record:
        raise HTTPException(status_code=404, detail="Excel upload not found.")
    return record


@excel_data_router.delete("/{excel_data_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_excel_file(excel_data_id: int, db: Session = Depends(get_db)):
    """Delete an excel data record and all associated data records."""
    record = get_excel_data(db, excel_data_id)
    if not record:
        raise HTTPException(status_code=404, detail="Excel upload not found.")
    
    # Delete associated data records first
    delete_data_by_excel_data_id(excel_data_id, db)
    
    # Delete the excel_data record
    deleted = delete_excel_data(db, excel_data_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Excel upload not found.")
    
    # Optionally delete the stored file
    if record.stored_path:
        try:
            stored_file = Path(record.stored_path)
            if stored_file.exists():
                stored_file.unlink()
        except Exception as e:
            # Log error but don't fail the request if file deletion fails
            print(f"Warning: Failed to delete stored file {record.stored_path}: {e}")
    
    return None