from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Literal

class FriendRequestCreate(BaseModel):
    user_id: int

class FriendRequestOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: Literal["pending", "accepted", "declined", "canceled"]
    created_at: datetime

    class Config:
        from_attributes = True

class FriendStatusOut(BaseModel):
    status: Literal["none", "outgoing_pending", "incoming_pending", "friends"]
    request_id: Optional[int] = None

class IncomingFriendRequestOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_profile_photo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FriendOut(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None
