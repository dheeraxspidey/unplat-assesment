from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Why: We need a connection to the MySQL database.
# The URL is pulled from settings to support Docker/Local environments.
# For Aiven MySQL, we need to handle SSL and strip incompatible query parameters.
db_url = settings.DATABASE_URL
if "?" in db_url:
    # PyMySQL doesn't support 'ssl-mode' as a query parameter in the URL
    db_url = db_url.split("?")[0]

connect_args = {}
if "aivencloud.com" in settings.DATABASE_URL:
    # PyMySQL expects ssl to be a dict (empty dict = use default SSL)
    connect_args["ssl"] = {}

engine = create_engine(
    db_url,
    connect_args=connect_args
)

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
