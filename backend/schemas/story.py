from datetime import datetime
from pydantic import BaseModel

class StoryCreate(BaseModel):
    content: str | None = ""
    media_url: str | None = None

class StoryOut(BaseModel):
    id: int
    content: str | None
    media_url: str | None
    created_at: datetime
    user_id: int
    user_name: str
    user_profile_photo: str | None = None

    class Config:
        from_attributes = True
