import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.schema import User, Profile, Rider, LeadSegment
import os

engine = create_engine("sqlite:///./road_warrior.db")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

with open("road_warrior_data.json", "r") as f:
    data = json.load(f)

for rider in data.get("riders", []):
    phone = rider.get("phone")
    full_name = rider.get("full_name") or "User"
    hashed_password = rider.get("password") or "$2b$12$GSKQ46aVAb.KgqcGyVq1g.MDxMV9R.BGIZtC341zXXdVf2WsBH91a" # default 'password123'
    
    # Check if user exists
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(
            phone=phone,
            full_name=full_name,
            hashed_password=hashed_password,
            role="rider"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Add profile
    profile = Profile(
        user_id=user.id,
        city=rider.get("city"),
        language_pref=rider.get("preferred_language")
    )
    db.add(profile)
    
db.commit()
print("Database seeded successfully.")
