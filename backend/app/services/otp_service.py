import random
import time
import requests
import phonenumbers
from sqlalchemy.orm import Session
from app.models.schema import OTPRequest
from app.config import settings

def validate_phone(phone: str) -> str:
    try:
        parsed_phone = phonenumbers.parse(phone, "IN")
        if not phonenumbers.is_valid_number(parsed_phone):
            return None
        return phonenumbers.format_number(parsed_phone, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        return None

def send_fast2sms_otp(db: Session, phone: str) -> bool:
    formatted_phone = validate_phone(phone)
    if not formatted_phone:
        return False
        
    otp_code = str(random.randint(100000, 999999))
    
    # Store in DB
    db_otp = OTPRequest(phone=formatted_phone, otp_code=otp_code)
    db.add(db_otp)
    db.commit()
    
    print(f"\n======================================")
    print(f"DEV OTP GENERATED: {otp_code} for {formatted_phone}")
    print(f"======================================\n")

    if settings.FAST2SMS_API_KEY:
        url = "https://www.fast2sms.com/dev/bulkV2"
        querystring = {
            "authorization": settings.FAST2SMS_API_KEY,
            "variables_values": otp_code,
            "route": "otp",
            "numbers": formatted_phone.lstrip('+')[-10:] # Last 10 digits
        }
        headers = {'cache-control': "no-cache"}
        try:
            response = requests.request("GET", url, headers=headers, params=querystring)
            print("Fast2SMS Response:", response.text)
            # Return true regardless of Fast2SMS success in dev, so the printed OTP can be used
            return True
        except Exception as e:
            print("Fast2SMS Error:", e)
            return True
    else:
        return True

def verify_otp_code(db: Session, phone: str, otp: str) -> bool:
    formatted_phone = validate_phone(phone)
    if not formatted_phone:
        return False
        
    otp_record = db.query(OTPRequest).filter(
        OTPRequest.phone == formatted_phone,
        OTPRequest.otp_code == otp,
        OTPRequest.is_used == False
    ).order_by(OTPRequest.created_at.desc()).first()
    
    if not otp_record:
        return False
        
    # Mark as used
    otp_record.is_used = True
    db.commit()
    return True
