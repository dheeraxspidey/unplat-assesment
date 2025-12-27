from sqlalchemy import create_engine
from core.database import Base, engine
from models import user, event, booking
import sys
import os

# Add current directory to path so imports work
sys.path.append(os.getcwd())

def reset_db():
    print("Connecting to database...")
    try:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped successfully.")
        
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        
    except Exception as e:
        print(f"Error resetting DB: {e}")

if __name__ == "__main__":
    reset_db()
