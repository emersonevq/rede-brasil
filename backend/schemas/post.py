from datetime import datetime
from pydantic import BaseModel

class PostCreate(BaseModel):
    content: str
    media_url: str | None = None

class PostOut(BaseModel):
    id: int
    content: str
    media_url: str | None
    created_at: datetime
    user_id: int
    user_name: str
    user_profile_photo: str | None = None
    user_cover_photo: str | None = None

    class Config:
        from_attributes = True
