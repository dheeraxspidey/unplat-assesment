from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.booking import Booking, BookingStatus
from models.event import Event, EventStatus
from schemas.booking import BookingCreate

class BookingService:
    @staticmethod
    def create_booking(db: Session, booking_in: BookingCreate, user_id: int) -> Booking:
        # Atomic Transaction
        try:
            # High Concurrency Logic: Lock the event row
            # This ensures no other transaction can read/modify this event until we commit
            event = db.query(Event).with_for_update().filter(Event.id == booking_in.event_id).first()
            
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            
            if event.status != EventStatus.PUBLISHED:
                raise HTTPException(status_code=400, detail="Event is not published")
            
            if event.available_seats < booking_in.number_of_seats:
                raise HTTPException(status_code=400, detail="Not enough seats available")
            
            # Use specific error message for duplicate bookings if needed, 
            # though requirements didn't strictly forbid multiple tickets per user.
            # Assuming 1 ticket per request.
            
            event.available_seats -= booking_in.number_of_seats
            
            booking = Booking(
                user_id=user_id,
                event_id=booking_in.event_id,
                status=BookingStatus.CONFIRMED,
                number_of_seats=booking_in.number_of_seats
            )
            db.add(booking)
            db.commit()
            db.refresh(booking)
            return booking
            
        except HTTPException as e:
            db.rollback()
            raise e
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def get_user_bookings(db: Session, user_id: int):
        return db.query(Booking).filter(Booking.user_id == user_id).all()
