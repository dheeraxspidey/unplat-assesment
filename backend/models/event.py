import enum

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"

class EventType(str, enum.Enum):
    CONCERT = "CONCERT"
    WORKSHOP = "WORKSHOP"
    CONFERENCE = "CONFERENCE"
    THEATER = "THEATER"
    OTHER = "OTHER"

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String(255), index=True)
    description = Column(String(1000), nullable=True)
    date = Column(DateTime)
    location = Column(String(255))
    
    total_seats = Column(Integer)
    available_seats = Column(Integer)
    price = Column(Float)

    image_id = Column(String(255), nullable=True)
    event_type = Column(Enum(EventType), default=EventType.OTHER, nullable=False)
    
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organizer = relationship("User", back_populates="events")
    bookings = relationship("Booking", back_populates="event")
