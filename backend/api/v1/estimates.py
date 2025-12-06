from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.estimates import create_estimate_from_template, get_estimate, list_estimates
from db.models.estimate import Estimate
from dependencies import get_db
from schemas.estimate import EstimateCreate, EstimateRead, EstimateSummary

estimates_router = APIRouter(prefix="/estimates", tags=["estimates"])


def _as_summary(estimate) -> EstimateSummary:
    read_model = EstimateRead.model_validate(estimate, from_attributes=True)
    project_name = getattr(estimate.project, "project_name", None)
    return EstimateSummary(**read_model.model_dump(), project_name=project_name)


@estimates_router.get("/", response_model=List[EstimateSummary])
def list_estimates_endpoint(
    project_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    estimates = list_estimates(db=db, project_id=project_id)
    return [_as_summary(estimate) for estimate in estimates]


@estimates_router.get("/{estimate_id}", response_model=EstimateRead)
def get_estimate_endpoint(estimate_id: int, db: Session = Depends(get_db)):
    estimate = get_estimate(db=db, estimate_id=estimate_id)
    if not estimate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estimate not found")
    return EstimateRead.model_validate(estimate, from_attributes=True)


@estimates_router.post("/", response_model=EstimateRead, status_code=status.HTTP_201_CREATED)
def create_estimate_endpoint(payload: EstimateCreate, db: Session = Depends(get_db)):
    try:
        estimate = create_estimate_from_template(db=db, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return EstimateRead.model_validate(estimate, from_attributes=True)


@estimates_router.delete("/{estimate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estimate_endpoint(estimate_id: int, db: Session = Depends(get_db)):
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estimate not found")
    db.delete(estimate)
    db.commit()
    return {"status": "deleted"}
