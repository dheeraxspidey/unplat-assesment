from sqlalchemy import create_engine
from core.database import Base, engine
from models import user, event, booking
import sys
import os

# Add current directory to path so imports work
sys.path.append(os.getcwd())

import shutil

def reset_db():
    print("Connecting to database...")
    try:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped successfully.")
        
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")

        # Cleanup Media
        media_path = os.path.join(os.getcwd(), "media")
        if os.path.exists(media_path):
            print("Cleaning up media folder...")
            shutil.rmtree(media_path)
            print("Media folder deleted.")
        
        os.makedirs(media_path, exist_ok=True)
        print("Empty media folder created.")
        
    except Exception as e:
        print(f"Error resetting DB: {e}")

if __name__ == "__main__":
    reset_db()
