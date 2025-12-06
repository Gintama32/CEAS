from collections import OrderedDict
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from db.models.data import Data
from db.models.estimate import Estimate
from db.models.template import Template, TemplateItem, TemplateSection
from schemas.template import (
    TemplateCreate,
    TemplateItemCreate,
    TemplatePromoteRequest,
    TemplateSectionCreate,
    TemplateUpdate,
)


def _apply_template_sections(
    db: Session,
    template: Template,
    sections_in: List[TemplateSectionCreate],
) -> Template:
    template.sections.clear()
    template.items.clear()
    db.flush()

    for section_index, section_in in enumerate(sections_in):
        section = TemplateSection(
            template=template,
            title=section_in.title or section_in.csi_title or section_in.csi_code or f"Section {section_index + 1}",
            csi_code=section_in.csi_code,
            csi_title=section_in.csi_title,
            sort_index=section_in.sort_index if section_in.sort_index is not None else section_index,
            notes=section_in.notes,
        )
        db.add(section)
        db.flush()

        for item_index, item_in in enumerate(section_in.items or []):
            item = TemplateItem(
                template=template,
                section=section,
                catalog_data_id=item_in.catalog_data_id,
                description=item_in.description,
                unit=item_in.unit,
                default_quantity=item_in.default_quantity,
                material_unit_cost=item_in.material_unit_cost,
                labor_unit_cost=item_in.labor_unit_cost,
                notes=item_in.notes,
                sort_index=item_in.sort_index if item_in.sort_index is not None else item_index,
            )
            db.add(item)
    return template


def create_template(template_in: TemplateCreate, db: Session) -> Template:
    template = Template(
        name=template_in.name,
        description=template_in.description,
        project_type=template_in.project_type,
        status=template_in.status or "draft",
    )
    db.add(template)
    db.flush()

    _apply_template_sections(db, template, template_in.sections)

    db.commit()
    db.refresh(template)
    return template


def update_template(template_id: int, template_in: TemplateUpdate, db: Session) -> Optional[Template]:
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        return None

    template.name = template_in.name
    template.description = template_in.description
    template.project_type = template_in.project_type
    template.status = template_in.status or template.status
    template.version = (template.version or 1) + 1

    _apply_template_sections(db, template, template_in.sections)

    db.commit()
    db.refresh(template)
    return template


def list_templates(db: Session) -> List[Template]:
    return (
        db.query(Template)
        .options(
            joinedload(Template.sections).joinedload(TemplateSection.items),
        )
        .order_by(Template.updated_at.desc())
        .all()
    )


def get_template(template_id: int, db: Session) -> Optional[Template]:
    return (
        db.query(Template)
        .options(
            joinedload(Template.sections).joinedload(TemplateSection.items),
        )
        .filter(Template.id == template_id)
        .first()
    )


def duplicate_template(template_id: int, db: Session) -> Optional[Template]:
    original = get_template(template_id=template_id, db=db)
    if not original:
        return None

    clone_payload = TemplateCreate(
        name=f"{original.name} (Copy)",
        description=original.description,
        project_type=original.project_type,
        status="draft",
        sections=[
            TemplateSectionCreate(
                title=section.title,
                csi_code=section.csi_code,
                csi_title=section.csi_title,
                sort_index=section.sort_index,
                notes=section.notes,
                items=[
                    TemplateItemCreate(
                        catalog_data_id=item.catalog_data_id,
                        description=item.description,
                        unit=item.unit,
                        default_quantity=item.default_quantity,
                        material_unit_cost=item.material_unit_cost,
                        labor_unit_cost=item.labor_unit_cost,
                        notes=item.notes,
                        sort_index=item.sort_index,
                    )
                    for item in section.items
                ],
            )
            for section in original.sections
        ],
    )
    return create_template(clone_payload, db)


def promote_estimate_to_template(payload: TemplatePromoteRequest, db: Session) -> Template:
    rows = (
        db.query(Data)
        .filter(Data.project_id == payload.project_id)
        .filter(Data.excel_data_id == payload.excel_data_id)
        .order_by(Data.csi_code, Data.excel_row_number, Data.id)
        .all()
    )
    if not rows:
        raise ValueError("No catalog rows found for the selected estimate upload.")

    section_map: "OrderedDict[str, dict]" = OrderedDict()
    for row in rows:
        section_key = row.csi_code or "UNCODED"
        if section_key not in section_map:
            section_map[section_key] = {
                "title": row.csi_title or section_key,
                "csi_code": row.csi_code,
                "csi_title": row.csi_title,
                "items": [],
            }

        section_map[section_key]["items"].append(
            TemplateItemCreate(
                catalog_data_id=row.id,
                description=row.description,
                unit=row.unit,
                default_quantity=row.quantity,
                material_unit_cost=row.material_unit_cost,
                labor_unit_cost=row.labor_unit_cost,
            )
        )

    template_payload = TemplateCreate(
        name=payload.name,
        description=payload.description,
        project_type=payload.project_type,
        status=payload.status or "draft",
        sections=[
            TemplateSectionCreate(
                title=section_data["title"],
                csi_code=section_data["csi_code"],
                csi_title=section_data["csi_title"],
                items=section_data["items"],
                sort_index=index,
            )
            for index, section_data in enumerate(section_map.values())
        ],
    )
    return create_template(template_payload, db)


def delete_template(template_id: int, db: Session) -> bool:
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        return False

    estimate_refs = db.query(Estimate).filter(Estimate.template_id == template_id).count()
    if estimate_refs > 0:
        raise ValueError("Template is referenced by existing estimates.")

    db.delete(template)
    db.commit()
    return True

