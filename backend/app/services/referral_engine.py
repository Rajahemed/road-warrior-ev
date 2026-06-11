import random
import string
from sqlalchemy.orm import Session
from app.models.schema import User, ReferralCode, ReferralPoint, Milestone, Referral

def generate_unique_referral_code(db: Session, user_id: int) -> str:
    # Example format: RW-4821
    while True:
        code = "RW-" + "".join(random.choices(string.digits, k=4))
        existing = db.query(ReferralCode).filter(ReferralCode.code == code).first()
        if not existing:
            ref_code = ReferralCode(user_id=user_id, code=code)
            db.add(ref_code)
            db.commit()
            return code

def process_referral(db: Session, new_user_id: int, referral_code: str):
    ref_code_obj = db.query(ReferralCode).filter(ReferralCode.code == referral_code).first()
    if not ref_code_obj:
        return False
        
    referrer_id = ref_code_obj.user_id
    
    # Create Referral
    ref = Referral(referrer_id=referrer_id, referred_id=new_user_id, status="successful")
    db.add(ref)
    
    # Award Points to Referrer
    pt = ReferralPoint(user_id=referrer_id, points=5, reason="Successful Referral")
    db.add(pt)
    
    # Check Milestones
    referral_count = db.query(Referral).filter(Referral.referrer_id == referrer_id).count() + 1
    
    milestones = {
        10: {"points": 100, "name": "10 Referrals Milestone"},
        25: {"points": 300, "name": "25 Referrals Milestone"},
        50: {"points": 500, "name": "50 Referrals Milestone"}
    }
    
    if referral_count in milestones:
        m = milestones[referral_count]
        db.add(Milestone(user_id=referrer_id, milestone_name=m["name"]))
        db.add(ReferralPoint(user_id=referrer_id, points=m["points"], reason=m["name"]))
        
        # Send milestone whatsapp message
        referrer_user = db.query(User).filter(User.id == referrer_id).first()
        if referrer_user:
            from app.services.whatsapp_service import send_whatsapp
            try:
                msg = f"Badhai ho {referrer_user.full_name}! You have reached the {m['name']}! You earned {m['points']} bonus points."
                send_whatsapp(referrer_user.phone, msg)
            except Exception as e:
                pass
        
    db.commit()
    return True
