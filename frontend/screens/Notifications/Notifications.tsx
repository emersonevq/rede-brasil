import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Calendar, Heart, Users, CheckCheck, Trash2, MoreVertical } from 'lucide-react-native';

import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';
import { useUnread } from '../../contexts/UnreadContext';

type NotificationType = 'visit' | 'match' | 'event';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Nova visita',
    description: 'Marina visitou o seu perfil há poucos instantes.',
    time: 'Agora mesmo',
    type: 'visit',
    read: false,
  },
  {
    id: 'n2',
    title: 'Solicitação aceita',
    description: 'Bruno aceitou o seu pedido de conexão.',
    time: '2h',
    type: 'match',
    read: false,
  },
  {
    id: 'n3',
    title: 'Novo evento sugerido',
    description: 'UX Talks Recife começa amanhã às 19h.',
    time: 'ontem',
    type: 'event',
    read: true,
  },
];

type NotificationVisual = {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
};

const ICON_META: Record<NotificationType, NotificationVisual> = {
  visit: { Icon: Users, color: '#0856d6', bg: '#eff6ff' },
  match: { Icon: Heart, color: '#ec4899', bg: '#fdf2f8' },
  event: { Icon: Calendar, color: '#10b981', bg: '#f0fdf4' },
};

function NotificationCard({
  item,
  onToggleRead,
  onDelete,
}: {
  item: NotificationItem;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { Icon, color, bg } = ICON_META[item.type];
  const [showActions, setShowActions] = useState(false);

  const handleLongPress = useCallback(() => {
    setShowActions(!showActions);
  }, [showActions]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Excluir notificação',
      'Tem certeza que deseja excluir esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ]
    );
  }, [item.id, onDelete]);

  const handleToggle = useCallback(() => {
    onToggleRead(item.id);
    setShowActions(false);
  }, [item.id, onToggleRead]);

  return (
    <View>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onToggleRead(item.id)}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.icon, { backgroundColor: bg }]}>
            <Icon size={22} color={color} strokeWidth={2.5} />
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>

        <View style={styles.cardRight}>
          {!item.read ? (
            <View style={styles.unreadBadge} />
          ) : (
            <CheckCheck size={18} color="#cbd5e1" strokeWidth={2} />
          )}
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={handleLongPress}
            activeOpacity={0.6}
          >
            <MoreVertical size={18} color="#94a3b8" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Actions Menu */}
      {showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <CheckCheck size={18} color="#0856d6" strokeWidth={2.5} />
            <Text style={styles.actionText}>
              {item.read ? 'Marcar como não lida' : 'Marcar como lida'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#ef4444" strokeWidth={2.5} />
            <Text style={[styles.actionText, styles.actionTextDanger]}>
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const { markNotificationsRead, setUnreadNotifications } = useUnread();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    setUnreadNotifications(unreadCount);
  }, [setUnreadNotifications, unreadCount]);

  useEffect(() => {
    if (unreadCount === 0) {
      markNotificationsRead();
    }
  }, [markNotificationsRead, unreadCount]);

  const handleToggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: !notification.read }
          : notification,
      ),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
    markNotificationsRead();
  }, [markNotificationsRead]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Limpar todas',
      'Deseja excluir todas as notificações lidas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) => prev.filter((n) => !n.read));
          },
        },
      ]
    );
  }, []);

  const readCount = useMemo(
    () => notifications.filter((n) => n.read).length,
    [notifications],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopBar />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notificações</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} ${unreadCount === 1 ? 'nova' : 'novas'}`
                : 'Nenhuma nova notificação'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={handleMarkAllRead}
                activeOpacity={0.7}
              >
                <CheckCheck size={16} color="#0856d6" strokeWidth={2.5} />
                <Text style={styles.headerBtnText}>Ler todas</Text>
              </TouchableOpacity>
            )}

            {readCount > 0 && (
              <TouchableOpacity
                style={[styles.headerBtn, styles.headerBtnDanger]}
                onPress={handleClearAll}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#ef4444" strokeWidth={2.5} />
                <Text style={[styles.headerBtnText, styles.headerBtnTextDanger]}>
                  Limpar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma notificação</Text>
            </View>
          }
        />
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },
  headerBtnDanger: {
    backgroundColor: '#fef2f2',
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0856d6',
  },
  headerBtnTextDanger: {
    color: '#ef4444',
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    backgroundColor: '#ffffff',
    marginBottom: 1,
  },
  cardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 13,
    color: '#94a3b8',
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0856d6',
  },
  moreBtn: {
    padding: 4,
  },
  actionsMenu: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionTextDanger: {
    color: '#ef4444',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
  },
});