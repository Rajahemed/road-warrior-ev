from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.schema import Profile, Rider, Vehicle, InsuranceLead, EVLead, LeadSegment

engine = create_engine("sqlite:///./road_warrior.db")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Find users who have more than 1 profile
profiles = db.query(Profile).all()
user_profiles = {}
for p in profiles:
    if p.user_id not in user_profiles:
        user_profiles[p.user_id] = []
    user_profiles[p.user_id].append(p)

duplicates_removed = 0

for user_id, user_profs in user_profiles.items():
    if len(user_profs) > 1:
        # Sort by ID to find the latest
        user_profs.sort(key=lambda x: x.id)
        duplicates_to_delete = user_profs[:-1]
        
        for dup in duplicates_to_delete:
            db.delete(dup)
            duplicates_removed += 1
            
        for table in [Rider, Vehicle, InsuranceLead, EVLead]:
            records = db.query(table).filter(table.user_id == user_id).all()
            if len(records) > 1:
                records.sort(key=lambda x: x.id)
                for r in records[:-1]:
                    db.delete(r)

db.commit()
print(f"Cleanup complete. Removed duplicate records for {duplicates_removed} user submissions.")
