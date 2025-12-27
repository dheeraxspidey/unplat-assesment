from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api import deps
from core.database import get_db
from models.user import User
from schemas.booking import BookingCreate, BookingResponse
from services.booking_service import BookingService

router = APIRouter()

@router.post("/", response_model=BookingResponse)
def create_booking(
    *,
    db: Session = Depends(get_db),
    booking_in: BookingCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Book an event (Attendee).
    """
    return BookingService.create_booking(db, booking_in, current_user.id)

@router.get("/my-bookings", response_model=List[BookingResponse])
def read_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all bookings for current user.
    """
    return BookingService.get_user_bookings(db, current_user.id, skip=skip, limit=limit)

@router.get("/my-stats", response_model=dict)
def read_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated stats for current user.
    """
    return BookingService.get_user_stats(db, current_user.id)

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Cancel a booking (User).
    """
    return BookingService.cancel_booking_by_user(db, booking_id, current_user.id)
