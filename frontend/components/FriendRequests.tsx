import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  type IncomingFriendRequest,
  absoluteUrl,
} from '../utils/api';

interface FriendRequestsProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendRequests({
  visible,
  onClose,
}: FriendRequestsProps) {
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadRequests();
    }
  }, [visible]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getIncomingFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await acceptFriendRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await declineFriendRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const renderRequest = ({ item }: { item: IncomingFriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestContent}>
        {item.sender_profile_photo && (
          <Image
            source={{ uri: absoluteUrl(item.sender_profile_photo) }}
            style={styles.avatar}
          />
        )}
        {!item.sender_profile_photo && (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.sender_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.nameText}>{item.sender_name}</Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAccept(item.id)}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.acceptButtonText}>Aceitar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => handleDecline(item.id)}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#64748b" />
          ) : (
            <Text style={styles.declineButtonText}>Recusar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Solicitações de Amizade</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#1f2937" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0856d6" />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Nenhuma solicitação de amizade</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
}

function formatTime(dateString: string): string {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0856d6',
  },
  info: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#0856d6',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  declineButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
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
});
