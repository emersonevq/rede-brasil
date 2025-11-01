from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database.session import get_db
from database.models import User, Conversation, Message
from schemas.conversation import (
    ConversationCreate, ConversationUpdate, ConversationWithLatestMessage,
    ConversationDetail, ConversationSearch
)
from schemas.message import MessageBase, MessageCreate, MessageUpdate
from websocket.services import ChatService
from dependencies import get_current_user
import os
import uuid
from datetime import datetime

router = APIRouter()

chat_service = ChatService()


def format_conversation(conv: Conversation, current_user_id: int):
    """Format conversation object for API response"""
    from sqlalchemy.orm import object_session

    # Get the session for this object if it still exists
    session = object_session(conv)
    if session:
        # If still in session, eager load any pending relationships
        from sqlalchemy.orm import selectinload
        if not hasattr(conv.participants, '_loaded_value'):
            try:
                conv.participants  # trigger load
            except:
                pass

    unread_count = chat_service.get_unread_count(
        conversation_id=conv.id,
        user_id=current_user_id
    )
    latest_message = None
    if conv.messages:
        latest_msg = conv.messages[-1]
        read_by_ids = [u.id for u in latest_msg.read_by]
        latest_message = {
            "id": latest_msg.id,
            "content": latest_msg.content,
            "content_type": latest_msg.content_type,
            "media_url": latest_msg.media_url,
            "is_deleted": latest_msg.is_deleted,
            "edited_at": latest_msg.edited_at.isoformat() if latest_msg.edited_at else None,
            "created_at": latest_msg.created_at.isoformat(),
            "read_by": read_by_ids,
            "sender": {
                "id": latest_msg.sender.id,
                "username": latest_msg.sender.username,
                "first_name": latest_msg.sender.first_name,
                "last_name": latest_msg.sender.last_name,
                "profile_photo": latest_msg.sender.profile_photo,
            }
        }

    participants = [
        {
            "id": p.id,
            "username": p.username,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "profile_photo": p.profile_photo,
        }
        for p in conv.participants
    ]

    return {
        "id": conv.id,
        "name": conv.name,
        "description": conv.description,
        "is_group": conv.is_group,
        "avatar_url": conv.avatar_url,
        "participants": participants,
        "latest_message": latest_message,
        "unread_count": unread_count,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
    }


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    include_archived: bool = False,
):
    """Get all conversations for the current user"""
    from database.session import SessionLocal
    from sqlalchemy.orm import selectinload

    db = SessionLocal()
    try:
        query = db.query(Conversation).options(
            selectinload(Conversation.participants),
            selectinload(Conversation.messages).selectinload(Message.sender),
            selectinload(Conversation.messages).selectinload(Message.read_by)
        ).join(
            Conversation.participants
        ).filter(
            and_(
                User.id == current_user.id,
                Conversation.deleted_at == None
            )
        )

        if not include_archived:
            query = query.filter(Conversation.archived_at == None)

        conversations = query.order_by(
            Conversation.updated_at.desc()
        ).limit(limit).offset(offset).all()

        result = []
        for conv in conversations:
            unread_count = chat_service.get_unread_count(
                conversation_id=conv.id,
                user_id=current_user.id
            )

            latest_message = None
            if conv.messages:
                latest_msg = conv.messages[-1]
                read_by_ids = [u.id for u in latest_msg.read_by]
                latest_message = {
                    "id": latest_msg.id,
                    "content": latest_msg.content,
                    "content_type": latest_msg.content_type,
                    "media_url": latest_msg.media_url,
                    "is_deleted": latest_msg.is_deleted,
                    "edited_at": latest_msg.edited_at.isoformat() if latest_msg.edited_at else None,
                    "created_at": latest_msg.created_at.isoformat(),
                    "read_by": read_by_ids,
                    "sender": {
                        "id": latest_msg.sender.id,
                        "username": latest_msg.sender.username,
                        "first_name": latest_msg.sender.first_name,
                        "last_name": latest_msg.sender.last_name,
                        "profile_photo": latest_msg.sender.profile_photo,
                    }
                }

            participants = [
                {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "profile_photo": p.profile_photo,
                }
                for p in conv.participants
            ]

            result.append({
                "id": conv.id,
                "name": conv.name,
                "description": conv.description,
                "is_group": conv.is_group,
                "avatar_url": conv.avatar_url,
                "participants": participants,
                "latest_message": latest_message,
                "unread_count": unread_count,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat(),
            })

        return result
    finally:
        db.close()


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get a single conversation by ID"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload

        db = SessionLocal()
        try:
            conversation = db.query(Conversation).options(
                selectinload(Conversation.participants),
                selectinload(Conversation.messages).selectinload(Message.sender),
                selectinload(Conversation.messages).selectinload(Message.read_by)
            ).filter(Conversation.id == conversation_id).first()

            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")

            # Check if user is a participant - do this while session is active
            participant_ids = [p.id for p in conversation.participants]
            if current_user.id not in participant_ids:
                raise HTTPException(status_code=403, detail="Not a participant of this conversation")

            # Format while session is still active
            unread_count = chat_service.get_unread_count(
                conversation_id=conversation.id,
                user_id=current_user.id
            )

            latest_message = None
            if conversation.messages:
                latest_msg = conversation.messages[-1]
                read_by_ids = [u.id for u in latest_msg.read_by]
                latest_message = {
                    "id": latest_msg.id,
                    "content": latest_msg.content,
                    "content_type": latest_msg.content_type,
                    "media_url": latest_msg.media_url,
                    "is_deleted": latest_msg.is_deleted,
                    "edited_at": latest_msg.edited_at.isoformat() if latest_msg.edited_at else None,
                    "created_at": latest_msg.created_at.isoformat(),
                    "read_by": read_by_ids,
                    "sender": {
                        "id": latest_msg.sender.id,
                        "username": latest_msg.sender.username,
                        "first_name": latest_msg.sender.first_name,
                        "last_name": latest_msg.sender.last_name,
                        "profile_photo": latest_msg.sender.profile_photo,
                    }
                }

            participants = [
                {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "profile_photo": p.profile_photo,
                }
                for p in conversation.participants
            ]

            return {
                "id": conversation.id,
                "name": conversation.name,
                "description": conversation.description,
                "is_group": conversation.is_group,
                "avatar_url": conversation.avatar_url,
                "participants": participants,
                "latest_message": latest_message,
                "unread_count": unread_count,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
            }
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/search")
async def search_conversations(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    """Search conversations by name"""
    from database.session import SessionLocal
    from sqlalchemy.orm import selectinload

    db = SessionLocal()
    try:
        search_query = f"%{q}%"
        conversations = db.query(Conversation).options(
            selectinload(Conversation.participants),
            selectinload(Conversation.messages).selectinload(Message.sender),
            selectinload(Conversation.messages).selectinload(Message.read_by)
        ).join(
            Conversation.participants
        ).filter(
            and_(
                User.id == current_user.id,
                Conversation.deleted_at == None,
                Conversation.name.ilike(search_query)
            )
        ).order_by(
            Conversation.updated_at.desc()
        ).limit(limit).all()

        result = []
        for conv in conversations:
            unread_count = chat_service.get_unread_count(
                conversation_id=conv.id,
                user_id=current_user.id
            )

            latest_message = None
            if conv.messages:
                latest_msg = conv.messages[-1]
                read_by_ids = [u.id for u in latest_msg.read_by]
                latest_message = {
                    "id": latest_msg.id,
                    "content": latest_msg.content,
                    "content_type": latest_msg.content_type,
                    "media_url": latest_msg.media_url,
                    "is_deleted": latest_msg.is_deleted,
                    "edited_at": latest_msg.edited_at.isoformat() if latest_msg.edited_at else None,
                    "created_at": latest_msg.created_at.isoformat(),
                    "read_by": read_by_ids,
                    "sender": {
                        "id": latest_msg.sender.id,
                        "username": latest_msg.sender.username,
                        "first_name": latest_msg.sender.first_name,
                        "last_name": latest_msg.sender.last_name,
                        "profile_photo": latest_msg.sender.profile_photo,
                    }
                }

            participants = [
                {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "profile_photo": p.profile_photo,
                }
                for p in conv.participants
            ]

            result.append({
                "id": conv.id,
                "name": conv.name,
                "description": conv.description,
                "is_group": conv.is_group,
                "avatar_url": conv.avatar_url,
                "participants": participants,
                "latest_message": latest_message,
                "unread_count": unread_count,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat(),
            })

        return result
    finally:
        db.close()


@router.post("/conversations")
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new conversation or group"""
    try:
        # Ensure current user is included in participants
        user_ids = data.participant_ids
        if current_user.id not in user_ids:
            user_ids.insert(0, current_user.id)

        conversation = chat_service.create_conversation(
            user_ids=user_ids,
            name=data.name,
            description=data.description,
            created_by_id=current_user.id
        )

        return format_conversation(conversation, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update conversation details"""
    try:
        conversation = chat_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check if user is the creator
        if conversation.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only creator can update conversation")

        updated = chat_service.update_conversation(
            conversation_id=conversation_id,
            name=data.name,
            description=data.description,
            avatar_url=data.avatar_url
        )

        return format_conversation(updated, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete (soft delete) a conversation"""
    try:
        conversation = chat_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check if user is a participant
        participant_ids = [p.id for p in conversation.participants]
        if current_user.id not in participant_ids:
            raise HTTPException(status_code=403, detail="Not a participant of this conversation")

        chat_service.delete_conversation(conversation_id)

        return {"message": "Conversation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    """Get messages from a conversation"""
    from database.session import SessionLocal
    from sqlalchemy.orm import selectinload

    db = SessionLocal()
    try:
        conversation = db.query(Conversation).options(
            selectinload(Conversation.participants)
        ).filter(Conversation.id == conversation_id).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check if user is a participant
        participant_ids = [p.id for p in conversation.participants]
        if current_user.id not in participant_ids:
            raise HTTPException(status_code=403, detail="Not a participant of this conversation")
    finally:
        db.close()

    # Mark messages as read
    chat_service.mark_conversation_messages_as_read(conversation_id, current_user.id)

    messages = chat_service.get_messages(conversation_id, limit, offset)

    result = []
    for msg in messages:
        read_by_ids = [u.id for u in msg.read_by]
        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "content": msg.content,
            "content_type": msg.content_type,
            "media_url": msg.media_url,
            "is_deleted": msg.is_deleted,
            "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
            "created_at": msg.created_at.isoformat(),
            "read_by": read_by_ids,
            "sender": {
                "id": msg.sender.id,
                "username": msg.sender.username,
                "first_name": msg.sender.first_name,
                "last_name": msg.sender.last_name,
                "profile_photo": msg.sender.profile_photo,
            }
        })

    return result


@router.get("/conversations/{conversation_id}/messages/search")
async def search_messages(
    conversation_id: int,
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    """Search messages in a conversation"""
    conversation = chat_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if user is a participant
    participant_ids = [p.id for p in conversation.participants]
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    messages = chat_service.search_messages(conversation_id, q, limit)

    result = []
    for msg in messages:
        read_by_ids = [u.id for u in msg.read_by]
        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "content": msg.content,
            "content_type": msg.content_type,
            "media_url": msg.media_url,
            "is_deleted": msg.is_deleted,
            "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
            "created_at": msg.created_at.isoformat(),
            "read_by": read_by_ids,
            "sender": {
                "id": msg.sender.id,
                "username": msg.sender.username,
                "first_name": msg.sender.first_name,
                "last_name": msg.sender.last_name,
                "profile_photo": msg.sender.profile_photo,
            }
        })

    return result


@router.put("/messages/{message_id}")
async def update_message(
    message_id: int,
    data: MessageUpdate,
    current_user: User = Depends(get_current_user),
):
    """Edit a message"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload
        db = SessionLocal()
        message = db.query(Message).options(
            selectinload(Message.sender),
            selectinload(Message.read_by)
        ).filter(Message.id == message_id).first()
        db.close()

        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Check if user is the sender
        if message.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only edit your own messages")

        updated = chat_service.edit_message(message_id, data.content)

        read_by_ids = [u.id for u in updated.read_by]
        return {
            "id": updated.id,
            "conversation_id": updated.conversation_id,
            "content": updated.content,
            "content_type": updated.content_type,
            "media_url": updated.media_url,
            "is_deleted": updated.is_deleted,
            "edited_at": updated.edited_at.isoformat() if updated.edited_at else None,
            "created_at": updated.created_at.isoformat(),
            "read_by": read_by_ids,
            "sender": {
                "id": updated.sender.id,
                "username": updated.sender.username,
                "first_name": updated.sender.first_name,
                "last_name": updated.sender.last_name,
                "profile_photo": updated.sender.profile_photo,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a message"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload
        db = SessionLocal()
        message = db.query(Message).options(
            selectinload(Message.sender),
            selectinload(Message.read_by)
        ).filter(Message.id == message_id).first()
        db.close()

        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Check if user is the sender
        if message.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only delete your own messages")

        chat_service.delete_message(message_id)

        return {"message": "Message deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
):
    """Mark a message as read"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload
        db = SessionLocal()
        message = db.query(Message).options(
            selectinload(Message.sender),
            selectinload(Message.read_by)
        ).filter(Message.id == message_id).first()
        db.close()

        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Check if user is a participant of the conversation
        conversation = chat_service.get_conversation(message.conversation_id)
        participant_ids = [p.id for p in conversation.participants]
        if current_user.id not in participant_ids:
            raise HTTPException(status_code=403, detail="Not a participant of this conversation")

        chat_service.mark_message_as_read(message_id, current_user.id)

        return {"message": "Message marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{user_id}/dm")
async def get_or_create_dm(
    user_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get or create a direct message conversation with a specific user"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload

        db = SessionLocal()
        try:
            # Get or create the conversation
            conversation = chat_service.get_or_create_dm_conversation(
                user_id_1=current_user.id,
                user_id_2=user_id
            )

            # Reload conversation with eager loading within this session
            conversation = db.query(Conversation).options(
                selectinload(Conversation.participants)
            ).filter(Conversation.id == conversation.id).first()

            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")

            participants = [
                {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "profile_photo": p.profile_photo,
                }
                for p in conversation.participants
            ]

            return {
                "id": conversation.id,
                "name": conversation.name,
                "is_group": conversation.is_group,
                "participants": participants,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
            }
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a file for chat"""
    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        MEDIA_DIR = os.path.join(BASE_DIR, "media", "chat")
        os.makedirs(MEDIA_DIR, exist_ok=True)

        filename = f"{uuid.uuid4()}_{int(datetime.utcnow().timestamp())}_{file.filename}"
        filepath = os.path.join(MEDIA_DIR, filename)

        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())

        media_url = f"/media/chat/{filename}"

        return {
            "media_url": media_url,
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@router.post("/messages/{message_id}/react")
async def react_to_message(
    message_id: int,
    emoji: str = Query(..., min_length=1, max_length=10),
    current_user: User = Depends(get_current_user),
):
    """Add a reaction to a message"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload
        db = SessionLocal()
        message = db.query(Message).options(
            selectinload(Message.sender),
            selectinload(Message.read_by)
        ).filter(Message.id == message_id).first()
        db.close()

        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Check if user is a participant of the conversation
        conversation = chat_service.get_conversation(message.conversation_id)
        participant_ids = [p.id for p in conversation.participants]
        if current_user.id not in participant_ids:
            raise HTTPException(status_code=403, detail="Not a participant of this conversation")

        return {
            "message_id": message_id,
            "user_id": current_user.id,
            "emoji": emoji,
            "reacted_at": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages")
async def create_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new message via REST (used as fallback if WebSocket fails)"""
    try:
        from database.session import SessionLocal
        from sqlalchemy.orm import selectinload

        db = SessionLocal()
        try:
            # Check if conversation exists and user is a participant
            conversation = db.query(Conversation).options(
                selectinload(Conversation.participants)
            ).filter(Conversation.id == data.conversation_id).first()

            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")

            # Check if user is a participant
            participant_ids = [p.id for p in conversation.participants]
            if current_user.id not in participant_ids:
                raise HTTPException(status_code=403, detail="Not a participant of this conversation")
        finally:
            db.close()

        message = chat_service.create_message(
            conversation_id=data.conversation_id,
            sender_id=current_user.id,
            content=data.content,
            content_type=data.content_type or "text",
            media_url=data.media_url,
        )

        read_by_ids = [u.id for u in message.read_by]
        return {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "content": message.content,
            "content_type": message.content_type,
            "media_url": message.media_url,
            "is_deleted": message.is_deleted,
            "edited_at": message.edited_at.isoformat() if message.edited_at else None,
            "created_at": message.created_at.isoformat(),
            "read_by": read_by_ids,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
                "first_name": message.sender.first_name,
                "last_name": message.sender.last_name,
                "profile_photo": message.sender.profile_photo,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
