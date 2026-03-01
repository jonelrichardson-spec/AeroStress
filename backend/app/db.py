from supabase import create_client

from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL


def get_supabase():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
