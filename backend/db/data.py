from typing import Iterable, List

from schemas.data import DataCreate, DataUpdate
from sqlalchemy.orm import Session
from db.models.data import Data
from db.models.template import TemplateItem


def create_new_data(data: DataCreate, db: Session) -> Data:
    new_data = Data(**data.model_dump())
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return new_data


def bulk_insert_data_records(db: Session, payloads: Iterable[dict]) -> List[Data]:
    records = [Data(**payload) for payload in payloads]
    if not records:
        return []
    db.add_all(records)
    return records


def retrive_all_data(db: Session):
    return db.query(Data).all()


def retrive_data_by_id(id: int, db: Session):
    return db.query(Data).filter(Data.id == id).first()


def update_data(id: int, data: DataUpdate, db: Session):
    db_data = db.query(Data).filter(Data.id == id).first()
    if not db_data:
        return None

    update_data_dict = data.model_dump(exclude_unset=True)
    for field, value in update_data_dict.items():
        setattr(db_data, field, value)

    db.commit()
    db.refresh(db_data)
    return db_data


def delete_data(id: int, db: Session) -> bool:
    deleted = db.query(Data).filter(Data.id == id).delete()
    db.commit()
    return deleted > 0


def delete_data_by_excel_data_id(excel_data_id: int, db: Session) -> int:
    """Delete all data records associated with an excel_data_id. Returns count of deleted records."""
    data_ids = [
        row.id
        for row in db.query(Data.id).filter(Data.excel_data_id == excel_data_id).all()
    ]

    if data_ids:
        db.query(TemplateItem).filter(TemplateItem.catalog_data_id.in_(data_ids)).delete(
            synchronize_session=False
        )

    deleted_count = db.query(Data).filter(Data.excel_data_id == excel_data_id).delete()
    db.commit()
    return deleted_count

def delete_data_by_project_id(project_id: int, db: Session) -> int:
    """Delete all data records associated with a project_id. Returns count of deleted records."""
    deleted_count = db.query(Data).filter(Data.project_id == project_id).delete()
    db.commit()
    return deleted_count