from sqlalchemy.orm import Session
from db.models.excel_data import ExcelData
from typing import List, Optional


def create_excel_data_record(db: Session, *, project_id: int, original_filename: str,
                             content_type: str, stored_path: str, status: str,
                             row_count: int, file_size: int, data: Optional[str] = None) -> ExcelData:
    new_excel_data = ExcelData(
        project_id=project_id,
        original_filename=original_filename,
        content_type=content_type,
        stored_path=stored_path,
        status=status,
        row_count=row_count,
        file_size=file_size,
        data=data
    )
    db.add(new_excel_data)
    db.commit()
    db.refresh(new_excel_data)
    return new_excel_data


def list_excel_data(db: Session) -> List[ExcelData]:
    return db.query(ExcelData).order_by(ExcelData.created_at.desc()).all()


def get_excel_data(db: Session, excel_data_id: int) -> Optional[ExcelData]:
    return db.query(ExcelData).filter(ExcelData.id == excel_data_id).first()


def delete_excel_data(db: Session, excel_data_id: int) -> bool:
    """Delete an excel_data record. Returns True if deleted, False if not found."""
    record = db.query(ExcelData).filter(ExcelData.id == excel_data_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True

def delete_excel_data_by_project_id(db: Session, project_id: int) -> List[ExcelData]:
    """Delete all excel_data records for a project. Returns list of deleted records."""
    records = db.query(ExcelData).filter(ExcelData.project_id == project_id).all()
    for record in records:
        db.delete(record)
    db.commit()
    return records