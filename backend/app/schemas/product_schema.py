from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductCreate(BaseModel):
    name: str
    category: str
    description: str
    price: float
    images: List[str] = []
    availability: bool = True

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    price: float
    images: List[str]
    availability: bool
    created_at: datetime
