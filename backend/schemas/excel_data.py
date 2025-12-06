from datetime import datetime
from pydantic import BaseModel


class ExcelDataBase(BaseModel):
    project_id: int
    original_filename: str
    content_type: str
    stored_path: str
    status: str
    row_count: int
    file_size: int
    data: str | None = None


class ExcelDataRead(ExcelDataBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

