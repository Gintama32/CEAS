from fastapi import APIRouter, Depends, HTTPException, status
from pathlib import Path
from schemas.project import ProjectCreate, ProjectUpdate
from db.session import get_db
from db.project import create_new_project, retrive_all_projects, retrive_project_by_id, delete_project, update_project as update_project_record
from db.excel_data import delete_excel_data_by_project_id
from db.data import delete_data_by_project_id
from sqlalchemy.orm import Session
project_router = APIRouter(tags=["project"])

@project_router.post("/")
def create_project(project_data: ProjectCreate, db:Session = Depends(get_db)):
    project = create_new_project(project_data = project_data, db = db)
    return project

@project_router.get("/")
def get_all_projects(db:Session = Depends(get_db)):
    projects = retrive_all_projects(db = db)
    return projects

@project_router.get("/{project_id}")
def get_project_by_id(project_id: int, db:Session = Depends(get_db)):
    project = retrive_project_by_id(project_id = project_id, db = db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@project_router.put("/{project_id}")
def update_project(project_id: int, project_data: ProjectUpdate, db: Session = Depends(get_db)):
    project = update_project_record(project_id=project_id, project_data=project_data, db=db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@project_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_by_id(project_id: int, db: Session = Depends(get_db)):
    """Delete a project and all associated excel_data and data records."""
    project = retrive_project_by_id(project_id=project_id, db=db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all excel_data records for this project before deletion
    excel_data_records = delete_excel_data_by_project_id(db, project_id)
    
    # Delete associated data records
    delete_data_by_project_id(project_id, db)
    
    # Delete stored files for excel_data records
    for record in excel_data_records:
        if record.stored_path:
            try:
                stored_file = Path(record.stored_path)
                if stored_file.exists():
                    stored_file.unlink()
            except Exception as e:
                # Log error but don't fail the request if file deletion fails
                print(f"Warning: Failed to delete stored file {record.stored_path}: {e}")
    
    # Delete the project
    deleted = delete_project(project_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return None
    