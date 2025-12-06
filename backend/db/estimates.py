import json
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from db.models.data import Data
from db.models.estimate import Estimate
from db.models.excel_data import ExcelData
from db.models.template import Template, TemplateSection
from schemas.estimate import EstimateCreate


def list_estimates(db: Session, project_id: Optional[int] = None) -> List[Estimate]:
    query = (
        db.query(Estimate)
        .options(
            joinedload(Estimate.project),
            joinedload(Estimate.template),
        )
        .order_by(Estimate.updated_at.desc())
    )
    if project_id is not None:
        query = query.filter(Estimate.project_id == project_id)
    return query.all()


def get_estimate(db: Session, estimate_id: int) -> Optional[Estimate]:
    return (
        db.query(Estimate)
        .options(
            joinedload(Estimate.project),
            joinedload(Estimate.template),
        )
        .filter(Estimate.id == estimate_id)
        .first()
    )


def _sorted_sections(template: Template) -> List[TemplateSection]:
    return sorted(template.sections, key=lambda section: section.sort_index or 0)


def _material_amount(quantity: Optional[float], unit_cost: Optional[float]) -> Optional[float]:
    if quantity is None or unit_cost is None:
        return None
    return float(quantity) * float(unit_cost)


def create_estimate_from_template(db: Session, payload: EstimateCreate) -> Estimate:
    template = (
        db.query(Template)
        .options(joinedload(Template.sections).joinedload(TemplateSection.items))
        .filter(Template.id == payload.template_id)
        .first()
    )
    if not template:
        raise ValueError("Template not found.")

    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    excel_data_metadata = {
        "source": "template",
        "template_id": template.id,
        "template_name": template.name,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    excel_data = ExcelData(
        project_id=payload.project_id,
        original_filename=f"[Estimate] {template.name} ({timestamp})",
        content_type="application/json",
        stored_path=f"template://{template.id}",
        status="estimate",
        row_count=0,
        file_size=0,
        data=json.dumps(excel_data_metadata),
    )
    db.add(excel_data)
    db.flush()

    total_material = 0.0
    total_labor = 0.0
    row_number = 1

    for section in _sorted_sections(template):
        section_rows_created = False
        for item in section.items:
            material_amount = _material_amount(item.default_quantity, item.material_unit_cost)
            labor_amount = _material_amount(item.default_quantity, item.labor_unit_cost)

            if material_amount is not None:
                total_material += material_amount
            if labor_amount is not None:
                total_labor += labor_amount

            total_unit_cost = None
            if item.material_unit_cost is not None or item.labor_unit_cost is not None:
                total_unit_cost = (item.material_unit_cost or 0) + (item.labor_unit_cost or 0)

            total_amount = None
            if material_amount is not None or labor_amount is not None:
                total_amount = (material_amount or 0) + (labor_amount or 0)

            db.add(
                Data(
                    project_id=payload.project_id,
                    excel_data_id=excel_data.id,
                    section=None,
                    subsection=None,
                    csi_code=section.csi_code,
                    csi_title=section.csi_title,
                    description=item.description,
                    excel_row_number=row_number,
                    quantity=item.default_quantity,
                    unit=item.unit,
                    material_unit_cost=item.material_unit_cost,
                    material_amount=material_amount,
                    labor_unit_cost=item.labor_unit_cost,
                    labor_amount=labor_amount,
                    total_unit_cost=total_unit_cost,
                    total_amount=total_amount,
                )
            )
            section_rows_created = True
            row_number += 1

        if not section_rows_created:
            # Ensure empty sections still appear in manual entry dropdowns.
            db.add(
                Data(
                    project_id=payload.project_id,
                    excel_data_id=excel_data.id,
                    section=None,
                    subsection=None,
                    description="(Section placeholder)",
                    excel_row_number=row_number,
                )
            )
            row_number += 1

    if row_number == 1:
        raise ValueError("Template does not contain any items to seed the estimate.")

    excel_data.row_count = row_number - 1

    estimate = Estimate(
        project_id=payload.project_id,
        template_id=template.id,
        excel_data_id=excel_data.id,
        name=payload.name,
        status=payload.status or "draft",
        total_material=round(total_material, 2),
        total_labor=round(total_labor, 2),
        total_cost=round(total_material + total_labor, 2),
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)
    return estimate


