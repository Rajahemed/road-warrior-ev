CREATE TABLE riders (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

full_name TEXT NOT NULL,

phone TEXT UNIQUE NOT NULL,

city TEXT,

platform TEXT,

experience_years INTEGER,

vehicle_type TEXT,

vehicle_model TEXT,

fuel_method TEXT,

weekly_expense INTEGER,

maintenance_expense INTEGER,

accidental_insurance TEXT,

health_insurance TEXT,

open_to_ev TEXT,

interests TEXT[],

preferred_language TEXT,

referral_code TEXT UNIQUE,

referred_by TEXT,

points INTEGER DEFAULT 10,

referral_count INTEGER DEFAULT 0,

segment TEXT,

qr_link TEXT,

created_at TIMESTAMP DEFAULT NOW()

);


CREATE TABLE referrals (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

referrer_code TEXT,

referred_phone TEXT,

points_awarded INTEGER,

created_at TIMESTAMP DEFAULT NOW()

);


CREATE TABLE whatsapp_logs (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

phone TEXT,

message TEXT,

status TEXT,

created_at TIMESTAMP DEFAULT NOW()

);