from schemas.data import DataCreate, DataUpdate
from sqlalchemy.orm import Session
from db.models.data import Data
def create_new_data(data: DataCreate, db:Session):
    new_data = Data(**data.model_dump())
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return new_data

def retrive_all_data(db:Session):
    return db.query(Data).all()

def retrive_data_by_id(id:int, db:Session):
    return db.query(Data).filter(Data.id == id).first()

def update_data(id:int, data: DataUpdate, db:Session):
    db_data = db.query(Data).filter(Data.id == id).first()
    if not db_data:
        return None
    
    # Only update fields that are provided
    update_data_dict = data.model_dump(exclude_unset=True)
    for field, value in update_data_dict.items():
        setattr(db_data, field, value)
    
    db.commit()
    db.refresh(db_data)
    return db_data