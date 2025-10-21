from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

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
    
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    ms_oid: Mapped[str | None] = mapped_column(String(64), index=True)  # optional: Microsoft object id
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # back_populates links the relationship on both sides
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Non-secret identifier (lets us look up the row fast)
    jti: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Bcrypt hash of the secret piece. We never store raw refresh token values.
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    # FK back to the user who owns this token.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")
    # Supports single-use rotation (old token -> new token).
    parent_jti: Mapped[str | None] = mapped_column(String(50))
    # Timestamps to manage lifecycle.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
