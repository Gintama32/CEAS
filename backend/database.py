from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from enum import Enum
import uuid
import os
from dotenv import load_dotenv
from .settings import settings

load_dotenv()

# Database URL - you'll need to replace this with your Supabase connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/ceas_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

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

class EstimateItemDB(Base):
    __tablename__ = "estimate_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(Text, nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(SQLEnum(UnitType), nullable=True)
    material_unit_cost = Column(Float, nullable=True)
    material_amount = Column(Float, nullable=True)
    labor_unit_cost = Column(Float, nullable=True)
    labor_amount = Column(Float, nullable=True)
    total_unit_cost = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    item_type = Column(SQLEnum(ItemType), default=ItemType.LINE_ITEM)
    section_code = Column(String(50), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("estimate_items.id"), nullable=True)
    level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    
    # Foreign keys
    section_id = Column(UUID(as_uuid=True), ForeignKey("estimate_sections.id"), nullable=True)
    estimate_id = Column(UUID(as_uuid=True), ForeignKey("estimates.id"), nullable=True)
    
    # Relationships
    section = relationship("EstimateSectionDB", back_populates="items")
    estimate = relationship("EstimateDB", back_populates="items")
    children = relationship("EstimateItemDB", backref="parent", remote_side=[id])

class EstimateSectionDB(Base):
    __tablename__ = "estimate_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    subtotal_material = Column(Float, nullable=True)
    subtotal_labor = Column(Float, nullable=True)
    subtotal_total = Column(Float, nullable=True)
    
    # Foreign keys
    estimate_id = Column(UUID(as_uuid=True), ForeignKey("estimates.id"), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("estimate_templates.id"), nullable=True)
    
    # Relationships
    items = relationship("EstimateItemDB", back_populates="section")
    estimate = relationship("EstimateDB", back_populates="sections")
    template = relationship("EstimateTemplateDB", back_populates="sections")

class EstimateTemplateDB(Base):
    __tablename__ = "estimate_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    sections = relationship("EstimateSectionDB", back_populates="template")

class EstimateDB(Base):
    __tablename__ = "estimates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(255), nullable=False)
    project_location = Column(String(255), nullable=False)
    client_name = Column(String(255), nullable=False)
    estimate_date = Column(DateTime, nullable=False)
    prepared_by = Column(String(255), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("estimate_templates.id"), nullable=True)
    total_material = Column(Float, nullable=True)
    total_labor = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), default="draft")
    
    # Relationships
    sections = relationship("EstimateSectionDB", back_populates="estimate")
    items = relationship("EstimateItemDB", back_populates="estimate")
    template = relationship("EstimateTemplateDB")

# SQLite requires 'check_same_thread=False' when used with async servers like Uvicorn.
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

# echo=False keeps logs quiet. Set True if you want to see executed SQL while debugging.
engine = create_engine(settings.DATABASE_URL, future=True, echo=False, connect_args=connect_args)

# Session maker used in get_db() to create short-lived sessions per request.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

# Base class used by model classes to define tables.
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
