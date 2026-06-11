from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class LeadTypeEnum(str, Enum):
    PERSONAL_INSURANCE_LEAD = "PERSONAL_INSURANCE_LEAD"
    BIKE_INSURANCE_LEAD = "BIKE_INSURANCE_LEAD"
    EV_SALE_LEAD = "EV_SALE_LEAD"
    EV_RENTAL_LEAD = "EV_RENTAL_LEAD"
    RETROFIT_LEAD = "RETROFIT_LEAD"
    PRODUCT_LEAD = "PRODUCT_LEAD"

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = "Website"
    lead_type: LeadTypeEnum
    status: Optional[str] = "NEW"
    ip_address: Optional[str] = None
    consent_accepted: bool = False
    details: Optional[dict] = None  # for extra form details

class LeadResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str]
    location: Optional[str]
    source: str
    lead_type: LeadTypeEnum
    referral_count: int
    status: str
    created_at: datetime
