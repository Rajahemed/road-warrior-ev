from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.security import verify_token
from app.models.schema import User, Profile, Vehicle, InsuranceLead, EVLead, Rider, LeadSegment
from typing import List, Optional

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])

class QuestionnaireData(BaseModel):
    city: str
    state: str
    pin_code: str
    delivery_platforms: List[str]
    years_experience: str
    vehicle_type: str
    brand: str
    model: str
    charging_method: str
    weekly_expense: str
    monthly_maintenance: str
    challenges: List[str]
    ev_challenges: List[str] = []
    petrol_challenges: List[str] = []
    accidental_insurance: str
    health_insurance: str
    bike_insurance: str
    expenses_paid_personally: str
    open_to_ev: str
    switch_motivators: List[str]
    interested_in: str
    interested_in_products: str
    referral_code: Optional[str] = None

@router.post("/submit")
def submit_questionnaire(request: Request, data: QuestionnaireData, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    class MockCredentials:
        credentials = token
    try:
        payload = verify_token(MockCredentials())
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if existing_profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="You have already submitted the questionnaire.")
        
    # Create Profile
    profile = Profile(user_id=user.id, city=data.city, state=data.state, pin_code=data.pin_code)
    db.add(profile)
    
    # Create Rider
    rider = Rider(user_id=user.id, delivery_platforms=",".join(data.delivery_platforms), years_of_experience=data.years_experience)
    db.add(rider)
    
    # Create Vehicle
    all_challenges = data.challenges + data.ev_challenges + data.petrol_challenges
    vehicle = Vehicle(user_id=user.id, vehicle_type=data.vehicle_type, brand=data.brand, model=data.model,
                      charging_method=data.charging_method, weekly_expense=float(data.weekly_expense or 0), 
                      monthly_maintenance=float(data.monthly_maintenance or 0), challenges=",".join(all_challenges))
    db.add(vehicle)
    
    # Create Insurance Lead
    ins_lead = InsuranceLead(user_id=user.id, accidental_insurance=data.accidental_insurance, 
                             health_insurance=data.health_insurance, bike_insurance=data.bike_insurance, accident_expenses_paid_personally=data.expenses_paid_personally)
    db.add(ins_lead)
    
    # Create EV Lead
    ev_lead = EVLead(user_id=user.id, open_to_ev=data.open_to_ev, switch_motivators=",".join(data.switch_motivators), interested_in=data.interested_in, interested_in_products=data.interested_in_products)
    db.add(ev_lead)
    
    # Basic lead segmentation logic
    segments = []
    
    if data.accidental_insurance == "No" or data.health_insurance == "No":
        segments.append("PERSONAL_INSURANCE_LEAD")
    if data.bike_insurance == "No":
        segments.append("BIKE_INSURANCE_LEAD")
        
    if data.open_to_ev in ["Yes", "Need more information"]:
        interested = data.interested_in or ""
        if "rental" in interested.lower() or "all of the above" in interested.lower():
            segments.append("EV_RENTAL_LEAD")
        if "retrofit" in interested.lower() or "all of the above" in interested.lower():
            segments.append("RETROFIT_LEAD")
        if "insurance" in interested.lower() or "all of the above" in interested.lower():
            if "BIKE_INSURANCE_LEAD" not in segments:
                segments.append("BIKE_INSURANCE_LEAD")
            
    if data.interested_in_products == "Yes":
        segments.append("PRODUCT_LEAD")
        
    for seg in segments:
        db.add(LeadSegment(user_id=user.id, segment_type=seg))
        
    from app.services.referral_engine import process_referral, generate_unique_referral_code
    from app.models.schema import ReferralPoint
    from app.services.whatsapp_service import send_whatsapp

    # Generate referral code and give 10 starting points
    code = generate_unique_referral_code(db, user.id)
    db.add(ReferralPoint(user_id=user.id, points=10, reason="Questionnaire Completion"))

    if data.referral_code:
        process_referral(db, user.id, data.referral_code)
        
    db.commit()
    
    # Send WhatsApp Welcome Message
    try:
        msg = f"Namaste {user.full_name} bhai! Aapka registration ho gaya. Aapka referral code hai: {code}. Is code ko apne doston ke saath share karo aur points kamao. Road Warrior bano!"
        send_whatsapp(user.phone, msg)
    except Exception as e:
        print(f"Failed to send whatsapp message: {e}")
    
    return {"message": "Questionnaire submitted successfully"}
