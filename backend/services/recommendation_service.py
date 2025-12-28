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


        user_keywords = set()
        

        if user.interests:
            try:
                interests_list = json.loads(user.interests)
                if isinstance(interests_list, list):
                    for interest in interests_list:
                        user_keywords.add(interest.lower())
            except:
                pass
        

        # Limit to last 50 bookings for efficiency & recency relevance
        past_bookings = db.query(Booking).filter(Booking.user_id == user_id)\
                          .order_by(Booking.id.desc())\
                          .limit(50).all()
        
        type_counter = Counter()
        keyword_counter = Counter()

        for booking in past_bookings:
            event = booking.event
            # Weight event type heavily
            type_counter[event.event_type.value.lower()] += 1
            
            # Extract keywords from title/desc
            words = RecommendationService._tokenize(event.title)
            # Give title words more weight than description (add them twice)
            keyword_counter.update(words)
            keyword_counter.update(words) 
            
            desc_words = RecommendationService._tokenize(event.description)
            keyword_counter.update(desc_words)

        # Build optimized profile: Top 3 favorite categories + Top 20 keywords
        # This keeps the set small even if user has 1000 bookings
        top_types = {t for t, _ in type_counter.most_common(3)}
        top_keywords = {k for k, _ in keyword_counter.most_common(20)}
        
        user_keywords.update(top_types)
        user_keywords.update(top_keywords)


        from datetime import datetime
        from services.event_service import EventService
        EventService.update_ended_events(db)
        
        now = datetime.now()
        candidate_events = db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            Event.date > now
        ).all()


        booked_event_ids = {b.event_id for b in past_bookings}
        candidate_events = [e for e in candidate_events if e.id not in booked_event_ids]


        scored_events = []
        for event in candidate_events:
            event_keywords = RecommendationService._tokenize(event.title)
            event_keywords.update(RecommendationService._tokenize(event.description))
            event_keywords.add(event.event_type.value.lower())
            
            score = RecommendationService._calculate_jaccard_similarity(user_keywords, event_keywords)
            scored_events.append((event, score))


        scored_events.sort(key=lambda x: x[1], reverse=True)

        return [e for e, s in scored_events[:limit]]
