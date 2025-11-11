from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class DataCreate(BaseModel):
    id: Optional[str] = None
    description: str
    quantity: float
    unit: str
    material_unit_cost: float
    labor_unit_cost: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DataUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    material_unit_cost: Optional[float] = None
    labor_unit_cost: Optional[float] = None

