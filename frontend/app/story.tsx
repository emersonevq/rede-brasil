import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Plus,
  Clock,
  ChevronRight,
  Zap,
  Heart,
} from 'lucide-react-native';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import StoryViewer, { StorySegment, StoryUser } from '../components/StoryViewer';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375, height: typeof window !== 'undefined' ? window.innerHeight : 812 };
  }
  return Dimensions.get('window');
};
const { width: screenWidth, height: screenHeight } = getDimensions();

export type StoryItem = {
  id: string;
  user: StoryUser;
  postedAt: string;
  postedAtHours: number;
  caption: string;
  cover: string;
  views: number;
  likes: number;
  segments: StorySegment[];
  category?: string;
  isPremium?: boolean;
};

const STORIES: StoryItem[] = [
  {
    id: 'alice',
    user: {
      name: 'Alice Martins',
      avatar: 'https://i.pravatar.cc/160?img=21',
      online: true,
    },
    postedAt: 'há 1h',
    postedAtHours: 1,
    caption: 'Explorando novas referências para o próximo produto. ✨',
    cover: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1200&q=80',
    views: 234,
    likes: 89,
    category: 'Design',
    isPremium: true,
    segments: [
      {
        id: 'a1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'diego',
    user: {
      name: 'Diego Andrade',
      avatar: 'https://i.pravatar.cc/160?img=12',
      online: false,
    },
    postedAt: 'há 2h',
    postedAtHours: 2,
    caption: 'Lançamos hoje nossa nova funcionalidade! 🚀',
    cover: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
    views: 567,
    likes: 156,
    category: 'Desenvolvimento',
    segments: [
      {
        id: 'd1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4000,
      },
    ],
  },
  {
    id: 'carla',
    user: {
      name: 'Carla Sousa',
      avatar: 'https://i.pravatar.cc/160?img=48',
      online: true,
    },
    postedAt: 'há 3h',
    postedAtHours: 3,
    caption: 'Workshop de pesquisa na comunidade. 🎤',
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    views: 892,
    likes: 234,
    category: 'Comunidade',
    isPremium: true,
    segments: [
      {
        id: 'c1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'lucas',
    user: {
      name: 'Lucas Ferreira',
      avatar: 'https://i.pravatar.cc/160?img=35',
      online: true,
    },
    postedAt: 'há 30min',
    postedAtHours: 0.5,
    caption: 'Desenvolvendo a nova versão do app. Ficou incrível! 💻',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    views: 445,
    likes: 167,
    category: 'Desenvolvimento',
    segments: [
      {
        id: 'l1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'nina',
    user: {
      name: 'Nina Oliveira',
      avatar: 'https://i.pravatar.cc/160?img=32',
      online: true,
    },
    postedAt: 'há 45min',
    postedAtHours: 0.75,
    caption: 'Novo projeto saindo do forno 🔥 Design minimalista é lindo',
    cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    views: 623,
    likes: 201,
    category: 'Design',
    isPremium: true,
    segments: [
      {
        id: 'n1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'rafael',
    user: {
      name: 'Rafael Costa',
      avatar: 'https://i.pravatar.cc/160?img=42',
      online: false,
    },
    postedAt: 'há 2h',
    postedAtHours: 2,
    caption: 'Conferência de tech foi sensacional! Muita inspiração 💡',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    views: 334,
    likes: 112,
    category: 'Evento',
    segments: [
      {
        id: 'r1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'marina',
    user: {
      name: 'Marina Silva',
      avatar: 'https://i.pravatar.cc/160?img=29',
      online: true,
    },
    postedAt: 'há 1h',
    postedAtHours: 1,
    caption: 'Dia de brainstorm criativo com a equipe! 🎨✨',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    views: 556,
    likes: 198,
    category: 'Trabalho',
    segments: [
      {
        id: 'm1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'bruno',
    user: {
      name: 'Bruno Oliveira',
      avatar: 'https://i.pravatar.cc/160?img=38',
      online: true,
    },
    postedAt: 'há 3h',
    postedAtHours: 3,
    caption: 'Primeiro dia como product manager! Ansioso demais 🚀',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    views: 789,
    likes: 267,
    category: 'Carreira',
    isPremium: true,
    segments: [
      {
        id: 'b1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
  {
    id: 'sophia',
    user: {
      name: 'Sophia Mendes',
      avatar: 'https://i.pravatar.cc/160?img=25',
      online: false,
    },
    postedAt: 'há 4h',
    postedAtHours: 4,
    caption: 'Projeto finalizado com sucesso! Time incrível 💪',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    views: 421,
    likes: 134,
    category: 'Projeto',
    segments: [
      {
        id: 's1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
        durationMs: 4500,
      },
    ],
  },
];

const StoryCard = ({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.95}
    onPress={onPress}
    style={styles.storyCard}
  >
    <Image
      source={{ uri: item.cover }}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />

    <View style={styles.progressContainer}>
      {item.segments.map((segment, index) => (
        <View key={segment.id} style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: index === 0 ? '100%' : '0%' }
            ]}
          />
        </View>
      ))}
    </View>

    <View style={styles.storyOverlay} />

    <View style={styles.storyHeader}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.storyAvatar}
        />
        {item.user.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.storyName}>{item.user.name}</Text>
          {item.isPremium && (
            <Text style={styles.premiumBadge}>PRO</Text>
          )}
        </View>
        <View style={styles.timeRow}>
          <Clock size={13} color="#e2e8f0" strokeWidth={2} />
          <Text style={styles.timeText}>{item.postedAt}</Text>
        </View>
      </View>
    </View>

    <View style={styles.storyFooter}>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>

      <Text style={styles.storyCaption} numberOfLines={3}>
        {item.caption}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Eye size={14} color="#e2e8f0" strokeWidth={2} />
          <Text style={styles.statText}>{item.views}</Text>
        </View>
        <View style={styles.statItem}>
          <Heart size={14} color="#e2e8f0" strokeWidth={2} />
          <Text style={styles.statText}>{item.likes}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const CompactPreview = ({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={styles.compactPreview}
  >
    <Image
      source={{ uri: item.cover }}
      style={styles.compactImage}
      resizeMode="cover"
    />

    <View style={styles.compactOverlay} />

    {item.isPremium && (
      <View style={styles.premiumCorner}>
        <Text style={styles.premiumCornerText}>PRO</Text>
      </View>
    )}

    <View style={styles.compactHeader}>
      <View style={styles.compactAvatarContainer}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.compactAvatar}
        />
        {item.user.online && <View style={styles.compactOnlineDot} />}
      </View>
      <View style={styles.compactInfo}>
        <View style={styles.compactNameRow}>
          <Text style={styles.compactName} numberOfLines={1}>{item.user.name}</Text>
        </View>
        <View style={styles.compactTimeRow}>
          <Clock size={11} color="#e2e8f0" strokeWidth={2} />
          <Text style={styles.compactTime}>{item.postedAt}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const Eye = (props) => (
  <Heart {...props} />
);

export default function StoryScreen() {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState<StoryItem | null>(null);
  const [filter, setFilter] = useState('all');
  const listRef = useRef<FlatList<StoryItem>>(null);
  const router = require('expo-router').useRouter();

  const open = useCallback((s: StoryItem) => setActive(s), []);
  const close = useCallback(() => setActive(null), []);

  const { subscribeStories, getStories } = require('../store/stories');
  const [created, setCreated] = useState<any[]>(getStories());

  React.useEffect(() => {
    const unsub = subscribeStories((items: any[]) => setCreated(items));
    return () => unsub();
  }, []);

  const allStories = useMemo(() => {
    return [...created, ...STORIES];
  }, [created]);

  const filteredStories = useMemo(() => {
    if (filter === 'recent') {
      return allStories.filter(story => story.postedAtHours <= 5);
    }
    return allStories;
  }, [filter, allStories]);

  const renderItem = useCallback(
    ({ item }: { item: StoryItem }) => (
      <View style={styles.storyItemWrapper}>
        <StoryCard
          item={item}
          onPress={() => open(item)}
        />
      </View>
    ),
    [open]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.listTitle}>Stories</Text>
            <Text style={styles.listSubtitle}>
              Descubra histórias da comunidade
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'recent' && styles.filterChipActive]}
            onPress={() => setFilter('recent')}
          >
            <Zap size={14} color={filter === 'recent' ? '#ffffff' : '#64748b'} strokeWidth={2} />
            <Text style={[styles.filterChipText, filter === 'recent' && styles.filterChipTextActive]}>
              Recentes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Criar Story */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { router.push('/story/create'); }}
          style={styles.addCard}
        >
          <View style={styles.addCircle}>
            <Plus size={24} color="#3b82f6" strokeWidth={2.5} />
          </View>
          <View style={styles.addContent}>
            <Text style={styles.addTitle}>Criar story</Text>
            <Text style={styles.addSubtitle}>
              Compartilhe seu momento
            </Text>
          </View>
          <ChevronRight size={20} color="#64748b" strokeWidth={2} />
        </TouchableOpacity>

        {/* Aviso de Scroll */}
        <View style={styles.scrollHint}>
          <View style={styles.scrollHintContent}>
            <ChevronRight size={16} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.scrollHintText}>Arraste para o lado para ver todos os stories</Text>
          </View>
        </View>

        {/* Preview de 3 Stories */}
        <View style={styles.previewsContainer}>
          <Text style={styles.previewsTitle}>Em destaque</Text>
          <View style={styles.previewsList}>
            {filteredStories.slice(0, 3).map(story => (
              <CompactPreview
                key={story.id}
                item={story}
                onPress={() => open(story)}
              />
            ))}
          </View>
        </View>
      </View>
    ),
    [filter, filteredStories, open]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TopBar />

      <FlatList
        ref={listRef}
        data={filteredStories}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <BottomNav active="story" />

      {active && (
        <StoryViewer
          visible
          user={active.user}
          segments={active.segments}
          onClose={close}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingBottom: 0,
  },
  listHeader: {
    width: screenWidth,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  listSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  addContent: {
    flex: 1,
  },
  addTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  addSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  scrollHint: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  scrollHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  previewsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  previewsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewsList: {
    gap: 12,
  },
  compactPreview: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  premiumCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#eab308',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 5,
  },
  premiumCornerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  compactHeader: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 10,
  },
  compactAvatarContainer: {
    position: 'relative',
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  compactOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  compactInfo: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  compactTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  compactTime: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  storyItemWrapper: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    width: screenWidth - 32,
    aspectRatio: 9 / 16,
    maxHeight: 750,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  progressContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.25,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#ffffff',
    height: '100%',
    borderRadius: 1.25,
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 30, 0.15)',
  },
  storyHeader: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
  },
  avatarContainer: {
    position: 'relative',
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  premiumBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  storyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  storyCaption: {
    fontSize: 16,
    color: '#f8fafc',
    lineHeight: 24,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '600',
  },
});
