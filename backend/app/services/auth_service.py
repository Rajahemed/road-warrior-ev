from sqlalchemy.orm import Session
from app.models.schema import User
import bcrypt

def verify_password(plain_password, hashed_password):
    if not hashed_password: return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_or_create_user(db: Session, phone: str, full_name: str = None) -> User:
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        if not full_name:
            full_name = "Rider"
        user = User(
            phone=phone,
            full_name=full_name,
            hashed_password=""
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def create_user_with_password(db: Session, phone: str, full_name: str, email: str, password: str) -> User:
    user = db.query(User).filter(User.phone == phone).first()
    if user:
        return None # Already exists
        
        
    hashed_password = get_password_hash(password)
    user = User(
        phone=phone,
        email=email,
        full_name=full_name,
        hashed_password=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
