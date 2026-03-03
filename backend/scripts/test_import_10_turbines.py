#!/usr/bin/env python3
"""
Test import: create a fleet and add 10 turbines at different locations
to verify different True Ages in the DB.
Run: python -m scripts.test_import_10_turbines (from backend/)
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv

_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_root / ".env.local")
load_dotenv(_root / ".env")

# 10 diverse US locations (lat, lon, rough description)
LOCATIONS = [
    (35.0, -101.0, "Texas panhandle"),
    (41.9, -87.6, "Chicago"),
    (39.7, -105.0, "Colorado front range"),
    (34.0, -118.2, "LA"),
    (47.6, -122.3, "Seattle"),
    (25.8, -80.2, "Miami"),
    (44.9, -93.0, "Minneapolis"),
    (36.2, -115.2, "Las Vegas"),
    (40.7, -74.0, "New York"),
    (33.4, -112.0, "Phoenix"),
]


def main():
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)

    import httpx

    base = os.getenv("API_BASE_URL", "http://localhost:8000")

    # Create fleet
    r = httpx.post(f"{base}/fleets", json={"name": "Test Import Fleet"})
    if r.status_code != 200:
        print(f"Create fleet failed: {r.status_code} {r.text}")
        sys.exit(1)
    fleet_id = r.json()["id"]
    print(f"Created fleet {fleet_id}")

    # Add 10 turbines (year_operational so calendar_age varies slightly)
    for i, (lat, lon, desc) in enumerate(LOCATIONS):
        payload = {
            "latitude": lat,
            "longitude": lon,
            "year_operational": 2010 + (i % 5),  # 2010-2014
        }
        r = httpx.post(f"{base}/fleets/{fleet_id}/turbines", json=payload)
        if r.status_code != 200:
            print(f"  Skip {desc}: {r.status_code} {r.text[:200]}")
            continue
        t = r.json()
        print(f"  {desc}: terrain={t.get('terrain_class')}, true_age={t.get('true_age_years')}")

    print("\nDone. Check DB: stress_calculations and turbines for fleet_id =", fleet_id)


if __name__ == "__main__":
    main()
