from schemas.project import ProjectCreate
from db.models.project import Project
from sqlalchemy.orm import Session
def create_new_project(project_data: ProjectCreate, db:Session):
    new_project = Project(**project_data.model_dump())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

def retrive_all_projects(db:Session):
    projects = db.query(Project).all()
    return projects
