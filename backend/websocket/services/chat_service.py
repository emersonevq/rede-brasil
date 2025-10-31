from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from database.models import Conversation, Message, User, message_reads
from database.session import SessionLocal

class ChatService:
    """Business logic for chat operations"""

    @staticmethod
    def create_conversation(user_ids: list[int], name: str = None, created_by_id: int = None, description: str = None) -> Conversation:
        """Create a new conversation"""
        db = SessionLocal()
        try:
            participants = db.query(User).filter(User.id.in_(user_ids)).all()

            is_group = len(user_ids) > 2 if name or description else len(user_ids) > 2

            conversation = Conversation(
                name=name,
                description=description,
                is_group=is_group,
                created_by_id=created_by_id or user_ids[0]
            )
            conversation.participants = participants
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            return conversation
        finally:
            db.close()

    @staticmethod
    def get_conversation(conversation_id: int) -> Conversation | None:
        """Get conversation by ID"""
        db = SessionLocal()
        try:
            return db.query(Conversation).filter(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.deleted_at == None
                )
            ).first()
        finally:
            db.close()

    @staticmethod
    def get_user_conversations(user_id: int, limit: int = 50, offset: int = 0):
        """Get all conversations for a user"""
        db = SessionLocal()
        try:
            conversations = db.query(Conversation).join(
                Conversation.participants
            ).filter(
                and_(
                    User.id == user_id,
                    Conversation.deleted_at == None
                )
            ).order_by(
                Conversation.updated_at.desc()
            ).limit(limit).offset(offset).all()
            return conversations
        finally:
            db.close()

    @staticmethod
    def search_conversations(user_id: int, query: str, limit: int = 20) -> list:
        """Search conversations by name"""
        db = SessionLocal()
        try:
            search_query = f"%{query}%"
            conversations = db.query(Conversation).join(
                Conversation.participants
            ).filter(
                and_(
                    User.id == user_id,
                    Conversation.deleted_at == None,
                    Conversation.name.ilike(search_query)
                )
            ).order_by(
                Conversation.updated_at.desc()
            ).limit(limit).all()
            return conversations
        finally:
            db.close()

    @staticmethod
    def update_conversation(conversation_id: int, name: str = None, description: str = None, avatar_url: str = None) -> Conversation | None:
        """Update conversation details"""
        db = SessionLocal()
        try:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if conversation:
                if name:
                    conversation.name = name
                if description:
                    conversation.description = description
                if avatar_url:
                    conversation.avatar_url = avatar_url
                conversation.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(conversation)
            return conversation
        finally:
            db.close()

    @staticmethod
    def delete_conversation(conversation_id: int):
        """Soft delete a conversation"""
        db = SessionLocal()
        try:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if conversation:
                conversation.deleted_at = datetime.utcnow()
                db.commit()
            return conversation
        finally:
            db.close()

    @staticmethod
    def create_message(
        conversation_id: int,
        sender_id: int,
        content: str,
        content_type: str = "text",
        media_url: str = None
    ) -> Message:
        """Create a new message"""
        db = SessionLocal()
        try:
            message = Message(
                conversation_id=conversation_id,
                sender_id=sender_id,
                content=content,
                content_type=content_type,
                media_url=media_url
            )
            db.add(message)

            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()
            if conversation:
                conversation.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(message)
            return message
        finally:
            db.close()

    @staticmethod
    def get_messages(conversation_id: int, limit: int = 50, offset: int = 0):
        """Get messages from a conversation"""
        db = SessionLocal()
        try:
            messages = db.query(Message).filter(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.is_deleted == False
                )
            ).order_by(
                Message.created_at.desc()
            ).limit(limit).offset(offset).all()
            return list(reversed(messages))
        finally:
            db.close()

    @staticmethod
    def search_messages(conversation_id: int, query: str, limit: int = 20) -> list:
        """Search messages in a conversation"""
        db = SessionLocal()
        try:
            search_query = f"%{query}%"
            messages = db.query(Message).filter(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.is_deleted == False,
                    Message.content.ilike(search_query)
                )
            ).order_by(
                Message.created_at.desc()
            ).limit(limit).all()
            return list(reversed(messages))
        finally:
            db.close()

    @staticmethod
    def mark_message_as_read(message_id: int, user_id: int):
        """Mark a message as read by a user"""
        db = SessionLocal()
        try:
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                # Add user to read_by if not already there
                user = db.query(User).filter(User.id == user_id).first()
                if user and user not in message.read_by:
                    message.read_by.append(user)
                    db.commit()
                    db.refresh(message)
            return message
        finally:
            db.close()

    @staticmethod
    def mark_conversation_messages_as_read(conversation_id: int, user_id: int):
        """Mark all messages in a conversation as read by a user"""
        db = SessionLocal()
        try:
            messages = db.query(Message).filter(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.is_deleted == False
                )
            ).all()

            user = db.query(User).filter(User.id == user_id).first()
            if user:
                for message in messages:
                    if user not in message.read_by:
                        message.read_by.append(user)
                db.commit()
        finally:
            db.close()

    @staticmethod
    def get_unread_count(conversation_id: int, user_id: int) -> int:
        """Get count of unread messages in a conversation for a user"""
        db = SessionLocal()
        try:
            # Count messages not read by this user
            unread = db.query(func.count(Message.id)).filter(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.is_deleted == False,
                    Message.sender_id != user_id,
                    ~Message.read_by.any(User.id == user_id)
                )
            ).scalar()
            return unread or 0
        finally:
            db.close()

    @staticmethod
    def delete_message(message_id: int):
        """Soft delete a message"""
        db = SessionLocal()
        try:
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                message.is_deleted = True
                db.commit()
            return message
        finally:
            db.close()

    @staticmethod
    def edit_message(message_id: int, content: str):
        """Edit a message"""
        db = SessionLocal()
        try:
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                message.content = content
                message.edited_at = datetime.utcnow()
                db.commit()
                db.refresh(message)
            return message
        finally:
            db.close()

    @staticmethod
    def get_or_create_dm_conversation(user_id_1: int, user_id_2: int) -> Conversation:
        """Get or create a direct message conversation between two users"""
        db = SessionLocal()
        try:
            conversation = db.query(Conversation).join(
                Conversation.participants
            ).filter(
                and_(
                    Conversation.is_group == False,
                    Conversation.deleted_at == None,
                    User.id.in_([user_id_1, user_id_2])
                )
            ).group_by(Conversation.id).having(
                func.count(User.id) == 2
            ).first()

            if conversation:
                return conversation

            participants = db.query(User).filter(User.id.in_([user_id_1, user_id_2])).all()
            conversation = Conversation(
                is_group=False,
                created_by_id=user_id_1
            )
            conversation.participants = participants
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            return conversation
        finally:
            db.close()
