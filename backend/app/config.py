from dotenv import load_dotenv
import os

load_dotenv()

class Settings:

    SUPABASE_URL = os.getenv("SUPABASE_URL")

    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

    PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")

    VERIFY_TOKEN = os.getenv("VERIFY_TOKEN")

    BASE_URL = os.getenv("BASE_URL")

    JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-in-prod")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL")
    RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

settings = Settings()