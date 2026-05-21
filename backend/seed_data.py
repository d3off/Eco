import requests
import random
import time
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api/emissions"

regions = ["Sector A-1 (Industrial)", "Sector B-7 (Residential)", "Sector C-4 (Commercial)", "Orbital Station Alpha"]

print("Starting to seed historical data (7 days). Make sure the FastAPI backend is running!")

def generate_historical_data():
    now = datetime.utcnow()
    # Generate data for the last 7 days, 1 point per hour
    total_points = 7 * 24
    
    for i in range(total_points):
        current_time = now - timedelta(hours=total_points - i)
        is_night = current_time.hour >= 22 or current_time.hour < 6
        is_weekend = current_time.weekday() in [5, 6]
        
        for region in regions:
            is_anomaly = random.random() < 0.05
            
            # Base values
            co2 = random.uniform(400, 420)
            no2 = random.uniform(10, 20)
            methane = random.uniform(1800, 1900)
            
            # Add patterns
            if region == "Sector A-1 (Industrial)":
                # Sector A-1 cheats at night
                if is_night:
                    co2 += random.uniform(100, 150)
                    methane += random.uniform(300, 500)
            
            elif region == "Sector C-4 (Commercial)":
                # Sector C-4 cheats on weekends
                if is_weekend:
                    no2 += random.uniform(30, 60)
                    co2 += random.uniform(50, 100)
            
            if is_anomaly:
                co2 += 100
                no2 += 40
                
            data = {
                "region": region,
                "co2_level": co2,
                "no2_level": no2,
                "methane_level": methane,
                "timestamp": current_time.isoformat()
            }
            
            try:
                res = requests.post(API_URL, json=data)
                res.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(f"Failed to push data: {e}")
                return
                
        if i % 24 == 0:
            print(f"Seeded day {i // 24 + 1}/7...")

    print("Historical seeding complete. Now switching to real-time mode...")
    
    # Switch to real-time mode
    while True:
        region = random.choice(regions)
        co2 = random.uniform(400, 420)
        no2 = random.uniform(10, 20)
        methane = random.uniform(1800, 1900)
        
        now = datetime.utcnow()
        if region == "Sector A-1 (Industrial)" and (now.hour >= 22 or now.hour < 6):
            co2 += 100
            
        data = {
            "region": region,
            "co2_level": co2,
            "no2_level": no2,
            "methane_level": methane,
        }
        try:
            res = requests.post(API_URL, json=data)
            res.raise_for_status()
            print(f"Pushed real-time data for {region}")
        except:
            pass
            
        time.sleep(2)

if __name__ == "__main__":
    generate_historical_data()
