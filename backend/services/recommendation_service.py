from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.event import Event, EventStatus
from models.booking import Booking
from models.user import User
from collections import Counter
import json
import math

class RecommendationService:
    @staticmethod
    def _tokenize(text: str) -> set[str]:
        if not text:
            return set()
        # Simple whitespace tokenization + lowercasing
        return set(word.lower() for word in text.split() if len(word) > 3)

    @staticmethod
    def _calculate_jaccard_similarity(user_keywords: set[str], event_keywords: set[str]) -> float:
        intersection = len(user_keywords.intersection(event_keywords))
        union = len(user_keywords.union(event_keywords))
        if union == 0:
            return 0.0
        return intersection / union

    @staticmethod
    def get_keyword_recommendations(db: Session, user_id: int, limit: int = 5):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # 1. Build User Profile Vector (Keywords)
        user_keywords = set()
        
        # Explicit Interests
        if user.interests:
            try:
                interests_list = json.loads(user.interests)
                if isinstance(interests_list, list):
                    for interest in interests_list:
                        user_keywords.add(interest.lower())
            except:
                pass # Handle malformed JSON safely
        
        # Implicit History
        past_bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
        for booking in past_bookings:
            event = booking.event
            user_keywords.update(RecommendationService._tokenize(event.title))
            user_keywords.update(RecommendationService._tokenize(event.description))
            user_keywords.add(event.event_type.value.lower())

        # 2. Fetch Candidates (Upcoming Events)
        from datetime import datetime
        now = datetime.utcnow()
        candidate_events = db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            Event.date > now
        ).all()

        # Filter out already booked events
        booked_event_ids = {b.event_id for b in past_bookings}
        candidate_events = [e for e in candidate_events if e.id not in booked_event_ids]

        # 3. Score Candidates
        scored_events = []
        for event in candidate_events:
            event_keywords = RecommendationService._tokenize(event.title)
            event_keywords.update(RecommendationService._tokenize(event.description))
            event_keywords.add(event.event_type.value.lower())
            
            score = RecommendationService._calculate_jaccard_similarity(user_keywords, event_keywords)
            scored_events.append((event, score))

        # 4. Rank
        scored_events.sort(key=lambda x: x[1], reverse=True)

        return [e for e, s in scored_events[:limit]]
