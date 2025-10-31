from typing import Dict, Set

class ConnectionService:
    """Manages WebSocket connections for users"""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[str]] = {}
        self.user_by_session: Dict[str, int] = {}
        self.typing_users: Dict[int, Set[int]] = {}  # conversation_id -> set of user_ids
    
    async def connect(self, user_id: int, session_id: str):
        """Register a new connection"""
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(session_id)
        self.user_by_session[session_id] = user_id
    
    async def disconnect(self, session_id: str):
        """Remove a disconnected session"""
        user_id = self.user_by_session.get(session_id)
        if user_id and session_id in self.active_connections.get(user_id, set()):
            self.active_connections[user_id].remove(session_id)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if session_id in self.user_by_session:
            del self.user_by_session[session_id]
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user has active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_user_sessions(self, user_id: int) -> list[str]:
        """Get all session IDs for a user"""
        return list(self.active_connections.get(user_id, set()))
    
    def get_online_users(self) -> Dict[int, int]:
        """Get count of active connections per user"""
        return {uid: len(sids) for uid, sids in self.active_connections.items()}
    
    def add_typing_user(self, conversation_id: int, user_id: int):
        """Add user to typing list for a conversation"""
        if conversation_id not in self.typing_users:
            self.typing_users[conversation_id] = set()
        self.typing_users[conversation_id].add(user_id)
    
    def remove_typing_user(self, conversation_id: int, user_id: int):
        """Remove user from typing list"""
        if conversation_id in self.typing_users:
            self.typing_users[conversation_id].discard(user_id)
            if not self.typing_users[conversation_id]:
                del self.typing_users[conversation_id]
    
    def get_typing_users(self, conversation_id: int) -> list[int]:
        """Get users typing in a conversation"""
        return list(self.typing_users.get(conversation_id, set()))

# Global connection service instance
connection_service = ConnectionService()
