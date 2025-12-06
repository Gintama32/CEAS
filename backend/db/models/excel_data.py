from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from db.base import Base


class ExcelData(Base):
    __tablename__ = "excel_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    status = Column(String, default="uploaded", nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    data = Column(String)  # optional JSON payload (e.g., parsed rows)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )