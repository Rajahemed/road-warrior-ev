from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def verify_recaptcha(token: str):
    if settings.RECAPTCHA_SECRET_KEY == "mock_recaptcha_secret_key_for_testing" or not settings.RECAPTCHA_SECRET_KEY:
        return True
    
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = {
        "secret": settings.RECAPTCHA_SECRET_KEY,
        "response": token
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, data=data)
            result = response.json()
            if result.get("success") and result.get("score", 0) >= 0.5:
                return True
            else:
                logger.warning(f"reCAPTCHA verification failed: {result}")
                return False
        except Exception as e:
            logger.error(f"Error communicating with reCAPTCHA server: {e}")
            return False

