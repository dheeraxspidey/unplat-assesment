from fastapi import APIRouter
from api.endpoints import auth, events, bookings

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
