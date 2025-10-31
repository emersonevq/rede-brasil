import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const API_BASE_URL =
  (typeof process !== 'undefined' &&
    (process as any).env &&
    (process as any).env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000';

let socket: Socket | null = null;

export function initializeSocket() {
  const token = getToken();
  if (!token) {
    console.warn('No token available for WebSocket connection');
    return null;
  }

  socket = io(API_BASE_URL, {
    path: '/socket.io/',
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    reconnectionDelayJitter: true,
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Notification handlers
export interface Notification {
  type: string;
  timestamp: string;
  user_id: number;
  actor: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  message: string;
  related?: {
    id: number;
    type: string;
  } | null;
}

type NotificationHandler = (notification: Notification) => void;
const notificationHandlers: Map<string, Set<NotificationHandler>> = new Map();

export function onNotification(
  eventType: string,
  handler: NotificationHandler,
) {
  if (!socket) return;

  if (!notificationHandlers.has(eventType)) {
    notificationHandlers.set(eventType, new Set());

    // Subscribe to this event type on socket
    socket.on(eventType, (data: Notification) => {
      const handlers = notificationHandlers.get(eventType);
      if (handlers) {
        handlers.forEach((h) => h(data));
      }
    });
  }

  const handlers = notificationHandlers.get(eventType)!;
  handlers.add(handler);

  // Return unsubscribe function
  return () => {
    handlers.delete(handler);
  };
}

export function offNotification(
  eventType: string,
  handler?: NotificationHandler,
) {
  if (!notificationHandlers.has(eventType)) return;

  if (handler) {
    notificationHandlers.get(eventType)?.delete(handler);
  } else {
    notificationHandlers.delete(eventType);
    if (socket) {
      socket.off(eventType);
    }
  }
}

// Event types
export const NotificationEvents = {
  PROFILE_VISIT: 'profile_visit',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  POST_COMMENT: 'post_comment',
  POST_LIKE: 'post_like',
  POST_SHARE: 'post_share',
  MESSAGE: 'message',
  COMMENT_REACTION: 'comment_reaction',
  POST_REACTION: 'post_reaction',
} as const;
