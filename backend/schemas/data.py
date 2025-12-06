from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DataBase(BaseModel):
    project_id: int
    excel_data_id: Optional[int] = None
    section: Optional[str] = None
    subsection: Optional[str] = None
    csi_code: Optional[str] = None
    csi_title: Optional[str] = None
    description: str
    excel_row_number: Optional[int] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    material_unit_cost: Optional[float] = None
    material_amount: Optional[float] = None
    labor_unit_cost: Optional[float] = None
    labor_amount: Optional[float] = None
    total_unit_cost: Optional[float] = None
    total_amount: Optional[float] = None


class DataCreate(DataBase):
    pass


class DataUpdate(BaseModel):
    section: Optional[str] = None
    subsection: Optional[str] = None
    csi_code: Optional[str] = None
    csi_title: Optional[str] = None
    description: Optional[str] = None
    excel_row_number: Optional[int] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    material_unit_cost: Optional[float] = None
    material_amount: Optional[float] = None
    labor_unit_cost: Optional[float] = None
    labor_amount: Optional[float] = None
    total_unit_cost: Optional[float] = None
    total_amount: Optional[float] = None


class DataRead(DataBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
