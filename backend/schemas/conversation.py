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

class ConversationCreate(BaseModel):
    participant_ids: list[int]
    name: Optional[str] = None
    description: Optional[str] = None
    is_group: Optional[bool] = None

class ConversationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None

class ConversationBase(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None
    is_group: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    participants: list[UserInfo]

    class Config:
        from_attributes = True

class ConversationDetail(ConversationBase):
    messages: list[MessageBase] = []

class ConversationWithLatestMessage(ConversationBase):
    latest_message: Optional[MessageBase] = None
    unread_count: int = 0

class ConversationSearch(BaseModel):
    id: int
    name: Optional[str] = None
    is_group: bool
    avatar_url: Optional[str] = None
    participants_count: int
    latest_message_preview: Optional[str] = None
    updated_at: datetime
