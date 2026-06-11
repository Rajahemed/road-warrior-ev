from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.otp_service import send_fast2sms_otp, verify_otp_code
from app.services.auth_service import get_or_create_user, create_user_with_password, verify_password
from app.models.schema import User
from app.utils.security import create_access_token, verify_recaptcha
from app.middleware.rate_limiter import limiter
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    full_name: str = None

class RegisterRequest(BaseModel):
    phone: str
    full_name: str
    email: str
    password: str
    recaptcha_token: str

class LoginRequest(BaseModel):
    phone: str
    password: str
    recaptcha_token: str

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
        
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="reCAPTCHA verification failed.")
        
    user = create_user_with_password(db, data.phone, data.full_name, data.email, data.password)
    if not user:
        raise HTTPException(status_code=400, detail="User with this phone number or email already exists.")
    
    access_token = create_access_token(data={"sub": str(user.id), "phone": user.phone, "role": user.role}, expires_delta=timedelta(days=7))
    return {"message": "Registered successfully", "access_token": access_token, "token_type": "bearer"}

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="reCAPTCHA verification failed.")
        
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password.")
    
    from app.models.schema import Profile
    has_completed_questionnaire = db.query(Profile).filter(Profile.user_id == user.id).first() is not None
    
    access_token = create_access_token(data={"sub": str(user.id), "phone": user.phone, "role": user.role}, expires_delta=timedelta(days=7))
    return {"message": "Logged in successfully", "access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "phone": user.phone, "full_name": user.full_name, "role": user.role, "has_completed_questionnaire": has_completed_questionnaire}}

@router.post("/send-otp")
@limiter.limit("3/minute")
def send_otp(request: Request, data: SendOTPRequest, db: Session = Depends(get_db)):
    success = send_fast2sms_otp(db, data.phone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP.")
    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
@limiter.limit("5/minute")
def verify_otp(request: Request, data: VerifyOTPRequest, db: Session = Depends(get_db)):
    is_valid = verify_otp_code(db, data.phone, data.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    
    user = get_or_create_user(db, data.phone, data.full_name)
    from app.models.schema import Profile
    has_completed_questionnaire = db.query(Profile).filter(Profile.user_id == user.id).first() is not None
    
    access_token = create_access_token(data={"sub": str(user.id), "phone": user.phone, "role": user.role}, expires_delta=timedelta(days=7))
    return {
        "message": "Authenticated successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "phone": user.phone, "full_name": user.full_name, "role": user.role, "has_completed_questionnaire": has_completed_questionnaire}
    }

class ForgotPasswordRequest(BaseModel):
    phone: str

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number not registered.")
    
    # In a real app, send a reset link or OTP. 
    # For now, we will just send an OTP using Fast2SMS logic to reset password.
    success = send_fast2sms_otp(db, data.phone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send password reset OTP.")
        
    return {"message": "A password reset OTP has been sent to your phone."}
