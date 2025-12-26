from fastapi import FastAPI
from core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Why: Simple health check to verify the service and DB connection are reachable.
@app.get("/health")
def health_check():
    return {"status": "ok", "app_name": settings.PROJECT_NAME}

@app.get("/")
def root():
    return {"message": "Welcome to the Event Booking API"}
