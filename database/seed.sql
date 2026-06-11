-- Seed mock data for dashboard visualization

INSERT INTO riders (full_name, phone, city, platform, vehicle_type, segment, points, referral_count, referral_code)
VALUES 
('Ramesh Kumar', '919876543210', 'Bangalore', 'Swiggy', 'Petrol', 'Hot EV Lead', 60, 10, 'RW-1001'),
('Suresh Singh', '918765432109', 'Bangalore', 'Zomato', 'Electric', 'EV Rider', 10, 0, 'RW-1002'),
('Arjun Reddy', '917654321098', 'Bangalore', 'Dunzo', 'Diesel', 'Insurance Lead', 25, 3, 'RW-1003'),
('Vinay Gowda', '916543210987', 'Mysore', 'Blinkit', 'Petrol', 'Swing Rider', 15, 1, 'RW-1004');

INSERT INTO referrals (referrer_code, referred_phone, points_awarded)
VALUES 
('RW-1001', '918765432109', 5),
('RW-1001', '917654321098', 5),
('RW-1003', '916543210987', 5);
