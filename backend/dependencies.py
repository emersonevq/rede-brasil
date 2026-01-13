from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.session import SessionLocal, get_db
from core.security import verify_token

security = HTTPBearer()

# Database dependency
async def get_db_session() -> Session:
    """Get database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    try:
        user_id = verify_token(token)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
