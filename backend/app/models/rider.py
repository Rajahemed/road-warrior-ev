from pydantic import BaseModel

class Rider(BaseModel):

    full_name:str

    phone:str

    city:str

    vehicle_type:str

    referral_code:str

    points:int
    
    