from typing import Generator

from sqlalchemy.orm import Session

from db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional scope for FastAPI dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
