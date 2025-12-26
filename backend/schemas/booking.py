from pydantic import BaseModel
from datetime import datetime
from models.booking import BookingStatus

class BookingCreate(BaseModel):
    event_id: int

class BookingResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: BookingStatus
    created_at: datetime
    
    # We might want to include event details, but let's keep it minimal for now.
    class Config:
        from_attributes = True
