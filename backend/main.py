from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
import json
import uuid
from datetime import datetime
import os

from models import (
    Estimate, EstimateTemplate, EstimateItem, EstimateSection, 
    EstimateData, ExcelExportRequest, UnitType, ItemType
)

app = FastAPI()



app.add_middleware(CORSMiddleware, 
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Data Management Endpoints
@app.post("/api/v1/data/import")
async def import_data(data: EstimateData):
    """Import raw data for processing"""
    data_id = str(uuid.uuid4())
    data_db[data_id] = {
        "id": data_id,
        "project_info": data.project_info,
        "items": [item.dict() for item in data.items],
        "metadata": data.metadata,
        "created_at": datetime.now().isoformat()
    }
    return {"id": data_id, "message": "Data imported successfully"}

@app.get("/api/v1/data/{data_id}")
async def get_data(data_id: str):
    """Get imported data"""
    if data_id not in data_db:
        raise HTTPException(status_code=404, detail="Data not found")
    return data_db[data_id]

@app.get("/api/v1/data")
async def list_data():
    """List all imported data"""
    return {"data": list(data_db.values())}

# Template Management Endpoints
@app.post("/api/v1/templates")
async def create_template(template: EstimateTemplate):
    """Create a new estimate template"""
    template_id = str(uuid.uuid4())
    template.id = template_id
    template.created_at = datetime.now()
    template.updated_at = datetime.now()
    templates_db[template_id] = template.dict()
    return {"id": template_id, "message": "Template created successfully"}

@app.get("/api/v1/templates")
async def list_templates():
    """List all templates"""
    return {"templates": list(templates_db.values())}

@app.get("/api/v1/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    return templates_db[template_id]

@app.put("/api/v1/templates/{template_id}")
async def update_template(template_id: str, template: EstimateTemplate):
    """Update a template"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    template.id = template_id
    template.updated_at = datetime.now()
    templates_db[template_id] = template.dict()
    return {"message": "Template updated successfully"}

# Estimate Management Endpoints
@app.post("/api/v1/estimates")
async def create_estimate(estimate: Estimate):
    """Create a new estimate"""
    estimate_id = str(uuid.uuid4())
    estimate.id = estimate_id
    estimate.created_at = datetime.now()
    estimate.updated_at = datetime.now()
    
    # Calculate totals
    total_material = sum(
        sum(item.material_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    total_labor = sum(
        sum(item.labor_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    total_amount = sum(
        sum(item.total_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    
    estimate.total_material = total_material
    estimate.total_labor = total_labor
    estimate.total_amount = total_amount
    
    estimates_db[estimate_id] = estimate.dict()
    return {"id": estimate_id, "message": "Estimate created successfully"}

@app.get("/api/v1/estimates")
async def list_estimates():
    """List all estimates"""
    return {"estimates": list(estimates_db.values())}

@app.get("/api/v1/estimates/{estimate_id}")
async def get_estimate(estimate_id: str):
    """Get a specific estimate"""
    if estimate_id not in estimates_db:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return estimates_db[estimate_id]

@app.put("/api/v1/estimates/{estimate_id}")
async def update_estimate(estimate_id: str, estimate: Estimate):
    """Update an estimate"""
    if estimate_id not in estimates_db:
        raise HTTPException(status_code=404, detail="Estimate not found")
    estimate.id = estimate_id
    estimate.updated_at = datetime.now()
    
    # Recalculate totals
    total_material = sum(
        sum(item.material_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    total_labor = sum(
        sum(item.labor_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    total_amount = sum(
        sum(item.total_amount or 0 for item in section.items)
        for section in estimate.sections
    )
    
    estimate.total_material = total_material
    estimate.total_labor = total_labor
    estimate.total_amount = total_amount
    
    estimates_db[estimate_id] = estimate.dict()
    return {"message": "Estimate updated successfully"}

@app.post("/api/v1/estimates/{estimate_id}/export/excel")
async def export_estimate_to_excel(estimate_id: str, request: ExcelExportRequest):
    """Export estimate to Excel format"""
    if estimate_id not in estimates_db:
        raise HTTPException(status_code=404, detail="Estimate not found")
    
    estimate = estimates_db[estimate_id]
    
    # Create Excel file (simplified - you'd use openpyxl or xlsxwriter)
    filename = f"estimate_{estimate_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filepath = f"exports/{filename}"
    
    # Ensure exports directory exists
    os.makedirs("exports", exist_ok=True)
    
    # For now, create a JSON file (replace with actual Excel generation)
    with open(filepath.replace('.xlsx', '.json'), 'w') as f:
        json.dump(estimate, f, indent=2, default=str)
    
    return {"filename": filename, "download_url": f"/api/v1/downloads/{filename}"}

@app.get("/api/v1/downloads/{filename}")
async def download_file(filename: str):
    """Download exported file"""
    filepath = f"exports/{filename}"
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

# Utility endpoints
@app.post("/api/v1/estimates/from-template/{template_id}")
async def create_estimate_from_template(template_id: str, project_info: dict):
    """Create a new estimate from a template"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = templates_db[template_id]
    
    # Create new estimate based on template
    estimate = Estimate(
        project_name=project_info.get("project_name", "New Project"),
        project_location=project_info.get("project_location", ""),
        client_name=project_info.get("client_name", ""),
        estimate_date=datetime.now(),
        prepared_by=project_info.get("prepared_by", ""),
        template_id=template_id,
        sections=[EstimateSection(**section) for section in template["sections"]]
    )
    
    return await create_estimate(estimate)

@app.post("/api/v1/estimates/from-data/{data_id}")
async def create_estimate_from_data(data_id: str, project_info: dict):
    """Create a new estimate from imported data"""
    if data_id not in data_db:
        raise HTTPException(status_code=404, detail="Data not found")
    
    data = data_db[data_id]
    
    # Process data into estimate structure
    # This would involve mapping your data format to estimate sections
    estimate = Estimate(
        project_name=project_info.get("project_name", data["project_info"].get("project_name", "New Project")),
        project_location=project_info.get("project_location", ""),
        client_name=project_info.get("client_name", ""),
        estimate_date=datetime.now(),
        prepared_by=project_info.get("prepared_by", ""),
        sections=[]  # Process data.items into sections
    )
    
    return await create_estimate(estimate)

@app.get("/")
def root():
    return {"message": "CEAS Estimate API", "version": "1.0.0"}

@app.get("/api/v1/users")
def get_users():
    return {"message": "Users fetched successfully"}