from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import phonenumbers
import random
import time
import requests
from datetime import timedelta
from app.middleware.rate_limiter import limiter
from app.utils.security import create_access_token
from app.config import settings

router = APIRouter(
    prefix="/otp",
    tags=["OTP"]
)

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

# Mock storage for OTPs. In production, use Redis or database with expiration.
otp_store = {}

@router.post("/send")
@limiter.limit("3/minute")
def send_otp(request: Request, data: SendOTPRequest):
    try:
        parsed_phone = phonenumbers.parse(data.phone, "IN")
        if not phonenumbers.is_valid_number(parsed_phone):
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid phone number format.")

    # Generate mock OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Store OTP with timestamp
    otp_store[data.phone] = {
        "otp": otp_code,
        "timestamp": time.time()
    }

    # Simulate Fast2SMS sending or actual sending if key exists
    if settings.FAST2SMS_API_KEY:
        url = "https://www.fast2sms.com/dev/bulkV2"
        querystring = {
            "authorization": settings.FAST2SMS_API_KEY,
            "variables_values": otp_code,
            "route": "otp",
            "numbers": data.phone.lstrip('+')
        }
        headers = {'cache-control': "no-cache"}
        try:
            response = requests.request("GET", url, headers=headers, params=querystring)
            print("Fast2SMS Response:", response.text)
        except Exception as e:
            print("Fast2SMS Error:", e)
            raise HTTPException(status_code=500, detail="Failed to send OTP via SMS gateway.")
    else:
        print(f"Mock Fast2SMS: Sending OTP {otp_code} to {data.phone}")

    return {"message": "OTP sent successfully"}


@router.post("/verify")
@limiter.limit("5/minute")
def verify_otp(request: Request, data: VerifyOTPRequest):
    if data.phone not in otp_store:
        raise HTTPException(status_code=400, detail="OTP not requested or expired.")
    
    stored_data = otp_store[data.phone]
    
    # Check expiry (e.g., 5 minutes)
    if time.time() - stored_data["timestamp"] > 300:
        del otp_store[data.phone]
        raise HTTPException(status_code=400, detail="OTP expired.")
        
    if stored_data["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
        
    # Clear OTP after successful verification
    del otp_store[data.phone]
    
    # Generate JWT
    access_token_expires = timedelta(minutes=60*24*7) # 7 days
    access_token = create_access_token(
        data={"sub": data.phone}, expires_delta=access_token_expires
    )
    
    return {
        "message": "OTP verified successfully",
        "access_token": access_token,
        "token_type": "bearer"
    }
