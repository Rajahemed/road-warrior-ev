import requests
import json
import time

URL = "http://localhost:8000/whatsapp/webhook"

def send_message(phone, text):
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "messages": [
                                {
                                    "from": phone,
                                    "text": {
                                        "body": text
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }
    
    response = requests.post(URL, json=payload)
    print(f"Sent '{text}' - Status: {response.status_code}")
    time.sleep(1) # Give server time to process and \"reply\"

phone = "919876543210"

# Step 1: Initial message (Triggers Question 1)
send_message(phone, "Hi")

# Step 2: Answer Name -> Gets Q2 (City)
send_message(phone, "Ravi Kumar")

# Step 3: Answer City -> Gets Q3 (Platform)
send_message(phone, "Mumbai")

# Step 4: Answer Platform -> Gets Q4 (Vehicle)
send_message(phone, "Zomato")

# Step 5: Answer Vehicle -> Gets Q5 (Insurance)
send_message(phone, "Petrol")

# Step 6: Answer Insurance -> Gets Q6 (Open to EV)
send_message(phone, "No")

# Step 7: Answer Open to EV -> Gets Q7 (Referral)
send_message(phone, "Yes")

# Step 8: Answer Referral -> Completes Registration
send_message(phone, "None")

print("Finished simulating WhatsApp flow. Check backend logs and dashboard!")
