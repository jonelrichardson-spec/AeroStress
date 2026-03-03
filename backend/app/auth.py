"""
Supabase Auth JWT verification (P0).
Supports legacy HS256 (SUPABASE_JWT_SECRET) and new ES256 (JWKS from SUPABASE_URL).
"""

from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.config import SUPABASE_JWT_SECRET, SUPABASE_URL

security = HTTPBearer(auto_error=False)


def _decode_supabase_jwt(token: str):
    """Decode Supabase JWT: try HS256 (legacy) then JWKS ES256 (new keys)."""
    # 1. Legacy: HS256 with JWT secret
    if SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.InvalidTokenError:
            pass
    # 2. New: ES256 via JWKS
    if SUPABASE_URL:
        try:
            jwks_url = SUPABASE_URL.rstrip("/") + "/auth/v1/.well-known/jwks.json"
            client = PyJWKClient(jwks_url)
            signing_key = client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        except jwt.InvalidTokenError:
            pass
    raise jwt.InvalidTokenError("Could not verify token")


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """
    Verify Supabase JWT and return user id (sub). Returns None if no token or unverifiable.
    """
    if not credentials or not credentials.credentials:
        return None
    if not SUPABASE_JWT_SECRET and not SUPABASE_URL:
        return None
    try:
        payload = _decode_supabase_jwt(credentials.credentials)
        return payload.get("sub")
    except jwt.InvalidTokenError:
        return None


def require_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    Require valid Supabase JWT; return user id. Raises 401 if missing or invalid.
    """
    if not SUPABASE_JWT_SECRET and not SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured (set SUPABASE_JWT_SECRET or SUPABASE_URL)",
        )
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = _decode_supabase_jwt(credentials.credentials)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return sub
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
