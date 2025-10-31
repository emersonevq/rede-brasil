from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    id: int
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    profile_photo: str | None = None
    cover_photo: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
