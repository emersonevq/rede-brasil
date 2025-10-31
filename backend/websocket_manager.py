from typing import Dict, Set
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[str]] = {}  # user_id -> set of session_ids
        self.user_by_session: Dict[str, int] = {}  # session_id -> user_id

    async def connect(self, user_id: int, session_id: str):
        """Register a connected user session"""
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(session_id)
        self.user_by_session[session_id] = user_id

    async def disconnect(self, session_id: str):
        """Unregister a disconnected user session"""
        user_id = self.user_by_session.get(session_id)
        if user_id and session_id in self.active_connections.get(user_id, set()):
            self.active_connections[user_id].remove(session_id)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if session_id in self.user_by_session:
            del self.user_by_session[session_id]

    def is_user_online(self, user_id: int) -> bool:
        """Check if a user has active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_users(self) -> Dict[int, int]:
        """Get count of active connections per user"""
        return {uid: len(sids) for uid, sids in self.active_connections.items()}


# Global connection manager
manager = ConnectionManager()


def create_notification_data(
    event_type: str,
    user_id: int,
    actor_id: int,
    actor_name: str,
    actor_avatar: str = None,
    message: str = "",
    related_id: int = None,
    related_type: str = None,
):
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
