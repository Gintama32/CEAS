from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EstimateBase(BaseModel):
    project_id: int
    template_id: Optional[int] = None
    name: str
    status: str = "draft"


class EstimateCreate(EstimateBase):
    template_id: int


class EstimateRead(EstimateBase):
    id: int
    excel_data_id: Optional[int] = None
    total_cost: float
    total_labor: float
    total_material: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EstimateSummary(EstimateRead):
    project_name: Optional[str] = None
