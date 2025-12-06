from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import get_db
from db.templates import (
    create_template,
    delete_template,
    duplicate_template,
    get_template,
    list_templates,
    promote_estimate_to_template,
    update_template as update_template_record,
)
from schemas.template import (
    TemplateCreate,
    TemplatePromoteRequest,
    TemplateRead,
    TemplateUpdate,
)

templates_router = APIRouter(prefix="/templates", tags=["templates"])


def _serialize_template(template) -> TemplateRead:
    return TemplateRead.model_validate(template, from_attributes=True)


@templates_router.get("/", response_model=List[TemplateRead])
def list_templates_endpoint(db: Session = Depends(get_db)):
    templates = list_templates(db)
    return [_serialize_template(template) for template in templates]


@templates_router.get("/{template_id}", response_model=TemplateRead)
def get_template_endpoint(template_id: int, db: Session = Depends(get_db)):
    template = get_template(template_id=template_id, db=db)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return _serialize_template(template)


@templates_router.post("/", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template_endpoint(payload: TemplateCreate, db: Session = Depends(get_db)):
    template = create_template(payload, db)
    return _serialize_template(template)


@templates_router.post("/{template_id}/duplicate", response_model=TemplateRead)
def duplicate_template_endpoint(template_id: int, db: Session = Depends(get_db)):
    template = duplicate_template(template_id=template_id, db=db)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return _serialize_template(template)


@templates_router.put("/{template_id}", response_model=TemplateRead)
def update_template_endpoint(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)):
    template = update_template_record(template_id=template_id, template_in=payload, db=db)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return _serialize_template(template)


@templates_router.post("/promote", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def promote_template_endpoint(payload: TemplatePromoteRequest, db: Session = Depends(get_db)):
    try:
        template = promote_estimate_to_template(payload, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_template(template)


@templates_router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_endpoint(template_id: int, db: Session = Depends(get_db)):
    try:
        deleted = delete_template(template_id=template_id, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return {"status": "deleted"}

