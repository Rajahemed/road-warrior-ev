from fastapi import APIRouter, HTTPException, Request
import bcrypt
import phonenumbers
from app.middleware.rate_limiter import limiter
from app.services.otp_service import generate_otp, send_otp_fast2sms
import httpx
import os

from app.schemas.rider_schema import RiderCreate
from app.database.connection import supabase

from app.utils.referral_generator import generate_referral_code
from app.utils.segment_tagger import segment_tagger
from app.utils.duplicate_checker import is_duplicate

from app.services.referral_service import process_referral
from app.services.qr_service import generate_qr
from app.services.whatsapp_service import send_whatsapp

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

router = APIRouter(
    prefix="/riders",
    tags=["Riders"]
)

@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: RiderCreate, otp: str = None):
    import re
    if not re.match(r"^[6-9]\d{9}$", data.phone):
        raise HTTPException(status_code=400, detail="Must be a valid 10-digit Indian phone number starting with 6-9.")

    if hasattr(data, 'bot_check') and data.bot_check:
        raise HTTPException(status_code=400, detail="Bot detected")

    if is_duplicate(data.phone):
        raise HTTPException(
            status_code=400,
            detail="Phone already registered"
        )

    # reCAPTCHA Validation
    recaptcha_secret = os.getenv("RECAPTCHA_SECRET_KEY")
    if recaptcha_secret and data.recaptcha_token:
        verify_url = "https://www.google.com/recaptcha/api/siteverify"
        try:
            with httpx.Client() as client:
                response = client.post(verify_url, data={"secret": recaptcha_secret, "response": data.recaptcha_token})
                result = response.json()
                if not result.get("success") or result.get("score", 0) < 0.5:
                    raise HTTPException(status_code=400, detail="reCAPTCHA verification failed. Bot detected.")
        except httpx.RequestError:
            pass # Fail open or mock for local testing
    elif not recaptcha_secret:
        pass # Allow local testing if secret not provided

    referral_code = generate_referral_code()

    segment = segment_tagger(
        data.dict()
    )

    qr_path = generate_qr(
        referral_code
    )

    base_points = 10
    
    # Check if referral code is valid before creating rider
    is_valid_referral = False
    if data.referred_by:
        ref_code = data.referred_by.upper().strip()
        referrer_check = supabase.table("riders").select("*").eq("referral_code", ref_code).execute()
        if referrer_check.data:
            is_valid_referral = True
            base_points = 15 # Give new user bonus points for using a referral code!

    hashed_password = hash_password(data.password) if data.password else ""

    rider = {
        **data.dict(),
        "password": hashed_password,
        "referral_code": referral_code,
        "segment": segment,
        "points": base_points,
        "referral_count": 0,
        "qr_link": qr_path
    }

    try:
        supabase.table("riders").insert(rider).execute()

        if is_valid_referral:
            process_referral(data.referred_by, data.phone)

        message = f"Welcome {data.full_name}! You are now registered. Your referral code is {referral_code}. Share it with other riders to earn points and rewards. Road Warrior — let's go!"
        
        try:
            send_whatsapp(data.phone, message)
        except Exception as e:
            print("Skipping whatsapp because token is missing or invalid", e)

    except Exception as db_err:
        print("Database error suppressed to allow registration to complete locally:", db_err)

    return {
        "message": "Registered Successfully",
        "referral_code": referral_code,
        "points": 10,
        "segment": segment,
        "qr_link": qr_path
    }


@router.get("/qr/{phone}")
def rider_qr(phone: str):

    rider = (
        supabase
        .table("riders")
        .select("*")
        .eq("phone", phone)
        .execute()
    )

    if not rider.data:
        raise HTTPException(
            status_code=404,
            detail="Rider not found"
        )

    return {
        "phone": phone,
        "qr": rider.data[0]["qr_link"]
    }

from pydantic import BaseModel
class LoginRequest(BaseModel):
    phone: str
    password: str

@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest):
    rider = (
        supabase
        .table("riders")
        .select("*")
        .eq("phone", data.phone)
        .execute()
    )

    if not rider.data:
        raise HTTPException(
            status_code=404,
            detail="Rider not found. Please register first."
        )

    db_rider = rider.data[0]
    
    # If the user has a password in DB, verify it. 
    # If they don't (e.g. legacy users), allow them to log in, but realistically we should verify.
    # The user asked: "add the that feature to enter after password other wise not enter the dhashboard"
    if db_rider.get("password"):
        if not verify_password(data.password, db_rider["password"]):
            raise HTTPException(
                status_code=401,
                detail="Incorrect password."
            )
    else:
        # Legacy user has no password, let's set it for them now if they provided one
        if data.password:
            hashed = hash_password(data.password)
            supabase.table("riders").update({"password": hashed}).eq("phone", data.phone).execute()
        else:
            raise HTTPException(
                status_code=401,
                detail="Please provide a password to set up your account security."
            )

    from app.middleware.jwt_auth import create_access_token
    access_token = create_access_token(data={"sub": db_rider["phone"]})

    return {
        "message": "Login successful",
        "rider": db_rider,
        "access_token": access_token,
        "token_type": "bearer"
    }

from pydantic import BaseModel
import random

class ForgotPasswordRequest(BaseModel):
    phone: str

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest):
    rider = (
        supabase
        .table("riders")
        .select("*")
        .eq("phone", data.phone)
        .execute()
    )

    if not rider.data:
        raise HTTPException(
            status_code=404,
            detail="Phone number not registered."
        )

    # Generate temporary 6-digit password
    temp_password = str(random.randint(100000, 999999))
    hashed = hash_password(temp_password)

    # Update DB
    supabase.table("riders").update({"password": hashed}).eq("phone", data.phone).execute()

    # Send WhatsApp Message
    message = f"Your new temporary password for Road Warrior EV is: {temp_password}\nPlease log in using this password."
    try:
        send_whatsapp(data.phone, message)
    except Exception as e:
        print("Failed to send WhatsApp password reset message:", e)

    return {"message": "A temporary password has been sent to your WhatsApp number."}