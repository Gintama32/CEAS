import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # Project
    PROJECT_NAME = os.getenv("PROJECT_NAME", "CEAS")
    PROJECT_VERSION = os.getenv("PROJECT_VERSION", "1.0.0")
    #JWT
    # SECRET_KEY is used to sign and verify your JWTs. Change this in production.
    SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_64_CHARS")
    # Algorithm used by python-jose to sign tokens.
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    #Access tokens should be short-lived.
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    #issuer & audience claims.
    TOKEN_ISSUER = os.getenv("TOKEN_ISSUER", "ceas")
    TOKEN_AUDIENCE = os.getenv("TOKEN_AUDIENCE", "ceas-api")
    #Database
    # Default to SQLite file for zero-config local dev.
    #   postgresql+psycopg://user:pass@host:5432/ceas
    DATABASE_URL = os.getenv("DATABASE_URL")
    #CORS
    # During dev allow everything. In prod, set frontend origin(s):
    #   CORS_ALLOW_ORIGINS="https://app.example.com,https://admin.example.com"
    CORS_ALLOW_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if o.strip()
    ]
    CORS_ALLOW_CREDENTIALS = True
    BASE_DIR = Path(__file__).resolve().parent
    FILE_UPLOAD_DIR = os.getenv(
        "FILE_UPLOAD_DIR",
        str((Path(__file__).resolve().parent / "uploaded_excel").resolve())
    )
settings = Settings()

def get_cors_origins() -> list[str]:
    return settings.CORS_ALLOW_ORIGINS
