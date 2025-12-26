from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models.event import EventStatus

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    total_seats: int = Field(gt=0, description="Total seats must be greater than 0")
    price: float = Field(ge=0, description="Price must be non-negative")

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

class EventResponse(EventBase):
    id: int
    organizer_id: int
    available_seats: int
    status: EventStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
