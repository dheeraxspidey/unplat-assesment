from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.booking import Booking, BookingStatus
from models.event import Event, EventStatus
from schemas.booking import BookingCreate

class BookingService:
    @staticmethod
    def create_booking(db: Session, booking_in: BookingCreate, user_id: int) -> Booking:
        try:
            # Lock the event row for high concurrency safety
            event = db.query(Event).with_for_update().filter(Event.id == booking_in.event_id).first()
            
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
            
            if event.status != EventStatus.PUBLISHED:
                raise HTTPException(status_code=400, detail="Event is not published or has already ended")
            
            from datetime import datetime
            if event.date < datetime.utcnow():
                event.status = EventStatus.ENDED
                db.commit()
                raise HTTPException(status_code=400, detail="This event has already ended and cannot be booked")
            
            if event.available_seats < booking_in.number_of_seats:
                raise HTTPException(status_code=400, detail="Not enough seats available")
            

            
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
    def get_user_bookings(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        return db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> dict:
        from datetime import datetime
        bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
        
        total_bookings = len(bookings)
        

        now = datetime.utcnow()
        upcoming_count = 0
        for b in bookings:
            if b.status == BookingStatus.CONFIRMED and b.event.date > now:
                upcoming_count += 1
                
        return {
            "total_bookings": total_bookings,
            "upcoming_events": upcoming_count
        }

    @staticmethod
    def cancel_booking_by_user(db: Session, booking_id: int, user_id: int):
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Booking is not confirmed or already cancelled")
            

        event = db.query(Event).with_for_update().filter(Event.id == booking.event_id).first()
        if event:
            event.available_seats += booking.number_of_seats
            
        booking.status = BookingStatus.CANCELLED_BY_USER
        db.commit()
        db.refresh(booking)
        return booking
