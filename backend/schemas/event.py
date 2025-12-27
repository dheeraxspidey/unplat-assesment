from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models.event import EventStatus, EventType

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    total_seats: int = Field(gt=0, description="Total seats must be greater than 0")
    price: float = Field(ge=0, description="Price must be non-negative")
    event_type: EventType = EventType.OTHER

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    total_seats: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0)
    status: Optional[EventStatus] = None
    image_id: Optional[str] = None
    event_type: Optional[EventType] = None

class EventResponse(EventBase):
    id: int
    organizer_id: int
    available_seats: int
    status: EventStatus
    image_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
