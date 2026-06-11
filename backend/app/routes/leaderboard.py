from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.schema import User, ReferralPoint, Referral

router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"]
)

@router.get("/")
def leaderboard(db: Session = Depends(get_db)):
    try:
        # Get users and sum of their referral points
        results = db.query(
            User.id,
            User.full_name,
            func.coalesce(func.sum(ReferralPoint.points), 0).label("points")
        ).outerjoin(ReferralPoint, User.id == ReferralPoint.user_id).group_by(User.id, User.full_name).order_by(func.coalesce(func.sum(ReferralPoint.points), 0).desc()).limit(20).all()

        data = [{"id": r.id, "full_name": r.full_name, "points": r.points + 10} for r in results] # add 10 base points
        # sort again after adding base points
        data = sorted(data, key=lambda x: x["points"], reverse=True)

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/top-referrers")
def top_referrers(db: Session = Depends(get_db)):
    try:
        results = db.query(
            User.id,
            User.full_name,
            func.count(Referral.id).label("referral_count")
        ).outerjoin(Referral, User.id == Referral.referrer_id).group_by(User.id, User.full_name).order_by(func.count(Referral.id).desc()).limit(20).all()

        data = [{"id": r.id, "full_name": r.full_name, "referral_count": r.referral_count} for r in results]

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )