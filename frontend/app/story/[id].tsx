import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Send,
  Eye,
  Pause,
  Play,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375, height: typeof window !== 'undefined' ? window.innerHeight : 812 };
  }
  return Dimensions.get('window');
};
const { width, height } = getDimensions();

// Mock data para stories
const MOCK_STORIES = [
  {
    id: '1',
    author: {
      name: 'Alice Martins',
      username: '@alice.martins',
      avatar: 'https://i.pravatar.cc/160?img=21',
      isVerified: true,
      isPremium: true,
    },
    image: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1200&q=80',
    caption: 'Explorando novas referências para o próximo projeto! ✨',
    postedAt: 'há 1h',
    views: 2340,
    likes: 456,
    comments: 89,
    isLiked: false,
  },
  {
    id: '2',
    author: {
      name: 'Diego Andrade',
      username: '@diego.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      isVerified: true,
      isPremium: false,
    },
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Lançamos a nova feature hoje! 🚀',
    postedAt: 'há 2h',
    views: 5670,
    likes: 1234,
    comments: 234,
    isLiked: false,
  },
];

const MOCK_COMMENTS = [
  {
    id: '1',
    author: 'Carla Sousa',
    username: '@carla.design',
    avatar: 'https://i.pravatar.cc/160?img=48',
    text: 'Ficou incrível! Parabéns! 🎉',
    timestamp: 'há 30min',
    likes: 45,
  },
  {
    id: '2',
    author: 'Lucas Ferreira',
    username: '@lucas.code',
    avatar: 'https://i.pravatar.cc/160?img=35',
    text: 'Que trabalho incrível! Como foi o processo?',
    timestamp: 'há 20min',
    likes: 23,
  },
];

const MOCK_USER = {
  name: 'Você',
  avatar: 'https://i.pravatar.cc/160?img=1',
};

const ProgressBar = ({ segments, currentIndex }: any) => {
  return (
    <View style={styles.progressContainer}>
      {segments.map((_: any, index: number) => (
        <View
          key={index}
          style={[
            styles.progressBar,
            {
              backgroundColor: index < currentIndex ? '#ffffff' : 'rgba(255,255,255,0.3)',
            },
          ]}
        />
      ))}
    </View>
  );
};

export default function StoryView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const story = MOCK_STORIES[currentStoryIndex];
  const segments = [story.image]; // Mock com 1 segmento

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStoryIndex, currentSegmentIndex]);

  const handleNextStory = () => {
    if (currentStoryIndex < MOCK_STORIES.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentSegmentIndex(0);
      opacityAnim.setValue(0);
    } else {
      router.back();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setCurrentSegmentIndex(0);
      opacityAnim.setValue(0);
    }
  };

  const handleNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      opacityAnim.setValue(0);
    } else {
      handleNextStory();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.authorInfo}>
          <Image source={{ uri: story.author.avatar }} style={styles.headerAvatar} />
          <View>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorNameHeader}>{story.author.name}</Text>
              {story.author.isVerified && (
                <View style={styles.verifiedBadgeSmall}>
                  <Text style={styles.verifiedTextSmall}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.postedAt}>{story.postedAt}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerBtn}>
          <MoreVertical size={24} color="#ffffff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Progress Bars */}
      <ProgressBar segments={segments} currentIndex={currentSegmentIndex} />

      {/* Main Story Area */}
      <View
        style={styles.storyArea}
        onTouchEnd={(evt) => {
          const tapX = evt.nativeEvent.locationX;
          if (tapX < width / 3) {
            handlePrevStory();
          } else if (tapX > (width * 2) / 3) {
            handleNextSegment();
          } else {
            setIsPaused(!isPaused);
          }
        }}
      >
        <Animated.Image
          source={{ uri: segments[currentSegmentIndex] }}
          style={[styles.storyImage, { opacity: opacityAnim }]}
          resizeMode="cover"
        />

        {/* Overlay with gradient */}
        <View style={styles.storyOverlay} />

        {/* Caption */}
        {story.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{story.caption}</Text>
          </View>
        )}

        {/* Play/Pause Indicator */}
        {isPaused && (
          <View style={styles.pauseIndicator}>
            <Play size={32} color="#ffffff" fill="#ffffff" />
          </View>
        )}

        {/* Navigation Hints */}
        <View style={styles.navigationHints}>
          <View style={styles.hint}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.hintText}>Anterior</Text>
          </View>
          <View style={styles.hint}>
            <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.hintText}>Próximo</Text>
          </View>
        </View>
      </View>

      {/* Actions Footer */}
      <View style={styles.footer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Eye size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.statText}>{story.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.statText}>{story.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.statText}>{story.comments}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setLiked(!liked)}
          >
            <Heart
              size={20}
              color={liked ? '#ff1744' : '#ffffff'}
              fill={liked ? '#ff1744' : 'none'}
              strokeWidth={2}
            />
            <Text style={styles.actionLabel}>{liked ? 'Curtido' : 'Curtir'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowComments(!showComments)}
          >
            <MessageCircle size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.actionLabel}>Comentar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Share2 size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.actionLabel}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      {showComments && (
        <View style={styles.commentsModal}>
          {/* Header */}
          <View style={styles.commentsModalHeader}>
            <Text style={styles.commentsModalTitle}>Comentários</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <ChevronLeft size={24} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={MOCK_COMMENTS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{item.author}</Text>
                    <Text style={styles.commentTime}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Heart size={14} color="#64748b" strokeWidth={2} />
                      <Text style={styles.commentActionText}>{item.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <MessageCircle size={14} color="#64748b" strokeWidth={2} />
                      <Text style={styles.commentActionText}>Responder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View style={styles.commentInputContainer}>
            <Image source={{ uri: MOCK_USER.avatar }} style={styles.inputAvatar} />
            <View style={styles.commentInputWrapper}>
              <Text style={styles.commentInputPlaceholder}>
                {comment || 'Adicionar um comentário...'}
              </Text>
            </View>
            <TouchableOpacity style={styles.sendCommentBtn}>
              <Send size={18} color="#3b82f6" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
  },
  headerBtn: {
    padding: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorNameHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  verifiedBadgeSmall: {
    backgroundColor: '#3b82f6',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTextSmall: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  postedAt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  storyArea: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  caption: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
    fontWeight: '500',
  },
  pauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationHints: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  commentsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.7,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentText: {
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 6,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  commentInputPlaceholder: {
    fontSize: 13,
    color: '#94a3b8',
  },
  sendCommentBtn: {
    padding: 8,
  },
});
