from app.services.referral_service import process_referral
import traceback
try:
    print(process_referral("RW-5492", "9999999999"))
except Exception as e:
    traceback.print_exc()
