import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { X, Bell } from 'lucide-react-native';
import { useNotification } from '../contexts/NotificationContext';
import { absoluteUrl } from '../utils/api';

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification();
  const [displayedNotifications, setDisplayedNotifications] = useState<
    Array<{ id: string; notification: (typeof notifications)[0] }>
  >([]);

  useEffect(() => {
    // Update displayed notifications (limit to 3)
    setDisplayedNotifications(
      notifications.slice(0, 3).map((n, i) => ({
        id: `${n.timestamp}-${i}`,
        notification: n,
      })),
    );
  }, [notifications]);

  if (displayedNotifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {displayedNotifications.map((item, index) => (
        <NotificationItem
          key={item.id}
          notification={item.notification}
          index={index}
          onClose={() => removeNotification(index)}
        />
      ))}
    </View>
  );
}

function NotificationItem({
  notification,
  index,
  onClose,
}: {
  notification: (typeof notifications)[0];
  index: number;
  onClose: () => void;
}) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'profile_visit':
        return 'Eye';
      case 'friend_request':
      case 'friend_request_accepted':
        return 'Users';
      case 'post_comment':
      case 'comment_reaction':
        return 'MessageCircle';
      case 'post_like':
      case 'post_reaction':
        return 'Heart';
      case 'post_share':
        return 'Share2';
      case 'message':
        return 'Mail';
      default:
        return 'Bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'profile_visit':
        return '#3b82f6';
      case 'friend_request':
      case 'friend_request_accepted':
        return '#8b5cf6';
      case 'post_comment':
        return '#06b6d4';
      case 'post_like':
        return '#ec4899';
      case 'message':
        return '#10b981';
      default:
        return '#0856d6';
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'profile_visit':
        return 'Visita no Perfil';
      case 'friend_request':
        return 'Solicitação de Amizade';
      case 'friend_request_accepted':
        return 'Amizade Aceita';
      case 'post_comment':
        return 'Novo Comentário';
      case 'post_like':
        return 'Curtida no Post';
      case 'post_share':
        return 'Post Compartilhado';
      case 'message':
        return 'Nova Mensagem';
      case 'comment_reaction':
      case 'post_reaction':
        return 'Nova Reação';
      default:
        return 'Notificação';
    }
  };

  const color = getNotificationColor(notification.type);
  const title = getNotificationTitle(notification.type);

  return (
    <Animated.View
      style={[
        styles.notificationItem,
        {
          marginTop: index * 12 + 10,
        },
      ]}
    >
      <View
        style={[
          styles.notificationContent,
          {
            borderLeftColor: color,
          },
        ]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconBackground,
                {
                  backgroundColor: color + '20',
                },
              ]}
            >
              <Bell size={16} color={color} strokeWidth={2} />
            </View>
          </View>

          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: color }]}>
              {title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.actor.name}
              {notification.message && ` - ${notification.message}`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color="#94a3b8" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 12,
    left: 12,
    zIndex: 1000,
  },
  notificationItem: {
    marginBottom: 8,
  },
  notificationContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
});
