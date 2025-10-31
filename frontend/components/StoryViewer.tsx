import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Image,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatusSuccess } from 'expo-av';
import { X, Heart, Send, MoreVertical, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type StorySegment = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  durationMs?: number;
};

export type StoryUser = {
  name: string;
  avatar: string;
  online?: boolean;
  timestamp?: string;
};

export type StoryViewerProps = {
  visible?: boolean;
  user: StoryUser;
  segments: StorySegment[];
  onClose: () => void;
  mode?: 'modal' | 'inline';
};

export default function StoryViewer({
  visible = false,
  user,
  segments,
  onClose,
  mode = 'modal',
}: StoryViewerProps) {
  const currentProgressRef = useRef(0);
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const videoRef = useRef<Video | null>(null);
  const [isPaused, setPaused] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [isLiked, setLiked] = useState(false);
  const current = useMemo(() => segments[index], [segments, index]);
  const progress = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Controle de animação
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const goNext = useCallback(() => {
    if (index < segments.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, segments.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const toggleLike = useCallback(() => {
    setLiked(!isLiked);
    Animated.sequence([
      Animated.spring(likeScale, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
      }),
    ]).start();
  }, [isLiked, likeScale]);

  // Pausar story
  const handlePressIn = useCallback(() => {
    setPaused(true);

    // Pausar animação de progresso
    if (progressAnimRef.current) {
      progressAnimRef.current.stop();
    }

    // Pausar vídeo
    if (current?.type === 'video' && videoRef.current) {
      videoRef.current.pauseAsync().catch(() => { });
    }
  }, [current?.type]);

  // Retomar story
  const handlePressOut = useCallback(() => {
    setPaused(false);

    // Retomar vídeo
    if (current?.type === 'video' && videoRef.current) {
      videoRef.current.playAsync().catch(() => { });
    } else if (current?.type === 'image') {
      // Retomar animação de progresso para imagem
      const dur = Math.max(1500, current.durationMs ?? 5000);
      const currentProgress = currentProgressRef.current || 0;
      const remainingDuration = dur * (1 - currentProgress);

      if (remainingDuration > 0) {
        const anim = Animated.timing(progress, {
          toValue: 1,
          duration: remainingDuration,
          easing: Easing.linear,
          useNativeDriver: false,
        });
        progressAnimRef.current = anim;
        anim.start(({ finished }) => {
          if (finished) goNext();
        });
      }
    }
  }, [current, progress, goNext]);

  // Image timer auto-advance + progress animation
  useEffect(() => {
    if (mode === 'modal' && !visible) return;
    if (!current) return;
    if (isPaused) return; // Não iniciar se estiver pausado

    progress.stopAnimation();
    progress.setValue(0);

    if (current.type === 'image') {
      const dur = Math.max(1500, current.durationMs ?? 5000);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: dur,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      progressAnimRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) goNext();
      });
      return () => {
        progress.stopAnimation();
        progressAnimRef.current = null;
      };
    }
  }, [mode, visible, current, goNext, progress, isPaused, index]);

  // Reset/pause when segment changes
  useEffect(() => {
    setPaused(false);
    setLiked(false);
    likeScale.setValue(1);
    progressAnimRef.current = null;
    if (videoRef.current) {
      videoRef.current.stopAsync().catch(() => { });
      videoRef.current.setPositionAsync(0).catch(() => { });
    }
  }, [index, likeScale]);

  const progressItems = useMemo(
    () => segments.map((_, i) => ({ filled: i < index, active: i === index })),
    [segments, index],
  );

  const Body = (
    <View style={[styles.container]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Media full-bleed */}
      <View style={styles.mediaWrapperFull}>
        {current?.type === 'image' ? (
          <Image
            source={{ uri: current.uri }}
            resizeMode="cover"
            style={styles.media}
          />
        ) : (
          <Video
            ref={(r) => (videoRef.current = r)}
            style={styles.media}
            source={{ uri: current?.uri || '' }}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay={!isPaused}
            isMuted={isMuted}
            onPlaybackStatusUpdate={(s) => {
              const st = s as AVPlaybackStatusSuccess;
              if (!('isLoaded' in st) || !st.isLoaded) return;
              if (st.durationMillis && st.positionMillis >= 0) {
                const ratio = Math.min(
                  1,
                  st.positionMillis / Math.max(st.durationMillis, 1),
                );
                currentProgressRef.current = ratio;
                progress.setValue(ratio);
              }
              if (st.didJustFinish) {
                goNext();
              }
            }}
          />
        )}
      </View>

      {/* Tap zones com pause */}
      <Pressable
        style={styles.leftZone}
        onPress={goPrev}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />

      <Pressable
        style={styles.centerZone}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />

      <Pressable
        style={styles.rightZone}
        onPress={goNext}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Top overlay: progress + header */}
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        {/* Progress Bars */}
        <View style={styles.progressRow}>
          {progressItems.map((p, i) => (
            <View key={i} style={styles.progressTrack}>
              <View style={styles.progressTrackBg} />
              {p.filled ? (
                <View style={styles.progressFilled} />
              ) : p.active ? (
                <Animated.View
                  style={[
                    styles.progressActive,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        {/* Header */}
        <Animated.View style={[styles.headerRow, { opacity: headerOpacity }]}>
          <View style={styles.userSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              {user.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.timestamp && (
                <Text style={styles.timestamp}>{user.timestamp}</Text>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            {current?.type === 'video' && (
              <Pressable
                onPress={() => setMuted(!isMuted)}
                style={styles.actionBtn}
                hitSlop={12}
              >
                {isMuted ? (
                  <VolumeX size={22} color="#ffffff" strokeWidth={2.5} />
                ) : (
                  <Volume2 size={22} color="#ffffff" strokeWidth={2.5} />
                )}
              </Pressable>
            )}

            <Pressable onPress={onClose} hitSlop={12} style={styles.actionBtn}>
              <X size={24} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Bottom Actions */}
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <View style={styles.bottomActions}>
          <View style={styles.replySection}>
            <View style={styles.replyInput}>
              <Text style={styles.replyPlaceholder}>Responder...</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={toggleLike}
              style={styles.iconButton}
              hitSlop={12}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Heart
                  size={26}
                  color="#ffffff"
                  fill={isLiked ? '#ef4444' : 'transparent'}
                  strokeWidth={2.5}
                />
              </Animated.View>
            </Pressable>

            <Pressable style={styles.iconButton} hitSlop={12}>
              <Send size={26} color="#ffffff" strokeWidth={2.5} />
            </Pressable>

            <Pressable style={styles.iconButton} hitSlop={12}>
              <MoreVertical size={26} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  if (mode === 'inline') return Body;

  return (
    <Modal
      visible={!!visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.modalSizer, { width, height }]}>{Body}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSizer: { flex: 1 },
  container: { flex: 1, backgroundColor: '#000000' },
  mediaWrapperFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  media: { width: '100%', height: '100%' },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  safeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressTrackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFilled: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  progressActive: {
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#000000',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replySection: {
    flex: 1,
  },
  replyInput: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  replyPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '30%',
    zIndex: 0,
  },
  centerZone: {
    position: 'absolute',
    top: 0,
    left: '30%',
    bottom: 0,
    width: '40%',
    zIndex: 0,
  },
  rightZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '30%',
    zIndex: 0,
  },
});
