from fastapi import APIRouter, Request, Query, HTTPException
from app.services.whatsapp_service import send_whatsapp
from app.schemas.rider_schema import RiderCreate
from app.routes.riders import register
from app.database.connection import supabase
from app.database.session import SessionLocal
from app.models.schema import User, ReferralCode, ReferralPoint, Referral
from sqlalchemy import func

router = APIRouter(
    prefix="/whatsapp",
    tags=["WhatsApp"]
)

# In-memory dictionary to track conversation state per phone number
conversation_state = {}

QUESTIONS = {
    1: "Welcome to Road Warrior EV! What is your full name?",
    2: "Which city do you drive in?",
    3: "Which platform do you use most? (e.g., Zomato, Swiggy, Uber, Rapido)",
    4: "Do you currently drive a Petrol or Electric vehicle?",
    5: "Do you have Accidental/Health Insurance? (Yes/No)",
    6: "Are you open to switching to an Electric Vehicle? (Yes/No)",
    7: "Do you have a Referral Code from a friend? (Type the code, or type 'None')"
}

@router.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == "roadwarrior2026":
        return int(hub_challenge)
    return "Verification failed"

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    
    try:
        entry = data["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        
        if "messages" in value:
            message_obj = value["messages"][0]
            phone = message_obj["from"]
            text_body = message_obj["text"]["body"]
            
            handle_incoming_message(phone, text_body)
    except KeyError:
        pass # Ignore status updates or unsupported message types
        
    return {"status": "success"}

def handle_incoming_message(phone: str, text: str):
    clean_text = text.strip().upper()
    
    if clean_text == "MY SCORE":
        try:
            formatted_phone = phone if phone.startswith("+") else "+" + phone
            db = SessionLocal()
            user = db.query(User).filter(User.phone == formatted_phone).first()
            if not user:
                rider = supabase.table("riders").select("*").eq("phone", formatted_phone).execute()
                if rider.data:
                    db_rider = rider.data[0]
                    total_points = db_rider.get("points", 10)
                    ref_code = db_rider.get("referral_code", "N/A")
                    ref_count = db_rider.get("referral_count", 0)
                    msg = f"Your Score Details:\n\nTotal Points: {total_points}\nSuccessful Referrals: {ref_count}\nYour Referral Code: {ref_code}\n\nShare this link: https://roadwarriorev.com/score?ref={ref_code}"
                    send_whatsapp(phone, msg)
                else:
                    send_whatsapp(phone, "You are not registered yet. Let's register you now!")
                    if phone not in conversation_state:
                        conversation_state[phone] = {"step": 1, "data": {}}
                        send_whatsapp(phone, QUESTIONS[1])
            else:
                total_points = db.query(func.sum(ReferralPoint.points)).filter(ReferralPoint.user_id == user.id).scalar() or 0
                total_points += 10
                ref_count = db.query(Referral).filter(Referral.referrer_id == user.id).count()
                ref_code_obj = db.query(ReferralCode).filter(ReferralCode.user_id == user.id).first()
                ref_code = ref_code_obj.code if ref_code_obj else "N/A"
                msg = f"Your Score Details:\n\nTotal Points: {total_points}\nSuccessful Referrals: {ref_count}\nYour Referral Code: {ref_code}\n\nShare this link: https://roadwarriorev.com/score?ref={ref_code}"
                send_whatsapp(phone, msg)
            db.close()
        except Exception as e:
            send_whatsapp(phone, "Sorry, we could not fetch your score at this time.")
            print(f"Score Error: {e}")
        return

    # Initialize state if new user
    if phone not in conversation_state:
        conversation_state[phone] = {"step": 1, "data": {}}
        send_whatsapp(phone, QUESTIONS[1])
        return
        
    state = conversation_state[phone]
    step = state["step"]
    user_data = state["data"]
    
    # Save the answer
    if step == 1:
        user_data["full_name"] = text
    elif step == 2:
        user_data["city"] = text
    elif step == 3:
        user_data["platform"] = text
    elif step == 4:
        user_data["vehicle_type"] = text
    elif step == 5:
        user_data["accidental_insurance"] = text
        user_data["health_insurance"] = text
    elif step == 6:
        user_data["open_to_ev"] = text
    elif step == 7:
        code = text.strip()
        if code.lower() != "none":
            user_data["referred_by"] = code
            
    # Move to next step
    next_step = step + 1
    state["step"] = next_step
    
    if next_step <= len(QUESTIONS):
        send_whatsapp(phone, QUESTIONS[next_step])
    else:
        complete_registration(phone, user_data)
        
def complete_registration(phone: str, user_data: dict):
    payload = {
        "full_name": user_data.get("full_name", ""),
        "phone": phone,
        "city": user_data.get("city", ""),
        "platform": user_data.get("platform", ""),
        "vehicle_type": user_data.get("vehicle_type", ""),
        "accidental_insurance": user_data.get("accidental_insurance", ""),
        "health_insurance": user_data.get("health_insurance", ""),
        "open_to_ev": user_data.get("open_to_ev", ""),
        "referred_by": user_data.get("referred_by", "")
    }
    
    try:
        rider_data = RiderCreate(**payload)
        mock_scope = {"type": "http", "client": ("127.0.0.1", 8000), "headers": []}
        req = Request(mock_scope)
        register(request=req, data=rider_data)
        
        if phone in conversation_state:
            del conversation_state[phone]
            
    except HTTPException as e:
        if e.status_code == 400:
            send_whatsapp(phone, "You are already registered! Check your score on our website.")
            if phone in conversation_state:
                del conversation_state[phone]
    except Exception as e:
        send_whatsapp(phone, "Sorry, there was an error processing your registration. Please try again.")
        print(f"Chatbot Registration Error: {e}")