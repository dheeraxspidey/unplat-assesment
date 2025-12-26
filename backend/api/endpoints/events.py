from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api import deps
from core.database import get_db
from models.user import User
from schemas.event import EventCreate, EventResponse, EventUpdate
from services.event_service import EventService

router = APIRouter()

@router.post("/", response_model=EventResponse)
def create_event(
    *,
    db: Session = Depends(get_db),
    event_in: EventCreate,
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Create new event (Organizer only).
    """
    return EventService.create_event(db, event_in, current_user.id)

@router.get("/my-events", response_model=List[EventResponse])
def read_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Get all events created by current organizer.
    """
    return EventService.get_organizer_events(db, current_user.id)

@router.put("/{id}", response_model=EventResponse)
def update_event(
    *,
    db: Session = Depends(get_db),
    id: int,
    event_in: EventUpdate,
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Update an event (Organizer only).
    """
    return EventService.update_event(db, id, event_in, current_user.id)
