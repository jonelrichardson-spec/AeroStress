import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env.local from project root (parent of backend/)
_project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_project_root / ".env.local")
load_dotenv(_project_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
# For verifying Supabase Auth JWTs: legacy HS256 secret, or use JWKS (ES256) when SUPABASE_URL is set
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
