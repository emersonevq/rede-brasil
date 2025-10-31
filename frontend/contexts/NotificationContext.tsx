import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  initializeSocket,
  onNotification,
  offNotification,
  NotificationEvents,
  type Notification,
} from '../utils/websocket';

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  removeNotification: (index: number) => void;
  isConnected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = initializeSocket();
    if (socket) {
      setIsConnected(true);

      // Subscribe to all notification types
      const unsubscribers: Array<() => void> = [];

      Object.values(NotificationEvents).forEach((eventType) => {
        const unsubscribe = onNotification(eventType, (notification) => {
          addNotificationToList(notification);
        });
        if (unsubscribe) {
          unsubscribers.push(unsubscribe);
        }
      });

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    }
  }, []);

  const addNotificationToList = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.timestamp !== notification.timestamp),
      );
    }, 10000);
  }, []);

  const addNotification = useCallback(
    (notification: Notification) => {
      addNotificationToList(notification);
    },
    [addNotificationToList],
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        clearNotifications,
        removeNotification,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}
