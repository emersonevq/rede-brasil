import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { ChevronRight, UserPlus, Clock } from 'lucide-react-native';
import {
  getProfileVisits,
  getCurrentUser,
  sendFriendRequest,
  type VisitorInfo,
  absoluteUrl,
} from '../utils/api';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

export default function VisitsScreen() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');
  const [visits, setVisits] = useState<VisitorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadVisits();
  }, [timeFilter]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const data = await getProfileVisits(user.id, timeFilter);
      setVisits(data);
    } catch (error) {
      console.error('Error loading visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (visitorId: number) => {
    try {
      setProcessingId(visitorId);
      await sendFriendRequest(visitorId);
      setVisits(
        visits.map((v) =>
          v.visitor_id === visitorId
            ? { ...v, has_sent_friend_request: true }
            : v,
        ),
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const navigateToProfile = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  const renderVisitItem = ({ item }: { item: VisitorInfo }) => (
    <View style={styles.visitCard}>
      <View style={styles.visitInfo}>
        {item.visitor_profile_photo ? (
          <Image
            source={{ uri: absoluteUrl(item.visitor_profile_photo) }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.visitor_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.visitDetails}>
          <Text style={styles.name}>{item.visitor_name}</Text>
          <View style={styles.timeRow}>
            <Clock size={12} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.time}>{formatTime(item.visited_at)}</Text>
          </View>
        </View>

        {item.is_friend ? (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigateToProfile(item.visitor_id)}
          >
            <ChevronRight size={20} color="#94a3b8" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.addFriendBtn,
              item.has_sent_friend_request && styles.addFriendBtnDisabled,
            ]}
            onPress={() => handleSendFriendRequest(item.visitor_id)}
            disabled={
              processingId === item.visitor_id || item.has_sent_friend_request
            }
          >
            {processingId === item.visitor_id ? (
              <ActivityIndicator size="small" color="#0856d6" />
            ) : (
              <>
                <UserPlus
                  size={16}
                  color={item.has_sent_friend_request ? '#94a3b8' : '#0856d6'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.addFriendText,
                    item.has_sent_friend_request &&
                      styles.addFriendTextDisabled,
                  ]}
                >
                  {item.has_sent_friend_request ? 'Enviado' : 'Adicionar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.content}>
        <Text style={styles.title}>Visitas</Text>

        {/* Filtros de Tempo */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              timeFilter === 'all' && styles.filterActive,
            ]}
            onPress={() => setTimeFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === 'all' && styles.filterTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              timeFilter === 'today' && styles.filterActive,
            ]}
            onPress={() => setTimeFilter('today')}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === 'today' && styles.filterTextActive,
              ]}
            >
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              timeFilter === 'week' && styles.filterActive,
            ]}
            onPress={() => setTimeFilter('week')}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === 'week' && styles.filterTextActive,
              ]}
            >
              Essa semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              timeFilter === 'month' && styles.filterActive,
            ]}
            onPress={() => setTimeFilter('month')}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === 'month' && styles.filterTextActive,
              ]}
            >
              Esse mês
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0856d6" />
          </View>
        ) : visits.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Nenhuma visita neste período</Text>
          </View>
        ) : (
          <FlatList
            data={visits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVisitItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <BottomNav active="visits" />
    </SafeAreaView>
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
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterActive: {
    backgroundColor: '#0856d6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
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
  visitCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  visitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0856d6',
  },
  visitDetails: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: '#64748b',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  addFriendBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0856d6',
  },
  addFriendTextDisabled: {
    color: '#94a3b8',
  },
  profileBtn: {
    padding: 8,
  },
});
