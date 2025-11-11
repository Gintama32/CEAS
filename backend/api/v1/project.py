from fastapi import APIRouter, Depends, HTTPException
from schemas.project import ProjectCreate
from db.session import get_db
from db.project import create_new_project, retrive_all_projects
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