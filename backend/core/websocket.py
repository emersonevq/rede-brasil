from websocket.handlers import AuthHandler, ChatHandler, NotificationHandler
from websocket.services import ConnectionService
from websocket import sio
from database.models import User, Message

# Initialize connection service
connection_service = ConnectionService()

# Initialize handlers
auth_handler = AuthHandler()
chat_handler = ChatHandler(sio, connection_service)
notification_handler = NotificationHandler(sio, connection_service)


@sio.event
async def connect(sid, environ, auth):
    """Handle new socket connection"""
    try:
        user = await auth_handler.authenticate_socket(auth)
        await connection_service.connect(user.id, sid)
        print(f"User {user.id} connected with sid {sid}")
    except Exception as e:
        print(f"Connection error: {e}")
        raise e


@sio.event
async def disconnect(sid):
    """Handle socket disconnection"""
    await connection_service.disconnect(sid)
    print(f"Client {sid} disconnected")


# ============= CHAT EVENTS =============

@sio.event
async def chat_message(sid, data):
    """Handle incoming chat message"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        from database.session import SessionLocal
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()
        db.close()

        if not user:
            return

        conversation_id = data.get("conversation_id")
        content = data.get("content")
        content_type = data.get("content_type", "text")
        media_url = data.get("media_url")

        message_payload = await chat_handler.handle_send_message(
            user=user,
            conversation_id=conversation_id,
            content=content,
            content_type=content_type,
            media_url=media_url,
        )

        await chat_handler.emit_message_to_conversation(
            conversation_id=conversation_id,
            message_data=message_payload,
            exclude_sid=sid
        )

        await sio.emit('message_sent', {**message_payload, 'confirmed': True}, to=sid)
    except Exception as e:
        print(f"Error handling chat message: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def message_read(sid, data):
    """Handle message read confirmation"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        message_id = data.get("message_id")
        conversation_id = data.get("conversation_id")

        read_data = await chat_handler.handle_message_read(message_id, user_id)

        await chat_handler.emit_message_read_to_conversation(
            conversation_id=conversation_id,
            read_data=read_data,
            exclude_sid=sid
        )

        await sio.emit('message_read_confirmed', read_data, to=sid)
    except Exception as e:
        print(f"Error handling message read: {e}")


@sio.event
async def delete_message(sid, data):
    """Handle message deletion"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        from database.session import SessionLocal
        db = SessionLocal()
        message = db.query(Message).filter(Message.id == data.get("message_id")).first()
        db.close()

        if not message or message.sender_id != user_id:
            await sio.emit('error', {'message': 'Not authorized'}, to=sid)
            return

        delete_data = await chat_handler.handle_delete_message(data.get("message_id"))

        await chat_handler.emit_message_deleted_to_conversation(
            conversation_id=delete_data['conversation_id'],
            delete_data=delete_data,
            exclude_sid=sid
        )

        await sio.emit('message_deleted_confirmed', delete_data, to=sid)
    except Exception as e:
        print(f"Error handling message delete: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def message_edit(sid, data):
    """Handle message editing"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        from database.session import SessionLocal
        db = SessionLocal()
        message = db.query(Message).filter(Message.id == data.get("message_id")).first()
        db.close()

        if not message or message.sender_id != user_id:
            await sio.emit('error', {'message': 'Not authorized'}, to=sid)
            return

        edit_data = await chat_handler.handle_edit_message(
            data.get("message_id"),
            data.get("content")
        )

        await chat_handler.emit_message_edited_to_conversation(
            conversation_id=edit_data['conversation_id'],
            edit_data=edit_data,
            exclude_sid=sid
        )

        await sio.emit('message_edited_confirmed', edit_data, to=sid)
    except Exception as e:
        print(f"Error handling message edit: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def message_reaction(sid, data):
    """Handle message reaction"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        from database.session import SessionLocal
        db = SessionLocal()
        message = db.query(Message).filter(Message.id == data.get("message_id")).first()
        db.close()

        if not message:
            return

        reaction_data = {
            "message_id": data.get("message_id"),
            "user_id": user_id,
            "emoji": data.get("emoji"),
            "conversation_id": message.conversation_id,
        }

        await chat_handler.emit_message_to_conversation(
            conversation_id=message.conversation_id,
            message_data=reaction_data,
            exclude_sid=None
        )
    except Exception as e:
        print(f"Error handling message reaction: {e}")


@sio.event
async def mark_as_read(sid, data):
    """Handle marking message as read"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        message_id = data.get("message_id")
        conversation_id = data.get("conversation_id")

        read_data = await chat_handler.handle_message_read(message_id, user_id)

        await chat_handler.emit_message_read_to_conversation(
            conversation_id=conversation_id,
            read_data=read_data,
        )

        await sio.emit('message_read_confirmed', read_data, to=sid)
    except Exception as e:
        print(f"Error handling mark as read: {e}")


@sio.event
async def typing(sid, data):
    """Handle typing indicator"""
    try:
        user_id = connection_service.user_by_session.get(sid)
        if not user_id:
            return

        from database.session import SessionLocal
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()
        db.close()

        if not user:
            return

        conversation_id = data.get("conversation_id")
        is_typing = data.get("typing", True)

        typing_payload = await chat_handler.handle_typing(
            user=user,
            conversation_id=conversation_id,
            is_typing=is_typing,
        )

        await chat_handler.emit_typing_to_conversation(
            conversation_id=conversation_id,
            typing_data=typing_payload,
            exclude_sid=sid
        )
    except Exception as e:
        print(f"Error handling typing: {e}")


# ============= PROFILE VISIT EVENTS =============

async def emit_visit_notification(visited_user_id: int, visitor_id: int, visitor_name: str, visitor_avatar: str = None):
    """Emit profile visit notification to the visited user"""
    await notification_handler.emit_profile_visit(
        visited_user_id=visited_user_id,
        visitor_id=visitor_id,
        visitor_name=visitor_name,
        visitor_avatar=visitor_avatar,
    )


# ============= FRIEND REQUEST EVENTS =============

async def emit_friend_request_notification(receiver_id: int, sender_id: int, sender_name: str, sender_avatar: str = None):
    """Emit friend request notification"""
    await notification_handler.emit_friend_request(
        receiver_id=receiver_id,
        sender_id=sender_id,
        sender_name=sender_name,
        sender_avatar=sender_avatar,
    )


async def emit_friend_request_accepted(requester_id: int, accepter_id: int, accepter_name: str, accepter_avatar: str = None):
    """Emit friend request accepted notification"""
    await notification_handler.emit_friend_request_accepted(
        requester_id=requester_id,
        accepter_id=accepter_id,
        accepter_name=accepter_name,
        accepter_avatar=accepter_avatar,
    )


# ============= POST EVENTS (Comments, Likes, Shares) =============

async def emit_post_comment(post_id: int, post_author_id: int, commenter_id: int, commenter_name: str, commenter_avatar: str = None, comment_text: str = ""):
    """Emit post comment notification"""
    await notification_handler.emit_post_comment(
        post_id=post_id,
        post_author_id=post_author_id,
        commenter_id=commenter_id,
        commenter_name=commenter_name,
        commenter_avatar=commenter_avatar,
        comment_text=comment_text,
    )


async def emit_post_like(post_id: int, post_author_id: int, liker_id: int, liker_name: str, liker_avatar: str = None):
    """Emit post like notification"""
    await notification_handler.emit_post_like(
        post_id=post_id,
        post_author_id=post_author_id,
        liker_id=liker_id,
        liker_name=liker_name,
        liker_avatar=liker_avatar,
    )


async def emit_post_share(post_id: int, post_author_id: int, sharer_id: int, sharer_name: str, sharer_avatar: str = None):
    """Emit post share notification"""
    # TODO: Implementar emit_post_share no NotificationHandler
    pass


# ============= MESSAGE EVENTS =============

async def emit_message(receiver_id: int, sender_id: int, sender_name: str, sender_avatar: str = None, message_text: str = ""):
    """Emit new message notification"""
    # This is now handled by the chat_handler.emit_message_to_conversation()
    pass


# ============= REACTION EVENTS =============

async def emit_reaction(target_type: str, target_id: int, target_author_id: int, reactor_id: int, reactor_name: str, reactor_avatar: str = None, reaction: str = "👍"):
    """Emit reaction notification (for comments, posts, etc.)"""
    # TODO: Implementar reações no sistema de notificações
    pass
