from fastapi import APIRouter, Depends, Query, Response
from typing import Optional, List
from app.database.connection import supabase
from app.schemas.product_schema import ProductCreate

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/")
def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = supabase.table("products").select("*")
    if category:
        query = query.eq("category", category)
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.execute()
    return result.data

@router.post("/")
def create_product(product: ProductCreate):
    result = supabase.table("products").insert(product.dict()).execute()
    return result.data[0] if result.data else {}

@router.get("/{product_id}")
def get_product(product_id: str):
    result = supabase.table("products").select("*").eq("id", product_id).execute()
    return result.data[0] if result.data else {}
