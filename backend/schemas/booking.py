from pydantic import BaseModel
from datetime import datetime
from models.booking import BookingStatus
from schemas.event import EventResponse

class BookingCreate(BaseModel):
    event_id: int
    number_of_seats: int = 1

class BookingResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: BookingStatus
    number_of_seats: int
    created_at: datetime
    event: EventResponse
    
    # We might want to include event details, but let's keep it minimal for now.
    class Config:
        from_attributes = True
