from socketio import AsyncServer
from core.config import settings
import os

sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=os.getenv('CORS_ORIGINS', '*').split(',') if os.getenv('CORS_ORIGINS') != '*' else '*',
    cors_credentials=True,
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True,
)

__all__ = ['sio']
