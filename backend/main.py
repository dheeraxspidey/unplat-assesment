from fastapi import FastAPI
from core.config import settings

from api.api import api_router
from core.database import Base, engine

import time
from sqlalchemy.exc import OperationalError

# Create tables with retry logic
max_retries = 10
retry_interval = 2

for i in range(max_retries):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
        break
    except OperationalError as e:
        if i == max_retries - 1:
            print(f"Failed to connect to database after {max_retries} attempts.")
            raise e
        print(f"Database connection failed. Retrying in {retry_interval} seconds... ({i+1}/{max_retries})")
        time.sleep(retry_interval)

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_STR}/openapi.json")

app.include_router(api_router, prefix=settings.API_STR)

# Why: Simple health check to verify the service and db connection are reachable.
@app.get("/health")
def health_check():
    return {"status": "ok", "app_name": settings.PROJECT_NAME}

@app.get("/")
def root():
    return {"message": "Welcome to the Event Booking API"}
