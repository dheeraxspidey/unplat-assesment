from typing import List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from api import deps
from core.database import get_db
from models.user import User
from models.event import Event, EventStatus, EventType
from schemas.event import EventCreate, EventResponse, EventUpdate
from services.event_service import EventService

router = APIRouter()

@router.get("/", response_model=List[EventResponse])
def read_events(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by location"),
    status: Optional[EventStatus] = Query(EventStatus.PUBLISHED, description="Filter by status (default: PUBLISHED)"),
    type: Optional[EventType] = Query(None, description="Filter by event type"),
) -> Any:
    """
    Retrieve events.
    """
    query = db.query(Event).filter(Event.status == status)
    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))
    if type:
        query = query.filter(Event.event_type == type)
    return query.all()

@router.post("/", response_model=EventResponse)
def create_event(
    *,
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    date: datetime = Form(...),
    location: str = Form(...),
    total_seats: int = Form(...),
    price: float = Form(...),
    event_type: EventType = Form(...),
    image_url: Optional[str] = Form(None),
    image_file: UploadFile = File(None),
    status: EventStatus = Form(EventStatus.DRAFT),
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Create new event (Organizer only).
    """
    event_dict = {
        "title": title,
        "description": description,
        "date": date,
        "location": location,
        "total_seats": total_seats,
        "price": price,
        "event_type": event_type,
        "status": status,
    }
    return EventService.create_event(db, event_dict, current_user.id, image_file, image_url)

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

@router.delete("/{id}", response_model=EventResponse)
def cancel_event(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Cancel an event (Organizer only).
    """
    return EventService.cancel_event(db, id, current_user.id)
