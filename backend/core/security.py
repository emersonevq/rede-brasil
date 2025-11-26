from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt has a 72-byte limit. Truncate to ensure compatibility.
    password_truncated = plain_password[:72]
    return pwd_context.verify(password_truncated, hashed_password)

def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit. Truncate to ensure compatibility.
    password_truncated = password[:72]
    return pwd_context.hash(password_truncated)

def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
