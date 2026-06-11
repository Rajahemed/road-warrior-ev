from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, ARRAY
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="rider") # rider, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    rider_info = relationship("Rider", back_populates="user", uselist=False)
    vehicle = relationship("Vehicle", back_populates="user", uselist=False)
    insurance_lead = relationship("InsuranceLead", back_populates="user", uselist=False)
    ev_lead = relationship("EVLead", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    city = Column(String)
    state = Column(String)
    pin_code = Column(String)
    language_pref = Column(String, default="en")
    
    user = relationship("User", back_populates="profile")

class Rider(Base):
    __tablename__ = "riders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    delivery_platforms = Column(String) # Comma separated list of platforms (Swiggy, Zomato, etc)
    years_of_experience = Column(String)
    
    user = relationship("User", back_populates="rider_info")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vehicle_type = Column(String) # Petrol Two Wheeler, EV Two Wheeler, etc
    brand = Column(String)
    model = Column(String)
    charging_method = Column(String)
    weekly_expense = Column(Float)
    monthly_maintenance = Column(Float)
    challenges = Column(String) # Comma separated list of challenges
    
    user = relationship("User", back_populates="vehicle")

class InsuranceLead(Base):
    __tablename__ = "insurance_leads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    accidental_insurance = Column(String) # Yes, No, Not Sure
    health_insurance = Column(String) # Yes, No, Not Sure
    bike_insurance = Column(String) # Yes, No, Not Sure
    accident_expenses_paid_personally = Column(String) # Yes, No
    
    user = relationship("User", back_populates="insurance_lead")

class EVLead(Base):
    __tablename__ = "ev_leads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    open_to_ev = Column(String)
    switch_motivators = Column(String) # Comma separated
    interested_in = Column(String) # EV Rental, Purchase, Retrofit, etc
    interested_in_products = Column(String) # Yes, No
    
    user = relationship("User", back_populates="ev_lead")

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"))
    referred_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending") # pending, successful
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class ReferralPoint(Base):
    __tablename__ = "referral_points"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    points = Column(Integer)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    milestone_name = Column(String)
    achieved_at = Column(DateTime(timezone=True), server_default=func.now())

class LeadSegment(Base):
    __tablename__ = "lead_segments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    segment_type = Column(String) # PERSONAL_INSURANCE_LEAD, EV_SALE_LEAD, etc
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTPRequest(Base):
    __tablename__ = "otp_requests"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True)
    otp_code = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_used = Column(Boolean, default=False)

class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String)
    message_type = Column(String)
    content = Column(Text)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    event_data = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class ReferralCode(Base):
    __tablename__ = "referral_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    code = Column(String, unique=True, index=True)
