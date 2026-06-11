-- Performance indexes for dashboard aggregation and fast lookups

CREATE INDEX idx_riders_phone ON riders(phone);
CREATE INDEX idx_riders_referral_code ON riders(referral_code);
CREATE INDEX idx_riders_segment ON riders(segment);
CREATE INDEX idx_riders_city ON riders(city);
CREATE INDEX idx_riders_points ON riders(points DESC);

CREATE INDEX idx_referrals_referrer_code ON referrals(referrer_code);
