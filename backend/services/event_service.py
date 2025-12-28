from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.event import Event, EventStatus
from schemas.event import EventCreate, EventUpdate
from models.user import User

class EventService:
    @staticmethod
    def create_event(
        db: Session, 
        event_dict: dict, 
        organizer_id: int, 
        image_file = None, 
        image_url: str = None
    ) -> Event:
        import uuid
        import shutil
        import os
        from pathlib import Path

        image_id = None
        MEDIA_DIR = Path("media")
        MEDIA_DIR.mkdir(exist_ok=True)

        if image_file and image_file.filename:
            file_extension = os.path.splitext(image_file.filename)[1]
            image_id = f"{uuid.uuid4()}{file_extension}"
            file_path = MEDIA_DIR / image_id
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
        
        elif image_url:
            # Simply store the URL directly. Be resilient to ephemeral filesystems.
            image_id = image_url

        event = Event(
            **event_dict,
            image_id=image_id,
            available_seats=event_dict.get("total_seats", 0),
            organizer_id=organizer_id
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def update_ended_events(db: Session):
        from datetime import datetime
        # Compare in UTC for consistency with frontend timestamps
        now = datetime.utcnow()
        
        # Mark as ENDED if end_date has passed (or date has passed if end_date doesn't exist/logic fallback)
        # Using a slightly complex condition:
        # If end_date is present, check end_date < now
        # If end_date is null (legacy?), check date < now
        from sqlalchemy import or_
        
        db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            or_(
                Event.end_date < now,
                (Event.end_date == None) & (Event.date < now)
            )
        ).update({Event.status: EventStatus.ENDED}, synchronize_session=False)
        db.commit()

    @staticmethod
    def get_organizer_events(db: Session, organizer_id: int, skip: int = 0, limit: int = 100, sort_by: str = "date", sort_desc: bool = False):

        EventService.update_ended_events(db)
        
        query = db.query(Event).filter(Event.organizer_id == organizer_id)
        
        if sort_by == "price":
            sort_attr = Event.price
        elif sort_by == "sold":
            # Sort by calculated sold seats (total - available)
            sort_attr = Event.total_seats - Event.available_seats
        elif sort_by == "status":
            sort_attr = Event.status
        else:

            sort_attr = Event.date
            
        if sort_desc:
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())
            
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_event(db: Session, event_id: int, event_in: EventUpdate, organizer_id: int) -> Event:
        event = db.query(Event).filter(Event.id == event_id, Event.organizer_id == organizer_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found or permission denied")
        
        update_data = event_in.model_dump(exclude_unset=True)
        

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
         

         from models.booking import Booking, BookingStatus
         db.query(Booking).filter(Booking.event_id == event_id).update(
             {Booking.status: BookingStatus.CANCELLED_BY_ORGANIZER}, synchronize_session=False
         )
         
         db.commit()
         db.refresh(event)
         return event

    @staticmethod
    def get_organizer_stats(db: Session, organizer_id: int) -> dict:
        events = db.query(Event).filter(Event.organizer_id == organizer_id).all()
        
        total_events = len(events)
        total_tickets_sold = sum(e.total_seats - e.available_seats for e in events)
        total_revenue = sum((e.total_seats - e.available_seats) * e.price for e in events)
        

        active_events = sum(1 for e in events if e.status == EventStatus.PUBLISHED)

        return {
            "total_events": total_events,
            "tickets_sold": total_tickets_sold,
            "total_revenue": total_revenue,
            "active_events": active_events
        }

    @staticmethod
    def delete_draft_event(db: Session, event_id: int, organizer_id: int) -> dict:
        """Permanently delete a DRAFT event from the database."""
        event = db.query(Event).filter(
            Event.id == event_id, 
            Event.organizer_id == organizer_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        if event.status != EventStatus.DRAFT:
            raise HTTPException(
                status_code=400, 
                detail="Only DRAFT events can be permanently deleted. Cancel published events instead."
            )
        

        if event.image_id:
            from pathlib import Path
            image_path = Path("media") / event.image_id
            if image_path.exists():
                image_path.unlink()
        
        event_title = event.title
        db.delete(event)
        db.commit()
        
        return {"message": f"Event '{event_title}' has been permanently deleted."}
