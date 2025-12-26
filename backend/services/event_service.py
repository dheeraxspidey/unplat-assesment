from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.event import Event, EventStatus
from schemas.event import EventCreate, EventUpdate
from models.user import User

class EventService:
    @staticmethod
    def create_event(db: Session, event_in: EventCreate, organizer_id: int) -> Event:
        # Initially available seats = total seats
        event = Event(
            **event_in.model_dump(),
            available_seats=event_in.total_seats,
            organizer_id=organizer_id,
            status=EventStatus.DRAFT
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_organizer_events(db: Session, organizer_id: int):
        return db.query(Event).filter(Event.organizer_id == organizer_id).all()

    @staticmethod
    def update_event(db: Session, event_id: int, event_in: EventUpdate, organizer_id: int) -> Event:
        event = db.query(Event).filter(Event.id == event_id, Event.organizer_id == organizer_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found or permission denied")
        
        update_data = event_in.model_dump(exclude_unset=True)
        
        # Handle seat logic if total_seats is changed
        if "total_seats" in update_data:
            seat_diff = update_data["total_seats"] - event.total_seats
            if event.available_seats + seat_diff < 0:
                raise HTTPException(status_code=400, detail="Cannot reduce total seats below currently booked count")
            event.available_seats += seat_diff

        for field, value in update_data.items():
            setattr(event, field, value)

        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def cancel_event(db: Session, event_id: int, organizer_id: int) -> Event:
         event = db.query(Event).filter(Event.id == event_id, Event.organizer_id == organizer_id).first()
         if not event:
            raise HTTPException(status_code=404, detail="Event not found")
         
         event.status = EventStatus.CANCELLED
         # Logic for cancelling bookings will go here in Phase 4
         
         db.commit()
         db.refresh(event)
         return event
