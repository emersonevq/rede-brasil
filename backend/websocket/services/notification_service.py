from datetime import datetime
from typing import Optional

class NotificationService:
    """Service for creating standardized notification data"""
    
    @staticmethod
    def create_notification(
        event_type: str,
        user_id: int,
        actor_id: int,
        actor_name: str,
        actor_avatar: Optional[str] = None,
        message: str = "",
        related_id: Optional[int] = None,
        related_type: Optional[str] = None,
    ) -> dict:
        """Create a standardized notification data structure"""
        return {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "actor": {
                "id": actor_id,
                "name": actor_name,
                "avatar": actor_avatar,
            },
            "message": message,
            "related": {
                "id": related_id,
                "type": related_type,
            } if related_id else None,
        }
    
    @staticmethod
    def create_chat_message_payload(
        message_id: int,
        conversation_id: int,
        sender_id: int,
        sender_name: str,
        sender_avatar: Optional[str],
        content: str,
        content_type: str,
        media_url: Optional[str],
        created_at: str,
    ) -> dict:
        """Create a chat message payload for WebSocket"""
        return {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender": {
                "id": sender_id,
                "name": sender_name,
                "avatar": sender_avatar,
            },
            "content": content,
            "content_type": content_type,
            "media_url": media_url,
            "created_at": created_at,
        }
    
    @staticmethod
    def create_typing_payload(
        conversation_id: int,
        user_id: int,
        user_name: str,
        typing: bool,
    ) -> dict:
        """Create a typing indicator payload"""
        return {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_name": user_name,
            "typing": typing,
            "timestamp": datetime.utcnow().isoformat(),
        }
