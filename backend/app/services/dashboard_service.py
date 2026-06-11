from app.database.connection import supabase

def dashboard_stats():
    # Query the new leads table and legacy riders table
    leads = supabase.table("leads").select("*").execute()
    riders = supabase.table("riders").select("*").execute()
    
    total = len(leads.data) + len(riders.data)

    petrol = 0
    ev = 0
    diesel = 0
    
    total_referrals = sum([r.get("referral_count", 0) for r in leads.data]) + sum([r.get("referral_count", 0) for r in riders.data])

    segments = {
        "PERSONAL_INSURANCE_LEAD": 0,
        "BIKE_INSURANCE_LEAD": 0,
        "EV_SALE_LEAD": 0,
        "EV_RENTAL_LEAD": 0,
        "RETROFIT_LEAD": 0,
        "PRODUCT_LEAD": 0,
        "GENERAL_LEAD": 0
    }

    cities = {}

    def process_row(r, is_legacy=False):
        nonlocal petrol, ev, diesel
        # Segment counts
        if is_legacy:
            seg = r.get("segment")
            if not seg:
                seg = "GENERAL_LEAD"
        else:
            seg = r.get("lead_type")
            
        if seg in segments:
            segments[seg] += 1
        else:
            segments["GENERAL_LEAD"] += 1
            
        # City parsing from location (format: Landmark, City, State - PIN) or legacy city
        if is_legacy:
            city = r.get("city", "")
        else:
            location = r.get("location", "")
            city = ""
            if location:
                parts = [p.strip() for p in location.split(',')]
                if len(parts) >= 2:
                    city = parts[-2]
                    if '-' in city and len(parts) == 2:
                        city = parts[0]
                else:
                    city = parts[0].split('-')[0].strip()
                    
        if city:
            cities[city] = cities.get(city, 0) + 1

        # Vehicle parsing from details or legacy vehicle_type
        if is_legacy:
            v_type = (r.get("vehicle_type") or "").lower()
        else:
            details = r.get("details", {})
            v_type = ""
            if isinstance(details, dict):
                vehicle_details = details.get("vehicle_details")
                if vehicle_details and isinstance(vehicle_details, dict):
                    v_type = vehicle_details.get("type", "").lower()
                    
        if "petrol" in v_type:
            petrol += 1
        elif "diesel" in v_type:
            diesel += 1
        elif "ev" in v_type or "electric" in v_type or "scooter" in v_type or "bike" in v_type:
            ev += 1

    for r in leads.data:
        process_row(r, is_legacy=False)
        
    for r in riders.data:
        process_row(r, is_legacy=True)

    return {
        "total_riders": total,
        "petrol_riders": petrol,
        "ev_riders": ev,
        "diesel_riders": diesel,
        "total_referrals": total_referrals,
        "segments": segments,
        "cities": cities
    }