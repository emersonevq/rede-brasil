import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Plus,
  MessageCircle,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react-native';
import BottomNav from '../../components/BottomNav';
import TopBar from '../../components/TopBar';
import { getConversations, deleteConversation } from '../../utils/api';
import { initializeSocket, getSocket } from '../../utils/websocket';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

interface ChatItem {
  id: number;
  name?: string;
  participants: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo?: string;
  }>;
  latest_message?: {
    id: number;
    content: string;
    created_at: string;
    sender: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  unread_count: number;
  is_group: boolean;
}

const ChatItem = ({
  item,
  onPress,
  onDelete,
}: {
  item: ChatItem;
  onPress: () => void;
  onDelete: (id: number) => void;
}) => {
  const isUnread = item.unread_count > 0;
  const [showActions, setShowActions] = useState(false);

  // Get the other participant's name (for DMs)
  const getDisplayName = () => {
    if (item.name) return item.name;
    const otherParticipant = item.participants[0];
    return `${otherParticipant.first_name} ${otherParticipant.last_name}`;
  };

  // Get the last message time
  const getMessageTime = () => {
    if (!item.latest_message) return '';
    const messageDate = new Date(item.latest_message.created_at);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Deletar conversa',
      'Tem certeza que deseja deletar esta conversa?',
      [
        {
          text: 'Cancelar',
          onPress: () => setShowActions(false),
          style: 'cancel',
        },
        {
          text: 'Deletar',
          onPress: () => {
            onDelete(item.id);
            setShowActions(false);
          },
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <View style={[styles.chatItem, isUnread && styles.chatItemUnread]}>
      <TouchableOpacity
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.participants[0]?.profile_photo ||
                `https://i.pravatar.cc/150?u=${item.participants[0]?.id}`,
            }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, isUnread && styles.chatNameUnread]}>
              {getDisplayName()}
            </Text>
            <Text style={[styles.chatTime, isUnread && styles.chatTimeUnread]}>
              {getMessageTime()}
            </Text>
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[styles.chatMessage, isUnread && styles.chatMessageUnread]}
              numberOfLines={2}
            >
              {item.latest_message?.content || 'Sem mensagens'}
            </Text>

            {isUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            ) : (
              <CheckCheck size={16} color="#94a3b8" strokeWidth={2} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#ef4444" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowActions(!showActions)}
        activeOpacity={0.7}
      >
        {showActions ? (
          <X size={18} color="#64748b" strokeWidth={2} />
        ) : (
          <Text style={styles.actionButtonText}>••���</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function MessagesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Initialize socket
  useEffect(() => {
    initializeSocket();
  }, []);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const conversations = await getConversations();
      setConversations(conversations);

      const total = conversations.reduce(
        (sum: number, conv: ChatItem) => sum + conv.unread_count,
        0,
      );
      setUnreadTotal(total);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations().finally(() => setRefreshing(false));
  }, []);

  const filteredChats = useMemo(() => {
    if (!query.trim()) return conversations;
    return conversations.filter((chat) => {
      const displayName =
        chat.name ||
        `${chat.participants[0]?.first_name} ${chat.participants[0]?.last_name}`;
      const lastMessage = chat.latest_message?.content || '';
      return (
        displayName.toLowerCase().includes(query.toLowerCase()) ||
        lastMessage.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query, conversations]);

  const handleChatPress = (chatId: number) => {
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId),
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao deletar conversa');
      console.error(error);
    }
  };

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
        <BottomNav active="messages" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bate-papo</Text>
            <Text style={styles.subtitle}>
              {unreadTotal}{' '}
              {unreadTotal === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newChatBtn}
            activeOpacity={0.7}
            onPress={handleNewChat}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" strokeWidth={2} />
          <TextInput
            placeholder="Buscar conversas..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              onPress={() => handleChatPress(item.id)}
              onDelete={handleDeleteConversation}
            />
          )}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MessageCircle size={48} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Nenhuma conversa encontrada</Text>
              <Text style={styles.emptyText}>
                {query
                  ? 'Tente buscar por outro nome ou mensagem'
                  : 'Comece uma nova conversa!'}
              </Text>
            </View>
          }
        />
      </View>

      <BottomNav active="messages" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  newChatBtn: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  chatList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chatItemUnread: {
    backgroundColor: '#f8fafc',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  chatNameUnread: {
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 13,
    color: '#94a3b8',
  },
  chatTimeUnread: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  chatMessageUnread: {
    color: '#334155',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
});
