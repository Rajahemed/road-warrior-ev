from pydantic import BaseModel
from typing import List

class RiderCreate(BaseModel):

    full_name: str = ""
    phone: str = ""
    password: str = ""
    city: str = ""
    pin_code: str = ""
    platform: List[str] = []
    platform_others: str = ""
    experience_years: int = 0
    vehicle_type: str = ""
    vehicle_model: str = ""
    fuel_method: str = ""
    weekly_expense: int = 0
    maintenance_expense: int = 0
    accidental_insurance: str = ""
    health_insurance: str = ""
    bike_insurance: str = ""
    open_to_ev: str = ""
    open_to_rental: str = ""
    wants_product: str = ""
    interests: List[str] = []
    preferred_language: str = ""
    referred_by: str = ""
    challenges: List[str] = []
    challenges_others: str = ""
    ev_challenges: List[str] = []
    ev_challenges_others: str = ""
    petrol_challenges: List[str] = []
    out_of_pocket_accident: str = ""
    privacy_consent: bool = False
    recaptcha_token: str = ""
    bot_check: str = ""

class ForgotPasswordRequest(BaseModel):
    phone: str