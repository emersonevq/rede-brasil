from fastapi import HTTPException, status
from jose import JWTError, jwt
from core.config import settings
from database.session import SessionLocal
from database.models import User

class AuthHandler:
    """Handles WebSocket authentication"""
    
    @staticmethod
    async def authenticate_socket(auth: dict) -> User:
        """Authenticate a socket connection using JWT token"""
        if not auth or 'token' not in auth:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token"
            )
        
        token = auth['token']
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str | None = payload.get("sub")
            if email is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
            
            db = SessionLocal()
            user = db.query(User).filter(User.email == email).first()
            db.close()
            
            if user is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
            
            return user
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
