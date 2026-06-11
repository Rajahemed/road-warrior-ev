from app.database.connection import supabase
from app.utils.reward_calculator import calculate_bonus
from app.services.whatsapp_service import send_whatsapp


def process_referral(referral_code, new_phone):

    # Ensure referral code is uppercase for matching
    referral_code = referral_code.upper().strip()

    rider = (
        supabase
        .table("riders")
        .select("*")
        .eq("referral_code", referral_code)
        .execute()
    )

    if not rider.data:
        return False

    referrer = rider.data[0]

    new_points = referrer["points"] + 5
    new_count = referrer["referral_count"] + 1

    bonus = calculate_bonus(new_count)
    new_points += bonus

    # Milestones are now handled via Supabase Webhook to n8n Automation Flow.

    # Update rider points
    (
        supabase
        .table("riders")
        .update({
            "points": new_points,
            "referral_count": new_count
        })
        .eq("referral_code", referral_code)
        .execute()
    )

    # Store referral record
    (
        supabase
        .table("referrals")
        .insert({
            "referrer_code": referral_code,
            "referred_phone": new_phone,
            "points_awarded": 5
        })
        .execute()
    )

    return True