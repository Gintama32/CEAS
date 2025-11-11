from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class ProjectCreate(BaseModel):
    id: Optional[str] = None
    project_name: str
    project_location: str
    client_name: str
    prepared_by: str

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_location: Optional[str] = None
    client_name: Optional[str] = None
    prepared_by: Optional[str] = None
