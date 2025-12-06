from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from settings import settings

from db.base import Base
from db.session import engine
from api.v1.data import data_router
from api.v1.project import project_router
from api.v1.excel_data import excel_data_router
from api.v1.templates import templates_router
from api.v1.estimates import estimates_router


def include_routers(app:FastAPI):
    app.include_router(data_router, prefix="/api/v1/data")
    app.include_router(project_router, prefix="/api/v1/project")
    app.include_router(excel_data_router, prefix="/api/v1")
    app.include_router(templates_router, prefix="/api/v1")
    app.include_router(estimates_router, prefix="/api/v1")

def create_tables():
    Base.metadata.create_all(bind=engine)

def start_application():
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)
    
    # Add CORS middleware
    # If origins is ["*"], set credentials to False (required by CORS spec)
    cors_origins = settings.CORS_ALLOW_ORIGINS
    cors_credentials = settings.CORS_ALLOW_CREDENTIALS
    if cors_origins == ["*"]:
        cors_credentials = False
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=cors_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    include_routers(app)
    create_tables()
    return app

app = start_application()