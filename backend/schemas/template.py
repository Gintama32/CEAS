from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TemplateItemBase(BaseModel):
    catalog_data_id: Optional[int] = None
    description: str
    unit: Optional[str] = None
    default_quantity: Optional[float] = None
    material_unit_cost: Optional[float] = None
    labor_unit_cost: Optional[float] = None
    notes: Optional[str] = None
    sort_index: Optional[int] = 0


class TemplateItemCreate(TemplateItemBase):
    pass


class TemplateItemRead(TemplateItemBase):
    id: int

    class Config:
        from_attributes = True


class TemplateSectionBase(BaseModel):
    title: str
    csi_code: Optional[str] = None
    csi_title: Optional[str] = None
    sort_index: Optional[int] = 0
    notes: Optional[str] = None
    items: List[TemplateItemCreate] = Field(default_factory=list)


class TemplateSectionCreate(TemplateSectionBase):
    pass


class TemplateSectionRead(TemplateSectionBase):
    id: int
    items: List[TemplateItemRead] = []

    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: str
    status: Optional[str] = "draft"


class TemplateCreate(TemplateBase):
    sections: List[TemplateSectionCreate]


class TemplateUpdate(TemplateCreate):
    pass


class TemplateRead(TemplateBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime
    sections: List[TemplateSectionRead]
    total_items: int

    class Config:
        from_attributes = True


class TemplateSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    project_type: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    section_count: int
    total_items: int

    class Config:
        from_attributes = True


class TemplatePromoteRequest(BaseModel):
    project_id: int
    excel_data_id: int
    name: str
    description: Optional[str] = None
    project_type: str = "General"
    status: Optional[str] = "draft"

