from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.schema import User, ReferralCode, ReferralPoint, Referral

router = APIRouter(
    prefix="/score",
    tags=["Score"]
)

@router.get("/phone")
def get_score_by_phone(q: str, db: Session = Depends(get_db)):
    if not q:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    # Simple formatting to match DB
    formatted_phone = q.replace(" ", "")
    if not formatted_phone.startswith("+"):
        if len(formatted_phone) == 10:
            formatted_phone = "+91" + formatted_phone
        else:
            formatted_phone = "+" + formatted_phone
            
    user = db.query(User).filter(User.phone == formatted_phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Rider not found")
        
    ref_code = db.query(ReferralCode).filter(ReferralCode.user_id == user.id).first()
    code_str = ref_code.code if ref_code else "N/A"
    
    total_points = db.query(func.sum(ReferralPoint.points)).filter(ReferralPoint.user_id == user.id).scalar() or 0
    total_points += 10 # Base points
    
    ref_count = db.query(Referral).filter(Referral.referrer_id == user.id).count()
    
    return {
        "name": user.full_name,
        "total_points": total_points,
        "referral_count": ref_count,
        "code": code_str,
        "qr_link": f"https://roadwarriorev.com/score?ref={code_str}" if code_str != "N/A" else ""
    }