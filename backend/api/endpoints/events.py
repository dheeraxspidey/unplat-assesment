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
from services.recommendation_service import RecommendationService

router = APIRouter()

@router.get("/recommendations", response_model=List[EventResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    limit: int = 3
) -> Any:
    """
    Get personalized event recommendations based on user interests and history.
    """
    return RecommendationService.get_keyword_recommendations(db, current_user.id, limit)

@router.get("/", response_model=List[EventResponse])
def read_events(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Filter by location"),
    status: Optional[EventStatus] = Query(EventStatus.PUBLISHED, description="Filter by status (default: PUBLISHED)"),
    type: Optional[EventType] = Query(None, description="Filter by event type"),
    search: Optional[str] = Query(None, description="Search by title or location"),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = Query(None, description="Filter events after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events before this date"),
) -> Any:
    """
    Retrieve events.
    """

    EventService.update_ended_events(db)
    
    query = db.query(Event).filter(Event.status == status)
    

    from sqlalchemy import or_

    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(Event.title.ilike(search_filter), Event.location.ilike(search_filter)))
    
    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))
    if type:
        query = query.filter(Event.event_type == type)
    if start_date:
        query = query.filter(Event.date >= start_date)
    if end_date:
        query = query.filter(Event.date <= end_date)
    return query.offset(skip).limit(limit).all()

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
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "date",
    sort_desc: bool = False,
) -> Any:
    """
    Get all events created by current organizer.
    """
    return EventService.get_organizer_events(db, current_user.id, skip=skip, limit=limit, sort_by=sort_by, sort_desc=sort_desc)

@router.get("/stats/overview", response_model=dict)
def get_organizer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Get aggregated statistics for the organizer.
    """
    return EventService.get_organizer_stats(db, current_user.id)

@router.get("/{id}", response_model=EventResponse)
def get_event_by_id(
    *,
    db: Session = Depends(get_db),
    id: int,
) -> Any:
    """
    Get a single event by ID. Updates status if event has ended.
    """

    EventService.update_ended_events(db)
    
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

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

@router.delete("/{id}/permanent", response_model=dict)
def delete_draft_event(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(deps.get_current_organizer),
) -> Any:
    """
    Permanently delete a DRAFT event (Organizer only).
    Only DRAFT events can be permanently deleted.
    """
    return EventService.delete_draft_event(db, id, current_user.id)


