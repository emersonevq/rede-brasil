from websocket.services import ChatService, NotificationService, ConnectionService
from websocket.events import SocketEvents
from database.models import User

class ChatHandler:
    """Handles chat-related WebSocket events"""

    def __init__(self, sio, connection_service: ConnectionService):
        self.sio = sio
        self.connection_service = connection_service
        self.chat_service = ChatService()
        self.notification_service = NotificationService()

    async def handle_send_message(
        self,
        user: User,
        conversation_id: int,
        content: str,
        content_type: str = "text",
        media_url: str = None,
    ) -> dict:
        """Handle sending a message"""
        try:
            message = self.chat_service.create_message(
                conversation_id=conversation_id,
                sender_id=user.id,
                content=content,
                content_type=content_type,
                media_url=media_url,
            )

            read_by_ids = [u.id for u in message.read_by]

            payload = {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender": {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}".strip(),
                    "avatar": user.profile_photo,
                },
                "content": message.content,
                "content_type": message.content_type,
                "media_url": message.media_url,
                "is_deleted": message.is_deleted,
                "edited_at": None,
                "created_at": message.created_at.isoformat(),
                "read_by": read_by_ids,
            }

            return payload
        except Exception as e:
            raise Exception(f"Error sending message: {str(e)}")

    async def handle_message_read(self, message_id: int, user_id: int):
        """Handle message read confirmation"""
        try:
            message = self.chat_service.mark_message_as_read(message_id, user_id)
            read_by_ids = [u.id for u in message.read_by]
            return {
                "message_id": message_id,
                "user_id": user_id,
                "read_by": read_by_ids,
            }
        except Exception as e:
            raise Exception(f"Error marking message as read: {str(e)}")

    async def handle_delete_message(self, message_id: int):
        """Handle message deletion"""
        try:
            message = self.chat_service.delete_message(message_id)
            return {
                "message_id": message_id,
                "is_deleted": True,
                "conversation_id": message.conversation_id,
            }
        except Exception as e:
            raise Exception(f"Error deleting message: {str(e)}")

    async def handle_edit_message(self, message_id: int, content: str):
        """Handle message editing"""
        try:
            message = self.chat_service.edit_message(message_id, content)
            read_by_ids = [u.id for u in message.read_by]
            return {
                "id": message.id,
                "conversation_id": message.conversation_id,
                "content": message.content,
                "edited_at": message.edited_at.isoformat() if message.edited_at else None,
                "read_by": read_by_ids,
            }
        except Exception as e:
            raise Exception(f"Error editing message: {str(e)}")

    async def handle_typing(
        self,
        user: User,
        conversation_id: int,
        is_typing: bool,
    ) -> dict:
        """Handle typing indicator"""
        try:
            if is_typing:
                self.connection_service.add_typing_user(conversation_id, user.id)
            else:
                self.connection_service.remove_typing_user(conversation_id, user.id)

            payload = self.notification_service.create_typing_payload(
                conversation_id=conversation_id,
                user_id=user.id,
                user_name=f"{user.first_name} {user.last_name}".strip(),
                typing=is_typing,
            )

            return payload
        except Exception as e:
            raise Exception(f"Error handling typing: {str(e)}")

    async def emit_message_to_conversation(self, conversation_id: int, message_data: dict, exclude_sid: str = None):
        """Emit a message to all participants in a conversation"""
        # Get all participants in the conversation
        conversation = self.chat_service.get_conversation(conversation_id)
        if not conversation:
            return

        for participant in conversation.participants:
            sessions = self.connection_service.get_user_sessions(participant.id)
            for session_id in sessions:
                if session_id != exclude_sid:
                    await self.sio.emit(
                        SocketEvents.CHAT_MESSAGE,
                        message_data,
                        to=session_id
                    )

    async def emit_message_read_to_conversation(self, conversation_id: int, read_data: dict, exclude_sid: str = None):
        """Emit message read confirmation to all participants"""
        conversation = self.chat_service.get_conversation(conversation_id)
        if not conversation:
            return

        for participant in conversation.participants:
            sessions = self.connection_service.get_user_sessions(participant.id)
            for session_id in sessions:
                if session_id != exclude_sid:
                    await self.sio.emit(
                        SocketEvents.MESSAGE_READ,
                        read_data,
                        to=session_id
                    )

    async def emit_message_deleted_to_conversation(self, conversation_id: int, delete_data: dict, exclude_sid: str = None):
        """Emit message deletion to all participants"""
        conversation = self.chat_service.get_conversation(conversation_id)
        if not conversation:
            return

        for participant in conversation.participants:
            sessions = self.connection_service.get_user_sessions(participant.id)
            for session_id in sessions:
                if session_id != exclude_sid:
                    await self.sio.emit(
                        "message_deleted",
                        delete_data,
                        to=session_id
                    )

    async def emit_message_edited_to_conversation(self, conversation_id: int, edit_data: dict, exclude_sid: str = None):
        """Emit message edit to all participants"""
        conversation = self.chat_service.get_conversation(conversation_id)
        if not conversation:
            return

        for participant in conversation.participants:
            sessions = self.connection_service.get_user_sessions(participant.id)
            for session_id in sessions:
                if session_id != exclude_sid:
                    await self.sio.emit(
                        "message_edited",
                        edit_data,
                        to=session_id
                    )

    async def emit_typing_to_conversation(self, conversation_id: int, typing_data: dict, exclude_sid: str = None):
        """Emit typing indicator to all participants in a conversation"""
        conversation = self.chat_service.get_conversation(conversation_id)
        if not conversation:
            return

        for participant in conversation.participants:
            if participant.id != typing_data['user_id']:  # Don't send to the typing user
                sessions = self.connection_service.get_user_sessions(participant.id)
                for session_id in sessions:
                    if session_id != exclude_sid:
                        await self.sio.emit(
                            SocketEvents.TYPING_START if typing_data['typing'] else SocketEvents.TYPING_STOP,
                            typing_data,
                            to=session_id
                        )
