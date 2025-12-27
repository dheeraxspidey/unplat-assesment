from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.event import Event, EventStatus
from schemas.event import EventCreate, EventUpdate
from models.user import User

class EventService:
    @staticmethod
    def create_event(
        db: Session, 
        event_dict: dict, # Changed from Schema to dict to handle Form + File
        organizer_id: int, 
        image_file = None, 
        image_url: str = None
    ) -> Event:
        import uuid
        import shutil
        import requests
        import os
        from pathlib import Path

        image_id = None
        MEDIA_DIR = Path("media")
        MEDIA_DIR.mkdir(exist_ok=True)

        if image_file:
            file_extension = os.path.splitext(image_file.filename)[1]
            image_id = f"{uuid.uuid4()}{file_extension}"
            file_path = MEDIA_DIR / image_id
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
        
        elif image_url:
            try:
                response = requests.get(image_url, stream=True)
                if response.status_code == 200:
                    # Guess extension from url or content-type
                    content_type = response.headers.get('content-type')
                    ext = ".jpg" # Default
                    if content_type == "image/png": ext = ".png"
                    elif content_type == "image/jpeg": ext = ".jpg"
                    elif content_type == "image/webp": ext = ".webp"
                    
                    image_id = f"{uuid.uuid4()}{ext}"
                    file_path = MEDIA_DIR / image_id
                    with open(file_path, "wb") as buffer:
                        for chunk in response.iter_content(chunk_size=8192):
                            buffer.write(chunk)
            except Exception as e:
                print(f"Failed to download image: {e}")

        # Initially available seats = total seats
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
         
         # Cascade cancellation to bookings
         from models.booking import Booking, BookingStatus
         db.query(Booking).filter(Booking.event_id == event_id).update(
             {Booking.status: BookingStatus.CANCELLED_BY_ORGANIZER}, synchronize_session=False
         )
         
         db.commit()
         db.refresh(event)
         return event
