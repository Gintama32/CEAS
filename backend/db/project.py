from schemas.project import ProjectCreate, ProjectUpdate
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

def retrive_project_by_id(project_id: int, db:Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    return project

def delete_project(project_id: int, db:Session) -> bool:
    """Delete a project. Returns True if deleted, False if not found."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True

def update_project(project_id: int, project_data: ProjectUpdate, db: Session):
    """Update an existing project. Returns the updated project or None if missing."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    update_payload = project_data.model_dump(exclude_unset=True)
    for field, value in update_payload.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project