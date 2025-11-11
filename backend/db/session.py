from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from settings import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Convert postgresql:// to postgresql+psycopg2:// for SQLAlchemy 2.0 with psycopg2
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Create engine with connection pooling for PostgreSQL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,  # Number of connections to maintain
    max_overflow=10  # Additional connections that can be created
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()