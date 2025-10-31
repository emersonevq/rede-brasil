import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  MoreVertical,
  Send,
  Reply,
  Eye,
} from 'lucide-react-native';
import type { ApiPost } from '../../utils/api';
import { absoluteUrl } from '../../utils/api';
import MediaViewer from '../../components/MediaViewer';
import { useImageDimensions } from '../../hooks/useImageDimensions';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

// Reações disponíveis
const REACTIONS = [
  { id: 'amei', emoji: '❤️', label: 'Amei', color: '#ef4444' },
  { id: 'uau', emoji: '😮', label: 'Uau', color: '#f59e0b' },
  { id: 'nojinho', emoji: '🤮', label: 'Nojinho', color: '#8b5cf6' },
  { id: 'triste', emoji: '😢', label: 'Triste', color: '#3b82f6' },
  { id: 'apaixonado', emoji: '😍', label: 'Apaixonado', color: '#ec4899' },
];

export default function PostDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postMediaUrl, setPostMediaUrl] = useState<string | null>(null);

  const mediaUrl = React.useMemo(
    () => absoluteUrl(post?.media_url),
    [post?.media_url],
  );
  const avatarUrl = React.useMemo(
    () => absoluteUrl(post?.user_profile_photo),
    [post?.user_profile_photo],
  );
  const { dimensions: imageDimensions } = useImageDimensions(mediaUrl);

  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);

  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [reactionCounts, setReactionCounts] = useState({
    amei: 0,
    uau: 0,
    nojinho: 0,
    triste: 0,
    apaixonado: 0,
  });

  // Picker de reações
  const [isPicking, setIsPicking] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pickerAnim = useRef(new Animated.Value(0)).current;
  const menuRef = useRef<View>(null);
  const [menuRect, setMenuRect] = useState({ x: 0, y: 0, width: 1, height: 1 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const api = await import('../../utils/api');
        const data = await api.getPostById(id);
        if (!mounted) return;

        const BASE_URL =
          (typeof process !== 'undefined' &&
            (process as any).env &&
            (process as any).env.EXPO_PUBLIC_API_URL) ||
          'http://localhost:8000';
        const abs = (u?: string | null) =>
          u ? (u.startsWith('http') ? u : `${BASE_URL}${u}`) : undefined;

        setPost(data);
        setPostMediaUrl(abs(data.media_url) || null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Falha ao carregar publicação');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const openPicker = () => {
    setIsPicking(true);
    Animated.timing(pickerAnim, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        // @ts-ignore
        menuRef.current?.measureInWindow?.(
          (x: number, y: number, w: number, h: number) => {
            setMenuRect({ x, y, width: w, height: h });
          },
        );
      }, 0);
    });
  };

  const closePicker = () => {
    Animated.timing(pickerAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsPicking(false);
      setHovered(null);
    });
  };

  const handleMoveOnPicker = (pageX: number, pageY: number) => {
    const insideX = pageX - menuRect.x;
    const insideY = pageY - menuRect.y;
    if (
      insideX >= 0 &&
      insideX <= menuRect.width &&
      insideY >= -24 &&
      insideY <= menuRect.height + 24
    ) {
      const slot = menuRect.width / REACTIONS.length;
      const idx = Math.max(
        0,
        Math.min(REACTIONS.length - 1, Math.floor(insideX / slot)),
      );
      setHovered(REACTIONS[idx].id);
    } else {
      setHovered(null);
    }
  };

  const applyReaction = (reactionId: string | null) => {
    if (!reactionId) {
      closePicker();
      return;
    }
    if (userReaction === reactionId) {
      setUserReaction(null);
      setReactionCounts((prev) => ({
        ...prev,
        [reactionId]: prev[reactionId as keyof typeof prev] - 1,
      }));
    } else {
      if (userReaction) {
        setReactionCounts((prev) => ({
          ...prev,
          [userReaction]: prev[userReaction as keyof typeof prev] - 1,
        }));
      }
      setUserReaction(reactionId);
      setReactionCounts((prev) => ({
        ...prev,
        [reactionId]: prev[reactionId as keyof typeof prev] + 1,
      }));
    }
    closePicker();
  };

  const toggleAmeiQuick = () =>
    applyReaction(userReaction === 'amei' ? 'amei' : 'amei');

  const handleAddComment = () => {
    const t = comment.trim();
    if (!t) return;
    const newComment = {
      id: `${Date.now()}`,
      user: 'Você',
      text: t,
      timestamp: 'agora',
    };
    setComments((prev) => [newComment, ...prev]);
    setComment('');
    setReplyingTo(null);
  };

  const totalReactions = Object.values(reactionCounts).reduce(
    (a, b) => a + b,
    0,
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.sub}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Publicação não encontrada</Text>
          <Text style={styles.sub}>{error || `ID: ${id}`}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderComment = ({ item }: any) => {
    const isReply = item.parentId !== undefined;
    const hasReplies = comments.some((c: any) => c.parentId === item.id);

    return (
      <Animated.View
        style={[styles.commentWrapper, isReply && styles.replyWrapper]}
      >
        {isReply && <View style={styles.replyLine} />}
        <View
          style={[styles.commentContainer, isReply && styles.replyContainer]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                `/profile/${String(item.user || '')
                  .replace(/\s+/g, '')
                  .toLowerCase()}`,
              )
            }
          >
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarText}>
                {String(item.user || 'V')[0]}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/profile/${String(item.user || '')
                        .replace(/\s+/g, '')
                        .toLowerCase()}`,
                    )
                  }
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push(
                        `/profile/${String(item.user || '')
                          .replace(/\s+/g, '')
                          .toLowerCase()}`,
                      )
                    }
                  >
                    <Text style={styles.commentAuthor}>{item.user}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <Text style={styles.commentMeta}>
                  {item.timestamp || 'agora'}
                </Text>
              </View>
              {!isReply && (
                <TouchableOpacity style={styles.moreBtn}>
                  <MoreVertical size={16} color="#94a3b8" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionEmoji}>👍</Text>
                <Text style={styles.actionBtnText}>Reagir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setReplyingTo(item.id)}
              >
                <Reply size={14} color="#64748b" strokeWidth={2} />
                <Text style={styles.actionBtnText}>Responder</Text>
              </TouchableOpacity>
              {hasReplies && (
                <TouchableOpacity style={styles.viewReplies}>
                  <Text style={styles.viewRepliesText}>
                    Ver respostas (
                    {comments.filter((c: any) => c.parentId === item.id).length}
                    )
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity>
            <MoreVertical size={24} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments.filter((c: any) => !c.parentId)}
          keyExtractor={(c) => c.id}
          renderItem={renderComment}
          ListHeaderComponent={
            <View>
              {/* Post Preview */}
              <View style={styles.postPreview}>
                <View style={styles.authorRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(
                        `/profile/${String(post.user_name || '')
                          .replace(/\s+/g, '')
                          .toLowerCase()}`,
                      )
                    }
                  >
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.authorAvatarPlaceholder}
                      />
                    ) : (
                      <View style={styles.authorAvatarPlaceholder}>
                        <Text style={styles.authorAvatarText}>
                          {post.user_name?.charAt(0) || 'U'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.authorInfo}>
                    <View style={styles.authorNameRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push(
                            `/profile/${String(post.user_name || '')
                              .replace(/\s+/g, '')
                              .toLowerCase()}`,
                          )
                        }
                      >
                        <Text style={styles.authorName}>
                          {post.user_name || 'Anônimo'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.authorUsername}>
                      @
                      {(post.user_name || 'usuario')
                        .replace(/\s+/g, '')
                        .toLowerCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {mediaUrl && imageDimensions && (
                  <View style={styles.postImageContainer}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setShowMedia(true)}
                    >
                      <Image
                        source={{ uri: mediaUrl }}
                        style={[
                          styles.postImage,
                          { aspectRatio: imageDimensions.aspectRatio },
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <View style={styles.viewsBadge}>
                      <Eye size={14} color="#ffffff" strokeWidth={2} />
                      <Text style={styles.viewsText}>8.2K</Text>
                    </View>
                  </View>
                )}

                {/* Contadores de reações */}
                {totalReactions > 0 && (
                  <View style={styles.reactionsBar}>
                    <View style={styles.reactionsDisplay}>
                      {REACTIONS.map(
                        (r) =>
                          reactionCounts[r.id as keyof typeof reactionCounts] >
                            0 && (
                            <View key={r.id} style={styles.reactionBubble}>
                              <Text style={styles.reactionEmoji}>
                                {r.emoji}
                              </Text>
                              <Text style={styles.reactionCount}>
                                {
                                  reactionCounts[
                                    r.id as keyof typeof reactionCounts
                                  ]
                                }
                              </Text>
                            </View>
                          ),
                      )}
                    </View>
                    <Text style={styles.totalReactions}>{totalReactions}</Text>
                  </View>
                )}

                {/* Ações */}
                <View style={styles.actionsBar}>
                  <View style={styles.reactionsButtonContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={toggleAmeiQuick}
                      onLongPress={openPicker}
                      delayLongPress={220}
                      style={styles.reactionTrigger}
                    >
                      <Text style={styles.reactionTriggerEmoji}>
                        {userReaction === 'amei' ? '❤️' : '🤍'}
                      </Text>
                      <Text style={styles.reactionTriggerText}>Amei</Text>
                    </TouchableOpacity>
                    {isPicking && (
                      <Animated.View
                        ref={menuRef}
                        style={[
                          styles.reactionsMenu,
                          {
                            opacity: pickerAnim,
                            transform: [
                              {
                                scale: pickerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.9, 1],
                                }),
                              },
                              {
                                translateY: pickerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [10, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        {REACTIONS.map((r) => (
                          <View
                            key={r.id}
                            style={[
                              styles.reactionOption,
                              hovered === r.id && styles.reactionOptionActive,
                              hovered === r.id && {
                                transform: [{ scale: 1.12 }],
                              },
                            ]}
                          >
                            <Text style={styles.reactionOptionEmoji}>
                              {r.emoji}
                            </Text>
                            <Text style={styles.reactionOptionLabel}>
                              {r.label}
                            </Text>
                          </View>
                        ))}
                      </Animated.View>
                    )}
                  </View>

                  <TouchableOpacity style={styles.actionButtonRow}>
                    <MessageCircle size={20} color="#64748b" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Comentar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButtonRow}>
                    <Share2 size={20} color="#64748b" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Compartilhar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButtonRow}
                    onPress={() => setBookmarked(!bookmarked)}
                  >
                    <Bookmark
                      size={20}
                      color={bookmarked ? '#f59e0b' : '#64748b'}
                      fill={bookmarked ? '#f59e0b' : 'none'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        bookmarked && { color: '#f59e0b' },
                      ]}
                    >
                      Salvar
                    </Text>
                  </TouchableOpacity>
                </View>

                {isPicking && (
                  <View
                    style={styles.pickerOverlay}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderMove={(e) => {
                      handleMoveOnPicker(
                        e.nativeEvent.pageX,
                        e.nativeEvent.pageY,
                      );
                    }}
                    onResponderRelease={() => {
                      applyReaction(hovered);
                    }}
                    onResponderTerminationRequest={() => false}
                  />
                )}

                <View style={styles.divider} />

                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>Comentários</Text>
                  <View style={styles.commentsBadge}>
                    <Text style={styles.commentsBadgeText}>
                      {comments.length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}
        />

        {/* Input Bar */}
        <View style={styles.inputBarContainer}>
          <View style={styles.inputBar}>
            <View style={styles.inputAvatarPlaceholder}>
              <Text style={styles.inputAvatarText}>V</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={comment}
                onChangeText={setComment}
                placeholder={
                  replyingTo
                    ? 'Escrever uma resposta...'
                    : 'Adicionar um comentário...'
                }
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={500}
              />
              {replyingTo && (
                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  style={styles.cancelReply}
                >
                  <Text style={styles.cancelReplyText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !comment.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!comment.trim()}
            >
              <Send size={18} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {mediaUrl && (
        <MediaViewer
          visible={showMedia}
          type="image"
          uri={mediaUrl}
          onClose={() => setShowMedia(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  emptyContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { marginTop: 8, fontSize: 14, color: '#64748b' },

  postPreview: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: { color: '#0856d6', fontWeight: '800' },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  authorUsername: { fontSize: 13, color: '#64748b', marginTop: 2 },

  postContent: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  postImage: { width: '100%', backgroundColor: '#f1f5f9' },
  viewsBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewsText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  reactionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  reactionsDisplay: { flexDirection: 'row', gap: 6 },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, fontWeight: '700', color: '#475569' },
  totalReactions: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    position: 'relative',
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  reactionsButtonContainer: { position: 'relative' },
  reactionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionTriggerEmoji: { fontSize: 18 },
  reactionTriggerText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  reactionsMenu: {
    position: 'absolute',
    top: -78,
    left: -8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 100,
  },
  reactionOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reactionOptionActive: { backgroundColor: '#f0f9ff' },
  reactionOptionEmoji: { fontSize: 24 },
  reactionOptionLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },

  pickerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 99 },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentsTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  commentsBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentsBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  listContent: { paddingBottom: 120 },

  commentWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  replyWrapper: { paddingLeft: 50, marginTop: 4 },
  replyLine: {
    position: 'absolute',
    left: 35,
    top: -12,
    width: 2,
    height: 36,
    backgroundColor: '#e2e8f0',
  },

  commentContainer: { flexDirection: 'row', gap: 12 },
  replyContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#dbeafe',
  },
  commentAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#0856d6', fontWeight: '800' },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  commentContent: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  commentMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  moreBtn: { padding: 4 },
  commentText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionEmoji: { fontSize: 16 },
  actionBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  viewReplies: { marginLeft: 'auto' },
  viewRepliesText: { fontSize: 12, color: '#3b82f6', fontWeight: '700' },
  inlineReply: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  replyContent: { flex: 1 },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAuthor: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  replyMeta: { fontSize: 11, color: '#94a3b8' },
  replyText: { fontSize: 13, color: '#0f172a', lineHeight: 20 },

  inputBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 12 + (Platform.OS === 'ios' ? 20 : 0),
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputAvatarText: { color: '#0856d6', fontWeight: '800' },
  inputWrapper: { flex: 1 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 100,
  },
  cancelReply: { paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  cancelReplyText: { fontSize: 11, color: '#ef4444', fontWeight: '600' },
  sendBtn: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
});
