from database.models import Notification
from database.session import SessionLocal
from websocket.services import NotificationService, ConnectionService
from websocket.events import SocketEvents

class NotificationHandler:
    """Handles notification-related WebSocket events"""
    
    def __init__(self, sio, connection_service: ConnectionService):
        self.sio = sio
        self.connection_service = connection_service
        self.notification_service = NotificationService()
    
    async def emit_profile_visit(
        self,
        visited_user_id: int,
        visitor_id: int,
        visitor_name: str,
        visitor_avatar: str = None,
    ):
        """Emit profile visit notification"""
        db = SessionLocal()
        try:
            notification_data = self.notification_service.create_notification(
                event_type="profile_visit",
                user_id=visited_user_id,
                actor_id=visitor_id,
                actor_name=visitor_name,
                actor_avatar=visitor_avatar,
                message=f"{visitor_name} visitou seu perfil"
            )
            
            notification = Notification(
                user_id=visited_user_id,
                type="profile_visit",
                actor_id=visitor_id,
                data=notification_data
            )
            db.add(notification)
            db.commit()
            
            if self.connection_service.is_user_online(visited_user_id):
                sessions = self.connection_service.get_user_sessions(visited_user_id)
                for sid in sessions:
                    await self.sio.emit(SocketEvents.PROFILE_VISIT, notification_data, to=sid)
        finally:
            db.close()
    
    async def emit_friend_request(
        self,
        receiver_id: int,
        sender_id: int,
        sender_name: str,
        sender_avatar: str = None,
    ):
        """Emit friend request notification"""
        db = SessionLocal()
        try:
            notification_data = self.notification_service.create_notification(
                event_type="friend_request",
                user_id=receiver_id,
                actor_id=sender_id,
                actor_name=sender_name,
                actor_avatar=sender_avatar,
                message=f"{sender_name} enviou uma solicitação de amizade"
            )
            
            notification = Notification(
                user_id=receiver_id,
                type="friend_request",
                actor_id=sender_id,
                data=notification_data
            )
            db.add(notification)
            db.commit()
            
            if self.connection_service.is_user_online(receiver_id):
                sessions = self.connection_service.get_user_sessions(receiver_id)
                for sid in sessions:
                    await self.sio.emit(SocketEvents.FRIEND_REQUEST, notification_data, to=sid)
        finally:
            db.close()
    
    async def emit_friend_request_accepted(
        self,
        requester_id: int,
        accepter_id: int,
        accepter_name: str,
        accepter_avatar: str = None,
    ):
        """Emit friend request accepted notification"""
        db = SessionLocal()
        try:
            notification_data = self.notification_service.create_notification(
                event_type="friend_request_accepted",
                user_id=requester_id,
                actor_id=accepter_id,
                actor_name=accepter_name,
                actor_avatar=accepter_avatar,
                message=f"{accepter_name} aceitou sua solicitação de amizade"
            )
            
            notification = Notification(
                user_id=requester_id,
                type="friend_request_accepted",
                actor_id=accepter_id,
                data=notification_data
            )
            db.add(notification)
            db.commit()
            
            if self.connection_service.is_user_online(requester_id):
                sessions = self.connection_service.get_user_sessions(requester_id)
                for sid in sessions:
                    await self.sio.emit(SocketEvents.FRIEND_REQUEST_ACCEPTED, notification_data, to=sid)
        finally:
            db.close()
    
    async def emit_post_comment(
        self,
        post_id: int,
        post_author_id: int,
        commenter_id: int,
        commenter_name: str,
        commenter_avatar: str = None,
        comment_text: str = "",
    ):
        """Emit post comment notification"""
        db = SessionLocal()
        try:
            notification_data = self.notification_service.create_notification(
                event_type="post_comment",
                user_id=post_author_id,
                actor_id=commenter_id,
                actor_name=commenter_name,
                actor_avatar=commenter_avatar,
                message=comment_text[:100],
                related_id=post_id,
                related_type="post"
            )
            
            notification = Notification(
                user_id=post_author_id,
                type="post_comment",
                actor_id=commenter_id,
                related_id=post_id,
                data=notification_data
            )
            db.add(notification)
            db.commit()
            
            if self.connection_service.is_user_online(post_author_id):
                sessions = self.connection_service.get_user_sessions(post_author_id)
                for sid in sessions:
                    await self.sio.emit(SocketEvents.POST_COMMENT, notification_data, to=sid)
        finally:
            db.close()
    
    async def emit_post_like(
        self,
        post_id: int,
        post_author_id: int,
        liker_id: int,
        liker_name: str,
        liker_avatar: str = None,
    ):
        """Emit post like notification"""
        db = SessionLocal()
        try:
            notification_data = self.notification_service.create_notification(
                event_type="post_like",
                user_id=post_author_id,
                actor_id=liker_id,
                actor_name=liker_name,
                actor_avatar=liker_avatar,
                message=f"{liker_name} curtiu seu post",
                related_id=post_id,
                related_type="post"
            )
            
            notification = Notification(
                user_id=post_author_id,
                type="post_like",
                actor_id=liker_id,
                related_id=post_id,
                data=notification_data
            )
            db.add(notification)
            db.commit()
            
            if self.connection_service.is_user_online(post_author_id):
                sessions = self.connection_service.get_user_sessions(post_author_id)
                for sid in sessions:
                    await self.sio.emit(SocketEvents.POST_LIKE, notification_data, to=sid)
        finally:
            db.close()
