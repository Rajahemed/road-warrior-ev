import os
import sys

# Setup mock data for testing
with open("road_warrior_data.json", "w") as f:
    f.write("""
{
  "riders": [
    { "phone": "1", "referral_code": "R1", "points": 10, "referral_count": 0 },
    { "phone": "2", "referral_code": "R2", "points": 10, "referral_count": 0 }
  ],
  "referrals": []
}
""")

from app.database.connection import MockSupabase
supabase = MockSupabase()

# Test update
(
    supabase.table("riders")
    .update({"points": 15, "referral_count": 1})
    .eq("referral_code", "R1")
    .execute()
)

print(supabase.db["riders"])
