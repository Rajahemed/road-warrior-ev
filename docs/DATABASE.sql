-- Road Warrior EV Database Schema

-- Leads Table
CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    location TEXT,
    source TEXT DEFAULT 'Website',
    lead_type TEXT NOT NULL,
    referral_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'NEW',
    ip_address TEXT,
    consent_accepted BOOLEAN DEFAULT false,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    images JSONB,
    availability BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for products
CREATE POLICY "Allow read access to products" ON public.products FOR SELECT USING (true);

-- Allow service role to manage all tables
CREATE POLICY "Service Role Full Access Leads" ON public.leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Products" ON public.products FOR ALL USING (auth.role() = 'service_role');
