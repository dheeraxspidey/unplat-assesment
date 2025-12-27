import enum
from sqlalchemy import Boolean, Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from core.database import Base

class UserRole(str, enum.Enum):
    ORGANIZER = "ORGANIZER"
    ATTENDEE = "ATTENDEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Why: Enforcing Roles at the database level.
    role = Column(Enum(UserRole), default=UserRole.ATTENDEE, nullable=False)
    
    is_active = Column(Boolean(), default=True)
    
    # Store explicit user interests as JSON string (e.g. '["Music", "Tech"]')
    interests = Column(String(500), default="[]")

    events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="user")
