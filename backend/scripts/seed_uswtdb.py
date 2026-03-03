#!/usr/bin/env python3
"""
Seed turbines from USWTDB API.
Fetches 500 turbines and inserts with terrain classification and stress calculation.
Run: python -m scripts.seed_uswtdb (from backend/)
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from dotenv import load_dotenv

# Load env from project root and cwd
_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_root / ".env.local")
load_dotenv(_root / ".env")
load_dotenv()

from supabase import create_client

USWTDB_API = "https://energy.usgs.gov/api/uswtdb/v1/turbines"
TARGET_COUNT = 500


def main():
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY")
    )
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (project root)")
        print(f"  Checked: {_root / '.env.local'}, {_root / '.env'}, cwd")
        sys.exit(1)

    supabase = create_client(url, key)

    # Early exit if already seeded
    check = supabase.table("turbines").select("id").limit(TARGET_COUNT).execute()
    existing = len(check.data or [])
    if existing >= TARGET_COUNT:
        print(f"Already seeded: {existing}+ turbines in database. Nothing to do.")
        return

    # Fetch from USWTDB API (turbines 10+ years old: p_year <= 2015)
    print(f"Fetching turbines from USWTDB...")
    resp = httpx.get(
        USWTDB_API,
        params={"limit": 2000, "p_year": "lte.2015", "order": "case_id.asc"},
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()

    if not isinstance(data, list):
        data = [data] if isinstance(data, dict) else []
    print(f"Fetched {len(data)} turbines from API.")

    # Get terrain classifications for FK
    tc_rows = supabase.table("terrain_classifications").select("id, class_name").execute()
    tc_map = {r["class_name"]: r["id"] for r in (tc_rows.data or [])}

    from app.services.terrain import TERRAIN_MULTIPLIERS, classify_terrain

    # Filter: need coords, year, and 10+ years old (PRD: existing turbines 10+ years)
    candidates = []
    for t in data:
        if t.get("xlong") is None or t.get("ylat") is None or t.get("p_year") is None:
            continue
        age = 2025 - t["p_year"]
        if age >= 10:
            candidates.append(t)
            if len(candidates) >= TARGET_COUNT:
                break

    turbines = candidates[:TARGET_COUNT]
    print(f"Processing {len(turbines)} turbines (10+ years old)...")

    inserted = 0
    skipped = 0
    for t in turbines:
        xlong = t["xlong"]
        ylat = t["ylat"]
        p_year = t["p_year"]
        calendar_age = 2025 - p_year
        terrain_class = classify_terrain(ylat, xlong)
        mult = TERRAIN_MULTIPLIERS[terrain_class]
        true_age = round(calendar_age * mult, 2)

        turbine_row = {
            "case_id": t.get("case_id"),
            "latitude": ylat,
            "longitude": xlong,
            "model": t.get("t_model"),
            "manufacturer": t.get("t_manu"),
            "capacity_kw": t.get("t_cap"),
            "year_operational": p_year,
            "calendar_age_years": calendar_age,
            "project_name": t.get("p_name"),
            "state": t.get("t_state"),
            "county": t.get("t_county"),
        }
        try:
            turb_res = supabase.table("turbines").insert(turbine_row).execute()
            if not turb_res.data:
                continue
            tid = turb_res.data[0]["id"]
            tc_id = tc_map.get(terrain_class)
            stress_row = {
                "turbine_id": tid,
                "terrain_classification_id": tc_id,
                "terrain_class": terrain_class,
                "stress_multiplier": mult,
                "calendar_age_years": calendar_age,
                "true_age_years": true_age,
            }
            supabase.table("stress_calculations").insert(stress_row).execute()
            inserted += 1
        except Exception as e:
            err = str(e)
            if "23505" in err or "duplicate" in err.lower():
                skipped += 1
            else:
                print(f"Error case_id {t.get('case_id')}: {e}")

    if skipped:
        print(f"Skipped {skipped} duplicates (already in DB).")
    print(f"Seeded {inserted} turbines.")


if __name__ == "__main__":
    main()
