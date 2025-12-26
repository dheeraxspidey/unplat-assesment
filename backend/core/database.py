from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Why: We need a connection to the MySQL database.
# The URL is pulled from settings to support Docker/Local environments.
engine = create_engine(settings.DATABASE_URL)

# Why: Each request should have its own database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Why: All models will inherit from this Base class for ORM mapping.
Base = declarative_base()

# Why: Dependency injection for FastAPI routes.
# Ensures the session is closed after the request is processed.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
