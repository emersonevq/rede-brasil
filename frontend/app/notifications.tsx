import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import {
  Trash2,
  Eye,
  Users,
  MessageCircle,
  Heart,
  Share2,
  Mail,
} from 'lucide-react-native';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  type NotificationData,
  absoluteUrl,
} from '../utils/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setProcessingId(notificationId);
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      setProcessingId(notificationId);
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'profile_visit':
        return <Eye size={16} color="#3b82f6" strokeWidth={2} />;
      case 'friend_request':
      case 'friend_request_accepted':
        return <Users size={16} color="#8b5cf6" strokeWidth={2} />;
      case 'post_comment':
        return <MessageCircle size={16} color="#06b6d4" strokeWidth={2} />;
      case 'post_like':
        return <Heart size={16} color="#ec4899" strokeWidth={2} />;
      case 'post_share':
        return <Share2 size={16} color="#f59e0b" strokeWidth={2} />;
      case 'message':
        return <Mail size={16} color="#10b981" strokeWidth={2} />;
      default:
        return <Eye size={16} color="#0856d6" strokeWidth={2} />;
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.notificationItemUnread,
      ]}
      onPress={() => handleMarkAsRead(item.id)}
      activeOpacity={0.6}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            {getNotificationTitle(item.type)}
          </Text>
          {item.data?.message && (
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.data.message}
            </Text>
          )}
          <Text style={styles.notificationTime}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <Trash2 size={16} color="#94a3b8" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Notificações</Text>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllBtn}
            >
              <Text style={styles.markAllText}>Marcar como lidas</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0856d6" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Nenhuma notificação</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0856d6',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationItem: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notificationItemUnread: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  deleteBtn: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
});
