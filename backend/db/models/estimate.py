from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from db.base import Base


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    excel_data_id = Column(Integer, ForeignKey("excel_data.id"), nullable=True)
    name = Column(String, nullable=False)
    status = Column(String, default="draft", nullable=False)
    total_cost = Column(Float, default=0.0, nullable=False)
    total_labor = Column(Float, default=0.0, nullable=False)
    total_material = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project")
    template = relationship("Template")
    excel_data = relationship("ExcelData")


