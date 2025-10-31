from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class UserInfo(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    profile_photo: Optional[str] = None

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    content_type: str = "text"
    media_url: Optional[str] = None

class MessageUpdate(BaseModel):
    content: str

class MessageBase(BaseModel):
    id: int
    conversation_id: int
    content: str
    content_type: str
    media_url: Optional[str] = None
    is_deleted: bool = False
    edited_at: Optional[datetime] = None
    created_at: datetime
    sender: UserInfo
    read_by: list[int] = []

    class Config:
        from_attributes = True

class MessageRead(BaseModel):
    message_id: int
    user_id: int
    read_at: datetime

    class Config:
        from_attributes = True
