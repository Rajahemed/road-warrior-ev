-- Row Level Security Policies for Supabase

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for public registration forms
CREATE POLICY "Allow public insert to riders"
  ON riders FOR INSERT
  WITH CHECK (true);

-- Allow public read access to riders for dashboard and leaderboard stats
CREATE POLICY "Allow public select from riders"
  ON riders FOR SELECT
  USING (true);

-- Allow public insert to referrals (called by backend on registration)
CREATE POLICY "Allow public insert to referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- Allow public select from referrals
CREATE POLICY "Allow public select from referrals"
  ON referrals FOR SELECT
  USING (true);

-- Allow public insert for whatsapp logs
CREATE POLICY "Allow public insert to whatsapp_logs"
  ON whatsapp_logs FOR INSERT
  WITH CHECK (true);
