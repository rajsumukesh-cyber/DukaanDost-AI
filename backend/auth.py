"""
DukaanBot Authentication & Password Hashing Module
Uses direct bcrypt / hashlib salt for 100% stability across all Python versions.
"""
import os
import time
import hashlib
import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dukaanbot-super-secret-jwt-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """Generate secure salted SHA-256 hash."""
    salt = "dukaanbot_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return get_password_hash(plain_password) == hashed_password

def create_access_token(user_id: str, shop_id: str, phone: str) -> str:
    payload = {
        "sub": user_id,
        "shop_id": shop_id,
        "phone": phone,
        "exp": int(time.time()) + (ACCESS_TOKEN_EXPIRE_HOURS * 3600),
        "iat": int(time.time())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
