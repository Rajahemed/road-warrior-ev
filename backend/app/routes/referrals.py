from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.security import verify_token
from app.models.schema import User, ReferralCode, Referral, ReferralPoint, Milestone
from app.services.referral_engine import generate_unique_referral_code
from sqlalchemy import func

router = APIRouter(
    prefix="/referrals",
    tags=["Referrals"]
)

@router.get("/my-stats")
def get_my_stats(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    class MockCreds: credentials = token
    payload = verify_token(MockCreds())
    user_id = int(payload.get("sub"))
    
    # Get Code
    ref_code = db.query(ReferralCode).filter(ReferralCode.user_id == user_id).first()
    if not ref_code:
        code_str = generate_unique_referral_code(db, user_id)
    else:
        code_str = ref_code.code
        
    # Get Points
    total_points = db.query(func.sum(ReferralPoint.points)).filter(ReferralPoint.user_id == user_id).scalar() or 0
    # Every user starts with 10 points
    total_points += 10
    
    # Get Count
    ref_count = db.query(Referral).filter(Referral.referrer_id == user_id).count()
    
    # Get Milestones
    milestones = db.query(Milestone).filter(Milestone.user_id == user_id).all()
    
    user = db.query(User).filter(User.id == user_id).first()
    from app.models.schema import Profile
    has_completed_questionnaire = db.query(Profile).filter(Profile.user_id == user_id).first() is not None
    
    return {
        "name": user.full_name if user else "Rider",
        "code": code_str,
        "total_points": total_points,
        "referral_count": ref_count,
        "milestones": [m.milestone_name for m in milestones],
        "has_completed_questionnaire": has_completed_questionnaire
    }
