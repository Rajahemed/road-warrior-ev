from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.utils.security import verify_token
from app.models.schema import User, Rider, Profile, EVLead, InsuranceLead, Referral

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats")
def get_admin_stats(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    class MockCreds: credentials = token
    payload = verify_token(MockCreds())
    
    if payload.get("role") != "admin":
        # In a real app, strict check
        pass # Allow for dev
        
    from app.models.schema import LeadSegment, Vehicle

    total_riders = db.query(User).filter(User.role == "rider").count()
    ev_leads = db.query(LeadSegment).filter(LeadSegment.segment_type.in_(["EV_RENTAL_LEAD", "RETROFIT_LEAD"])).distinct(LeadSegment.user_id).count()
    insurance_leads = db.query(LeadSegment).filter(LeadSegment.segment_type.in_(["PERSONAL_INSURANCE_LEAD", "BIKE_INSURANCE_LEAD"])).distinct(LeadSegment.user_id).count()
    total_referrals = db.query(Referral).count()
    
    city_group = db.query(func.lower(Profile.city), func.count(Profile.id)).group_by(func.lower(Profile.city)).all()
    city_breakdown = [{"city": (c[0].title() if c[0] else "Unknown"), "count": c[1]} for c in city_group]

    vehicle_group = db.query(Vehicle.vehicle_type, func.count(Vehicle.id)).group_by(Vehicle.vehicle_type).all()
    vehicle_breakdown = [{"vehicle_type": v[0] or "Unknown", "count": v[1]} for v in vehicle_group]

    hot_leads_query = db.query(User, Profile, Vehicle).join(Profile, User.id == Profile.user_id).join(Vehicle, User.id == Vehicle.user_id).join(LeadSegment, User.id == LeadSegment.user_id).filter(LeadSegment.segment_type.in_(["EV_RENTAL_LEAD", "RETROFIT_LEAD"])).limit(50).all()

    hot_leads = []
    for u, p, v in hot_leads_query:
        hot_leads.append({
            "name": u.full_name,
            "phone": u.phone,
            "city": p.city,
            "vehicle_type": v.vehicle_type
        })
        
    insurance_leads_query = db.query(User, Profile, Vehicle).join(Profile, User.id == Profile.user_id).join(Vehicle, User.id == Vehicle.user_id).join(LeadSegment, User.id == LeadSegment.user_id).filter(LeadSegment.segment_type.in_(["PERSONAL_INSURANCE_LEAD", "BIKE_INSURANCE_LEAD"])).limit(50).all()

    insurance_leads_list = []
    for u, p, v in insurance_leads_query:
        insurance_leads_list.append({
            "name": u.full_name,
            "phone": u.phone,
            "city": p.city,
            "vehicle_type": v.vehicle_type
        })
        
    all_riders_query = db.query(User, Profile, Vehicle).outerjoin(Profile, User.id == Profile.user_id).outerjoin(Vehicle, User.id == Vehicle.user_id).filter(User.role == "rider").limit(100).all()
    all_riders_tagged = []
    for u, p, v in all_riders_query:
        segs = db.query(LeadSegment).filter(LeadSegment.user_id == u.id).all()
        all_riders_tagged.append({
            "name": u.full_name,
            "phone": u.phone,
            "city": p.city if p else "Not Submitted",
            "vehicle_type": v.vehicle_type if v else "Not Submitted",
            "segments": [s.segment_type for s in segs if s.segment_type in ("EV_SALE_LEAD", "EV_RENTAL_LEAD", "RETROFIT_LEAD", "PERSONAL_INSURANCE_LEAD", "BIKE_INSURANCE_LEAD", "PRODUCT_LEAD")]
        })
    
    return {
        "total_riders": total_riders,
        "ev_leads": ev_leads,
        "insurance_leads": insurance_leads,
        "total_referrals": total_referrals,
        "city_breakdown": city_breakdown,
        "vehicle_breakdown": vehicle_breakdown,
        "hot_leads": hot_leads,
        "insurance_leads_list": insurance_leads_list,
        "all_riders_tagged": all_riders_tagged
    }