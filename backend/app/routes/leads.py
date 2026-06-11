from fastapi import APIRouter, Depends, Query, Response, Request
from fastapi.responses import PlainTextResponse
from typing import Optional, List
from app.database.connection import supabase
from app.schemas.lead_schema import LeadCreate, LeadTypeEnum
# If you have auth, use get_current_user. For now, mocking or using existing
# from app.middleware.jwt_auth import get_current_user

router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)

@router.post("/")
def create_lead(request: Request, lead: LeadCreate):
    client_ip = request.client.host
    lead_data = lead.dict()
    lead_data["ip_address"] = client_ip
    # Consent is tracked via the consent_accepted boolean
    # Ensure it's logged
    if not lead.consent_accepted:
        return {"error": "Consent required"}
        
    result = supabase.table("leads").insert(lead_data).execute()
    return result.data[0] if result.data else {}

@router.get("/")
def get_leads(
    lead_type: Optional[LeadTypeEnum] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_referral: Optional[int] = None
):
    query = supabase.table("leads").select("*")
    if lead_type:
        query = query.eq("lead_type", lead_type.value)
    if status:
        query = query.eq("status", status)
    if city:
        query = query.ilike("location", f"%{city}%")
    if state:
        query = query.ilike("location", f"%{state}%")
    if min_referral is not None:
        query = query.gte("referral_count", min_referral)
        
    result = query.execute()
    return result.data

@router.get("/export", response_class=PlainTextResponse)
def export_leads_csv(
    lead_type: Optional[LeadTypeEnum] = None,
    status: Optional[str] = None
):
    query = supabase.table("leads").select("*")
    if lead_type:
        query = query.eq("lead_type", lead_type.value)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    
    if not result.data:
        return "id,name,phone,email,lead_type,status,created_at\n"
        
    csv_str = "id,name,phone,email,lead_type,status,created_at\n"
    for r in result.data:
        csv_str += f"{r.get('id', '')},{r.get('name', '')},{r.get('phone', '')},{r.get('email', '')},{r.get('lead_type', '')},{r.get('status', '')},{r.get('created_at', '')}\n"
        
    return Response(content=csv_str, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=leads.csv"})