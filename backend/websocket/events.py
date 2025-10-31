"""Event type definitions for WebSocket communication"""

class SocketEvents:
    """Socket.IO event names"""
    # Connection events
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    
    # Chat events
    CHAT_MESSAGE = "chat_message"
    MESSAGE_READ = "message_read"
    TYPING_START = "typing_start"
    TYPING_STOP = "typing_stop"
    CONVERSATION_CREATED = "conversation_created"
    
    # Notification events
    PROFILE_VISIT = "profile_visit"
    FRIEND_REQUEST = "friend_request"
    FRIEND_REQUEST_ACCEPTED = "friend_request_accepted"
    POST_COMMENT = "post_comment"
    POST_LIKE = "post_like"
    POST_SHARE = "post_share"
    MESSAGE = "message"
    COMMENT_REACTION = "comment_reaction"
    POST_REACTION = "post_reaction"

class MessageContentType:
    """Message content types"""
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    GIF = "gif"
    FILE = "file"
