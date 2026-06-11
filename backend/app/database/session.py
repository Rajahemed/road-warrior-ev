from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Wait, if SUPABASE_URL is just https://... we need the postgresql:// connection string
# Usually stored in DATABASE_URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL if hasattr(settings, "DATABASE_URL") and settings.DATABASE_URL else "sqlite:///./road_warrior.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
