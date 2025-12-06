from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from db.base import Base


class Data(Base):
    __tablename__ = "data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    excel_data_id = Column(Integer, ForeignKey('excel_data.id'), nullable=True)
    section = Column(String)
    subsection = Column(String)
    csi_code = Column(String)
    csi_title = Column(String)
    description = Column(String, nullable=False)
    excel_row_number = Column(Integer)
    quantity = Column(Float)
    unit = Column(String)
    material_unit_cost = Column(Float)
    material_amount = Column(Float)
    labor_unit_cost = Column(Float)
    labor_amount = Column(Float)
    total_unit_cost = Column(Float)
    total_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
