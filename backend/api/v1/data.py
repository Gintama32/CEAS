from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db
from schemas.data import DataCreate, DataUpdate
from db.data import create_new_data
from db.data import retrive_all_data, retrive_data_by_id, update_data
data_router = APIRouter(tags=["data"])
@data_router.post("/")
def create_data(data: DataCreate, db:Session = Depends(get_db)):
    data = create_new_data(data = data, db = db)
    return data
@data_router.get("/")
def get_all_data(db:Session = Depends(get_db)):
    data = retrive_all_data(db = db)
    return data
@data_router.get("/{id}")
def get_data_by_id(id:int, db:Session = Depends(get_db)):
    data = retrive_data_by_id(id = id, db = db)
    return data
@data_router.put("/{id}")
def update_data_endpoint(id:int, data: DataUpdate, db:Session = Depends(get_db)):
    updated_data = update_data(id = id, data = data, db = db)
    if not updated_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data not found")
    return updated_data