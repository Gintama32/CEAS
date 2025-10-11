from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UnitType(str, Enum):
    SF = "SF"  # Square Feet
    EA = "EA"  # Each
    LS = "LS"  # Lump Sum
    LF = "LF"  # Linear Feet
    CY = "CY"  # Cubic Yards
    SY = "SY"  # Square Yards
    TON = "TON"  # Tons
    HR = "HR"  # Hours

class ItemType(str, Enum):
    SECTION_HEADER = "section_header"
    LINE_ITEM = "line_item"
    SUBTOTAL = "subtotal"
    SUB_HEADER = "sub_header"

class EstimateItem(BaseModel):
    id: Optional[str] = None
    description: str
    quantity: Optional[float] = None
    unit: Optional[UnitType] = None
    material_unit_cost: Optional[float] = None
    material_amount: Optional[float] = None
    labor_unit_cost: Optional[float] = None
    labor_amount: Optional[float] = None
    total_unit_cost: Optional[float] = None
    total_amount: Optional[float] = None
    item_type: ItemType = ItemType.LINE_ITEM
    section_code: Optional[str] = None  # e.g., "01-00-00"
    parent_id: Optional[str] = None  # For hierarchical structure
    level: int = 0  # Indentation level
    sort_order: int = 0

class EstimateSection(BaseModel):
    id: Optional[str] = None
    section_code: str  # e.g., "01-00-00"
    title: str
    items: List[EstimateItem] = []
    subtotal_material: Optional[float] = None
    subtotal_labor: Optional[float] = None
    subtotal_total: Optional[float] = None

class EstimateTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    project_type: str  # e.g., "Construction", "Renovation"
    sections: List[EstimateSection] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True

class Estimate(BaseModel):
    id: Optional[str] = None
    project_name: str
    project_location: str
    client_name: str
    estimate_date: datetime
    prepared_by: str
    template_id: Optional[str] = None
    sections: List[EstimateSection] = []
    total_material: Optional[float] = None
    total_labor: Optional[float] = None
    total_amount: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status: str = "draft"  # draft, approved, sent

class EstimateData(BaseModel):
    """Raw data that can be imported/exported"""
    project_info: Dict[str, Any]
    items: List[EstimateItem]
    metadata: Dict[str, Any] = {}

class ExcelExportRequest(BaseModel):
    estimate_id: str
    format_options: Dict[str, Any] = {}
    include_totals: bool = True
    include_breakdown: bool = True
