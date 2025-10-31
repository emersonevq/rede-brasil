import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Alert,
  PanResponder,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import BottomNav from './BottomNav';
import PostCard from './PostCard';
import TopBar from './TopBar';
import ProfilePhotoEditor from './ProfilePhotoEditor';
import CoverPhotoEditor, { CoverTransform } from './CoverPhotoEditor';
import HighlightManager, { Highlight } from './HighlightManager';
import {
  Heart,
  Home,
  MapPin,
  Briefcase,
  Users,
  ChevronRight,
  FileText,
  Edit3,
  Globe,
  Mail,
  Calendar,
  Camera,
  Plus,
  MoreVertical,
  Shield,
  Check,
  MessageCircle,
  UserPlus,
  UserCheck,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getPosts, subscribe, toggleLike } from '../store/posts';
import {
  getFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getUserFriends,
  getOrCreateDMConversation,
} from '../utils/api';
import type { UserProfile } from '../screens/Profile/Data';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

export type Props = {
  profile: UserProfile;
  editable: boolean;
  posts?: any[];
  userId?: number | null;
};

export default function UserProfileView({
  profile,
  editable,
  posts: externalPosts,
  userId,
}: Props) {
  const router = useRouter();
  const [userData, setUserData] = useState(profile);
  const p = userData;
  const [tab, setTab] = useState<'posts' | 'about' | 'photos'>('posts');
  const [posts, setPosts] = useState(getPosts());
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [coverEditorVisible, setCoverEditorVisible] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState(p.cover);
  const [editingCoverPhoto, setEditingCoverPhoto] = useState<string | null>(
    null,
  );
  const [coverTransform, setCoverTransform] = useState<CoverTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [profilePhoto, setProfilePhoto] = useState(p.avatar);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const hasStory = Boolean((p as any).hasStory);
  const prevCoverTransformRef = useRef<CoverTransform>(coverTransform);
  const prevCoverPhotoRef = useRef<string>(coverPhoto);

  const handleSendInvite = async () => {
    try {
      if (!userId) return;
      const res = await sendFriendRequest(userId);
      setFriendStatus({ status: 'outgoing_pending', requestId: res.id });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao enviar convite');
    }
  };

  const handleCancelInvite = async () => {
    try {
      if (!friendStatus.requestId) return;
      await cancelFriendRequest(friendStatus.requestId);
      setFriendStatus({ status: 'none', requestId: null });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao cancelar convite');
    }
  };

  const handleAcceptInvite = async () => {
    try {
      if (!friendStatus.requestId || !userId) return;
      await acceptFriendRequest(friendStatus.requestId);
      setFriendStatus({ status: 'friends', requestId: null });
      setUserData((prev) => ({
        ...prev,
        connectionsCount: (prev.connectionsCount || 0) + 1,
      }));
      try {
        const friends = await getUserFriends(userId);
        setUserData((prev) => ({
          ...prev,
          recentFriends: friends.map((f) => ({
            id: String(f.id),
            name: f.name,
            avatar: f.avatar || '',
          })),
        }));
      } catch {}
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao aceitar convite');
    }
  };

  const handleDeclineInvite = async () => {
    try {
      if (!friendStatus.requestId) return;
      await declineFriendRequest(friendStatus.requestId);
      setFriendStatus({ status: 'none', requestId: null });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao recusar convite');
    }
  };

  const handleMessage = async () => {
    try {
      if (!userId) return;
      const conversation = await getOrCreateDMConversation(userId);
      router.push(`/chat/${conversation.id}`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao abrir conversa');
    }
  };

  const [friendStatus, setFriendStatus] = useState<{
    status: 'none' | 'outgoing_pending' | 'incoming_pending' | 'friends';
    requestId?: number | null;
  }>({ status: 'none', requestId: null });
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (editable) return;
        if (!userId) return;
        const data = await getFriendStatus(userId);
        if (!mounted) return;
        setFriendStatus({
          status: data.status,
          requestId: (data as any).request_id ?? null,
        });
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [editable, userId]);

  const AvatarPlaceholder = () => (
    <View
      style={{
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          backgroundColor: '#cbd5e1',
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            backgroundColor: '#94a3b8',
            borderRadius: 50,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          width: 50,
          height: 30,
          backgroundColor: '#94a3b8',
          borderRadius: 4,
        }}
      />
    </View>
  );

  const CoverPlaceholder = () => (
    <View
      style={{
        width: '100%',
        height: 200,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            backgroundColor: '#cbd5e1',
            borderRadius: 8,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#94a3b8',
              borderRadius: 4,
            }}
          />
        </View>
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
          Adicione uma capa
        </Text>
      </View>
    </View>
  );

  const COVER_HEIGHT = 200;

  const gestureState = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialOffsetX: 0,
    initialOffsetY: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isPinching: false,
  }).current;

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => coverEditorVisible,
        onMoveShouldSetPanResponder: () => coverEditorVisible,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches as any[];
          if (touches.length === 2) {
            gestureState.isPinching = true;
            gestureState.initialDistance = getDistance(touches);
            gestureState.initialScale = coverTransform.scale;
          } else if (touches.length === 1) {
            gestureState.isPinching = false;
            gestureState.lastTouchX = touches[0].pageX;
            gestureState.lastTouchY = touches[0].pageY;
            gestureState.initialOffsetX = coverTransform.offsetX;
            gestureState.initialOffsetY = coverTransform.offsetY;
          }
        },
        onPanResponderMove: (evt) => {
          if (!coverEditorVisible) return;
          const touches = evt.nativeEvent.touches as any[];
          if (touches.length === 2) {
            if (!gestureState.isPinching) {
              gestureState.isPinching = true;
              gestureState.initialDistance = getDistance(touches);
              gestureState.initialScale = coverTransform.scale;
            }
            const currentDistance = getDistance(touches);
            const scaleFactor = currentDistance / gestureState.initialDistance;
            const newScale = Math.max(
              1,
              Math.min(3, gestureState.initialScale * scaleFactor),
            );
            setCoverTransform((prev) => ({ ...prev, scale: newScale }));
            if (newScale <= 1) {
              setCoverTransform((prev) => ({
                ...prev,
                offsetX: 0,
                offsetY: 0,
              }));
            }
          } else if (touches.length === 1 && !gestureState.isPinching) {
            if (coverTransform.scale > 1) {
              const currentX = touches[0].pageX;
              const currentY = touches[0].pageY;
              const deltaX = currentX - gestureState.lastTouchX;
              const deltaY = currentY - gestureState.lastTouchY;
              const maxOffsetX = (width * (coverTransform.scale - 1)) / 2;
              const maxOffsetY =
                (COVER_HEIGHT * (coverTransform.scale - 1)) / 2;
              const newOffsetX = Math.max(
                -maxOffsetX,
                Math.min(maxOffsetX, gestureState.initialOffsetX + deltaX),
              );
              const newOffsetY = Math.max(
                -maxOffsetY,
                Math.min(maxOffsetY, gestureState.initialOffsetY + deltaY),
              );
              setCoverTransform((prev) => ({
                ...prev,
                offsetX: newOffsetX,
                offsetY: newOffsetY,
              }));
            }
          }
        },
        onPanResponderRelease: () => {
          gestureState.isPinching = false;
          gestureState.initialDistance = 0;
        },
      }),
    [
      coverEditorVisible,
      coverTransform.scale,
      coverTransform.offsetX,
      coverTransform.offsetY,
    ],
  );

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [highlightManagerVisible, setHighlightManagerVisible] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<
    Highlight | undefined
  >();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = async () => {
    try {
      if (!editable) return;
      const api = await import('../utils/api');
      const token = api.getToken();
      if (!token) return;
      const BASE_URL =
        (typeof process !== 'undefined' &&
          (process as any).env &&
          (process as any).env.EXPO_PUBLIC_API_URL) ||
        'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        const profilePhotoUrl = user.profile_photo
          ? user.profile_photo.startsWith('http')
            ? user.profile_photo
            : `${BASE_URL}${user.profile_photo}`
          : p.avatar;
        const coverPhotoUrl = user.cover_photo
          ? user.cover_photo.startsWith('http')
            ? user.cover_photo
            : `${BASE_URL}${user.cover_photo}`
          : p.cover;
        setUserData((prev) => ({
          ...prev,
          avatar: profilePhotoUrl,
          cover: coverPhotoUrl,
          name: `${user.first_name} ${user.last_name}`,
          username: user.username,
        }));
        setProfilePhoto(profilePhotoUrl);
        setCoverPhoto(coverPhotoUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      await loadHighlights();
      setPosts(getPosts());
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadHighlights = async () => {
    try {
      if (!editable) return;
      const api = await import('../utils/api');
      const highlightsData = await api.getHighlights();
      setHighlights(highlightsData || []);
    } catch (error) {
      console.error('Erro ao carregar destaques:', error);
    }
  };

  useEffect(() => {
    loadUserData();
    loadHighlights();
    const unsub = subscribe(() => setPosts(getPosts()));
    return unsub;
  }, [editable]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permitir acesso à galeria de fotos para mudar sua foto de perfil.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });
    if (
      !result.canceled &&
      Array.isArray(result.assets) &&
      result.assets.length > 0 &&
      result.assets[0]?.uri
    ) {
      setSelectedImageUri(result.assets[0].uri);
      setEditorVisible(true);
    }
  };

  const guessMime = (uri: string) => {
    const u = uri.toLowerCase();
    if (u.endsWith('.png')) return { type: 'image/png', name: 'image.png' };
    if (u.endsWith('.jpg') || u.endsWith('.jpeg'))
      return { type: 'image/jpeg', name: 'image.jpg' };
    if (u.endsWith('.webp')) return { type: 'image/webp', name: 'image.webp' };
    return { type: 'image/jpeg', name: 'image.jpg' };
  };

  const postImageToFeed = async (uri: string, content: string) => {
    try {
      const { createPostWithImage } = await import('../utils/api');
      const { type, name } = guessMime(uri);
      await createPostWithImage(content, { uri, type, name });
    } catch (e) {
      console.error('Error posting image to feed:', e);
    }
  };

  const handlePhotoSave = async (imageUri: string, caption: string) => {
    try {
      const { uploadProfilePhoto } = await import('../utils/api');
      const { type, name } = guessMime(imageUri);
      const response = await uploadProfilePhoto({ uri: imageUri, type, name });
      const BASE_URL =
        (typeof process !== 'undefined' &&
          (process as any).env &&
          (process as any).env.EXPO_PUBLIC_API_URL) ||
        'http://localhost:8000';
      const profilePhotoUrl = response.profile_photo
        ? response.profile_photo.startsWith('http')
          ? response.profile_photo
          : `${BASE_URL}${response.profile_photo}`
        : profilePhoto;
      setProfilePhoto(profilePhotoUrl);
      setUserData((prev) => ({ ...prev, avatar: profilePhotoUrl }));
      setEditorVisible(false);
      setSelectedImageUri(null);
      Alert.alert(
        'Sucesso',
        `Foto de perfil atualizada${caption ? ` com legenda: "${caption}"` : ''}!`,
      );
    } catch (error: any) {
      console.error('Erro ao salvar foto de perfil:', error);
      Alert.alert('Erro', error?.message || 'Falha ao salvar foto de perfil');
    }
  };

  const myPosts = useMemo(() => {
    if (editable) return posts.filter((x) => x.user === 'Você');
    if (externalPosts && externalPosts.length > 0) return externalPosts;
    const toSlug = (s: string) =>
      String(s || '')
        .replace(/\s+/g, '')
        .toLowerCase();
    const target = String(p.username || '').toLowerCase();
    return posts.filter((x) => toSlug(x.user) === target);
  }, [posts, editable, p.username, externalPosts]);

  const handleSaveHighlight = async (highlight: Highlight) => {
    try {
      const api = await import('../utils/api');
      const isExisting = highlights.some((h) => h.id === highlight.id);

      if (isExisting) {
        const highlightId = parseInt(
          highlight.id.toString().split('_')[1] || highlight.id.toString(),
        );
        const savedHighlight = await api.updateHighlight(highlightId, {
          name: highlight.name,
          cover: highlight.cover,
          photos: highlight.photos,
        });
        const updatedIndex = highlights.findIndex((h) => h.id === highlight.id);
        if (updatedIndex >= 0) {
          const updatedHighlights = [...highlights];
          updatedHighlights[updatedIndex] = savedHighlight;
          setHighlights(updatedHighlights);
        }
      } else {
        const savedHighlight = await api.createHighlight({
          name: highlight.name,
          cover: highlight.cover,
          photos: highlight.photos,
        });
        setHighlights([...highlights, savedHighlight]);
      }
      setEditingHighlight(undefined);
    } catch (error) {
      console.error('Erro ao salvar destaque:', error);
      Alert.alert('Erro', 'Falha ao salvar destaque');
    }
  };

  const handleDeleteHighlight = (id: string) => {
    Alert.alert(
      'Deletar Destaque',
      'Tem certeza que deseja deletar este destaque?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: async () => {
            try {
              const api = await import('../utils/api');
              const highlightId = parseInt(
                id.toString().split('_')[1] || id.toString(),
              );
              await api.deleteHighlight(highlightId);
              setHighlights(highlights.filter((h) => h.id !== id));
            } catch (error) {
              console.error('Erro ao deletar destaque:', error);
              Alert.alert('Erro', 'Falha ao deletar destaque');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const [ratings, setRatings] = useState({
    confiavel: 142,
    legal: 256,
    sexy: 89,
  });
  const [userVotes, setUserVotes] = useState({
    confiavel: false,
    legal: false,
    sexy: false,
  });
  const handleRating = (type: 'confiavel' | 'legal' | 'sexy') => {
    if (userVotes[type]) return;
    setRatings((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setUserVotes((prev) => ({ ...prev, [type]: true }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <TopBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          editable ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
      >
        <View style={styles.headerSection}>
          <View style={styles.coverContainer}>
            {coverPhoto && coverPhoto !== '' ? (
              <Image
                source={{ uri: coverPhoto }}
                style={[
                  styles.coverImage,
                  {
                    transform: [
                      { scale: coverTransform.scale },
                      { translateX: coverTransform.offsetX },
                      { translateY: coverTransform.offsetY },
                    ],
                  },
                ]}
                resizeMode="cover"
              />
            ) : (
              <CoverPlaceholder />
            )}
            {!coverEditorVisible && (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowCoverMenu(true)}
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.coverGradient}
            />
            {editable && (
              <TouchableOpacity
                style={styles.coverEditBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  const { status } =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert(
                      'Permissão necessária',
                      'Permitir acesso à galeria para alterar sua capa.',
                    );
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 1,
                  });
                  if (
                    !result.canceled &&
                    Array.isArray(result.assets) &&
                    result.assets.length > 0 &&
                    result.assets[0]?.uri
                  ) {
                    prevCoverPhotoRef.current = coverPhoto;
                    prevCoverTransformRef.current = coverTransform;
                    setEditingCoverPhoto(result.assets[0].uri);
                    setCoverEditorVisible(true);
                  }
                }}
              >
                <Camera size={18} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mainContainer}>
            <View style={styles.avatarWrapper}>
              <Pressable onPress={() => setShowAvatarMenu(true)}>
                {profilePhoto && profilePhoto !== '' ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatar} />
                ) : (
                  <AvatarPlaceholder />
                )}
              </Pressable>
              <View style={styles.onlineDot} />
              {editable && (
                <TouchableOpacity
                  style={styles.avatarEditBtn}
                  activeOpacity={0.8}
                  onPress={pickImage}
                >
                  <Camera size={14} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.name}>{p.name}</Text>
              <Shield size={18} color="#3b82f6" fill="#3b82f6" />
            </View>
            <Text style={styles.username}>@{p.username}</Text>

            <Text style={styles.bio}>{p.bio}</Text>

            <View style={styles.ratingsContainer}>
              <TouchableOpacity
                style={[
                  styles.ratingItem,
                  userVotes.confiavel && styles.ratingItemVoted,
                ]}
                activeOpacity={userVotes.confiavel ? 1 : 0.7}
                onPress={() => handleRating('confiavel')}
              >
                <Text style={styles.ratingEmoji}>😊</Text>
                <View style={styles.ratingInfo}>
                  <Text
                    style={[
                      styles.ratingLabel,
                      userVotes.confiavel && styles.ratingLabelVoted,
                    ]}
                  >
                    Confiável
                  </Text>
                  <Text
                    style={[
                      styles.ratingCount,
                      userVotes.confiavel && styles.ratingCountVoted,
                    ]}
                  >
                    {ratings.confiavel}
                  </Text>
                </View>
                {userVotes.confiavel && (
                  <View style={styles.votedIndicator}>
                    <Check size={12} color="#10b981" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.ratingDivider} />

              <TouchableOpacity
                style={[
                  styles.ratingItem,
                  userVotes.legal && styles.ratingItemVoted,
                ]}
                activeOpacity={userVotes.legal ? 1 : 0.7}
                onPress={() => handleRating('legal')}
              >
                <Text style={styles.ratingEmoji}>😎</Text>
                <View style={styles.ratingInfo}>
                  <Text
                    style={[
                      styles.ratingLabel,
                      userVotes.legal && styles.ratingLabelVoted,
                    ]}
                  >
                    Legal
                  </Text>
                  <Text
                    style={[
                      styles.ratingCount,
                      userVotes.legal && styles.ratingCountVoted,
                    ]}
                  >
                    {ratings.legal}
                  </Text>
                </View>
                {userVotes.legal && (
                  <View style={styles.votedIndicator}>
                    <Check size={12} color="#10b981" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.ratingDivider} />

              <TouchableOpacity
                style={[
                  styles.ratingItem,
                  userVotes.sexy && styles.ratingItemVoted,
                ]}
                activeOpacity={userVotes.sexy ? 1 : 0.7}
                onPress={() => handleRating('sexy')}
              >
                <Text style={styles.ratingEmoji}>💖</Text>
                <View style={styles.ratingInfo}>
                  <Text
                    style={[
                      styles.ratingLabel,
                      userVotes.sexy && styles.ratingLabelVoted,
                    ]}
                  >
                    Sexy
                  </Text>
                  <Text
                    style={[
                      styles.ratingCount,
                      userVotes.sexy && styles.ratingCountVoted,
                    ]}
                  >
                    {ratings.sexy}
                  </Text>
                </View>
                {userVotes.sexy && (
                  <View style={styles.votedIndicator}>
                    <Check size={12} color="#10b981" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              {editable ? (
                <>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push('/profile/edit')}
                  >
                    <Edit3 size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={styles.primaryBtnText}>Editar perfil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                  >
                    <Plus size={18} color="#3b82f6" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                  >
                    <MoreVertical size={18} color="#3b82f6" strokeWidth={2.5} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {friendStatus.status === 'none' && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.85}
                      onPress={handleSendInvite}
                    >
                      <UserPlus size={16} color="#ffffff" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>Adicionar</Text>
                    </TouchableOpacity>
                  )}
                  {friendStatus.status === 'outgoing_pending' && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.85}
                      onPress={handleCancelInvite}
                    >
                      <UserPlus size={16} color="#ffffff" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>
                        Cancelar convite
                      </Text>
                    </TouchableOpacity>
                  )}
                  {friendStatus.status === 'incoming_pending' && (
                    <>
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        activeOpacity={0.85}
                        onPress={handleAcceptInvite}
                      >
                        <UserCheck
                          size={16}
                          color="#ffffff"
                          strokeWidth={2.5}
                        />
                        <Text style={styles.primaryBtnText}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleDeclineInvite}
                        style={{
                          paddingHorizontal: 12,
                          height: 42,
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                          Recusar
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {friendStatus.status === 'friends' && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={1}
                    >
                      <UserCheck size={16} color="#ffffff" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>Amigos</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                    onPress={handleMessage}
                  >
                    <MessageCircle
                      size={18}
                      color="#3b82f6"
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                  >
                    <MoreVertical size={18} color="#3b82f6" strokeWidth={2.5} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.highlightsWrapper}>
              <View style={styles.highlightsHeader}>
                <Text style={styles.highlightsTitle}>Destaques</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightsContainer}
              >
                {highlights.map((highlight) => (
                  <TouchableOpacity
                    key={highlight.id}
                    style={styles.highlightItem}
                    activeOpacity={0.9}
                    onLongPress={
                      editable
                        ? () => handleDeleteHighlight(highlight.id)
                        : undefined
                    }
                    onPress={
                      editable
                        ? () => setEditingHighlight(highlight)
                        : undefined
                    }
                  >
                    <View style={styles.highlightImageWrapper}>
                      <Image
                        source={{ uri: highlight.cover }}
                        style={styles.highlightImage}
                      />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                        style={styles.highlightOverlay}
                      />
                    </View>
                    <Text style={styles.highlightName}>{highlight.name}</Text>
                  </TouchableOpacity>
                ))}

                {editable && (
                  <TouchableOpacity
                    style={styles.addHighlightItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setEditingHighlight(undefined);
                      setHighlightManagerVisible(true);
                    }}
                  >
                    <View style={styles.addHighlightCircle}>
                      <Plus size={18} color="#64748b" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.addHighlightText}>Adicionar</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Informações Pessoais</Text>
            <Pressable
              onPress={() =>
                router.push(
                  `/profile/about?user=${encodeURIComponent(p.username)}`,
                )
              }
            >
              <ChevronRight size={20} color="#64748b" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.infoGrid}>
            {p.show_workplace !== false && (
              <>
                {Array.isArray(p.positions) && p.positions.length > 0 ? (
                  p.positions.map((pos, i) => (
                    <View key={`pos_${i}`} style={styles.infoItem}>
                      <Briefcase size={18} color="#64748b" strokeWidth={2} />
                      <Text
                        style={styles.infoText}
                      >{`${pos.company}${pos.title ? ' • ' + pos.title : ''}`}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.infoItem}>
                    <Briefcase size={18} color="#64748b" strokeWidth={2} />
                    <Text style={styles.infoText}>{p.workplace}</Text>
                  </View>
                )}
              </>
            )}

            {p.show_current_city !== false && p.currentCity && (
              <View style={styles.infoItem}>
                <MapPin size={18} color="#64748b" strokeWidth={2} />
                <Text style={styles.infoText}>{p.currentCity}</Text>
              </View>
            )}

            {p.show_hometown !== false && p.hometown && (
              <View style={styles.infoItem}>
                <Home size={18} color="#64748b" strokeWidth={2} />
                <Text style={styles.infoText}>{p.hometown}</Text>
              </View>
            )}

            {p.show_relationship_status !== false && p.relationshipStatus && (
              <View style={styles.infoItem}>
                <Heart size={18} color="#64748b" strokeWidth={2} />
                <Text style={styles.infoText}>{p.relationshipStatus}</Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <Calendar size={18} color="#64748b" strokeWidth={2} />
              <Text style={styles.infoText}>Entrou em Janeiro 2020</Text>
            </View>

            {p.show_contact_email === true && p.contact_email && (
              <View style={styles.infoItem}>
                <Mail size={18} color="#64748b" strokeWidth={2} />
                <Text style={[styles.infoText, styles.linkText]}>
                  {p.contact_email}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.connectionsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <UserCheck size={22} color="#3b82f6" strokeWidth={2.5} />
              <View>
                <Text style={styles.sectionTitle}>Conexões</Text>
                <Text style={styles.connectionsSubtitle}>
                  {p.connectionsCount} conexões · {p.recentFriends.length} em
                  comum
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.connectionsGrid}>
            {(Array.isArray(p.recentFriends) ? p.recentFriends : [])
              .slice(0, 9)
              .map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.connectionCard}
                  activeOpacity={0.85}
                >
                  {friend.avatar ? (
                    <Image
                      source={{ uri: friend.avatar }}
                      style={styles.connectionAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.connectionAvatar,
                        {
                          backgroundColor: '#e2e8f0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#64748b',
                        }}
                      >
                        {friend.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.connectionName} numberOfLines={1}>
                    {friend.name.split(' ')[0]}
                  </Text>
                  <Text style={styles.connectionMutual}>2 em comum</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              onPress={() => setTab('posts')}
              style={[styles.tabBtn, tab === 'posts' && styles.tabActive]}
            >
              <FileText
                size={18}
                color={tab === 'posts' ? '#3b82f6' : '#64748b'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.tabText,
                  tab === 'posts' && styles.tabTextActive,
                ]}
              >
                Posts
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('photos')}
              style={[styles.tabBtn, tab === 'photos' && styles.tabActive]}
            >
              <Camera
                size={18}
                color={tab === 'photos' ? '#3b82f6' : '#64748b'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.tabText,
                  tab === 'photos' && styles.tabTextActive,
                ]}
              >
                Fotos
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('about')}
              style={[styles.tabBtn, tab === 'about' && styles.tabActive]}
            >
              <Users
                size={18}
                color={tab === 'about' ? '#3b82f6' : '#64748b'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.tabText,
                  tab === 'about' && styles.tabTextActive,
                ]}
              >
                Sobre
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.tabContent}>
          {tab === 'posts' &&
            (myPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <FileText size={48} color="#cbd5e1" strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma publicação ainda</Text>
                <Text style={styles.emptyDesc}>
                  Compartilhe seus momentos e pensamentos com seus amigos
                </Text>
                {editable && (
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    activeOpacity={0.85}
                  >
                    <Plus size={18} color="#ffffff" strokeWidth={2.5} />
                    <Text style={styles.emptyBtnText}>
                      Criar primeira publicação
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              myPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as any}
                  onLike={() => toggleLike(post.id)}
                />
              ))
            ))}

          {tab === 'photos' && (
            <View style={styles.photosGrid}>
              {p.highlights.map((photo, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.photoItem}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {tab === 'about' && (
            <View>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>Biografia</Text>
                <Text style={styles.aboutText}>
                  {p.bio}
                  {'\n\n'}Apaixonado por tecnologia e inovação, sempre buscando
                  novos desafios e oportunidades de crescimento. Acredito no
                  poder da colaboração e no impacto positivo que podemos criar
                  juntos.
                </Text>
              </View>

              {p.testimonials && p.testimonials.length > 0 && (
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutTitle}>Depoimentos</Text>
                  {p.testimonials.map((t) => (
                    <View key={t.id} style={styles.testimonialCard}>
                      <Text style={styles.testimonialText}>"{t.text}"</Text>
                      <View style={styles.testimonialAuthor}>
                        <View style={styles.testimonialAvatar}>
                          <Text style={styles.testimonialAvatarText}>
                            {t.author.charAt(0)}
                          </Text>
                        </View>
                        <Text style={styles.testimonialName}>— {t.author}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav active="profile" />

      <Modal visible={showCoverMenu} transparent animationType="fade">
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setShowCoverMenu(false)}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 20,
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
              }}
              onPress={() => {
                setShowCoverMenu(false);
                router.push(`/cover/${p.username}`);
              }}
            >
              <Text
                style={{ fontSize: 16, color: '#0f172a', fontWeight: '600' }}
              >
                Ver foto da capa
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {selectedImageUri && (
        <ProfilePhotoEditor
          imageUri={selectedImageUri}
          isVisible={editorVisible}
          onSave={handlePhotoSave}
          onCancel={() => {
            setEditorVisible(false);
            setSelectedImageUri(null);
          }}
        />
      )}

      {editingCoverPhoto && (
        <CoverPhotoEditor
          imageUri={editingCoverPhoto}
          isVisible={coverEditorVisible}
          height={COVER_HEIGHT}
          onSave={async ({ imageUri, scale, offsetX, offsetY }) => {
            try {
              const { uploadCoverPhoto } = await import('../utils/api');
              const { type, name } = guessMime(imageUri);
              const response = await uploadCoverPhoto({
                uri: imageUri,
                type,
                name,
              });
              const BASE_URL =
                (typeof process !== 'undefined' &&
                  (process as any).env &&
                  (process as any).env.EXPO_PUBLIC_API_URL) ||
                'http://localhost:8000';
              const coverPhotoUrl = response.cover_photo
                ? response.cover_photo.startsWith('http')
                  ? response.cover_photo
                  : `${BASE_URL}${response.cover_photo}`
                : imageUri;
              setCoverPhoto(coverPhotoUrl);
              setUserData((prev) => ({ ...prev, cover: coverPhotoUrl }));
              setCoverTransform({ scale, offsetX, offsetY });
              setCoverEditorVisible(false);
              setEditingCoverPhoto(null);
              Alert.alert('Sucesso', 'Foto de capa atualizada!');
            } catch (error: any) {
              console.error('Erro ao salvar foto de capa:', error);
              Alert.alert(
                'Erro',
                error?.message || 'Falha ao salvar foto de capa',
              );
            }
          }}
          onCancel={() => {
            setCoverEditorVisible(false);
            setEditingCoverPhoto(null);
          }}
        />
      )}

      <Modal visible={showAvatarMenu} transparent animationType="fade">
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setShowAvatarMenu(false)}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 20,
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
              }}
              onPress={() => {
                setShowAvatarMenu(false);
                router.push(`/photo/${p.username}`);
              }}
            >
              <Text
                style={{ fontSize: 16, color: '#0f172a', fontWeight: '600' }}
              >
                Ver foto de perfil
              </Text>
            </TouchableOpacity>
            {hasStory && (
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                }}
                onPress={() => {
                  setShowAvatarMenu(false);
                  router.push(`/story/${p.username}`);
                }}
              >
                <Text
                  style={{ fontSize: 16, color: '#0f172a', fontWeight: '600' }}
                >
                  Ver story
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      <HighlightManager
        visible={highlightManagerVisible}
        onClose={() => {
          setHighlightManagerVisible(false);
          setEditingHighlight(undefined);
        }}
        onSave={handleSaveHighlight}
        highlight={editingHighlight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  coverContainer: { position: 'relative' },
  coverImage: { width: '100%', height: 200, backgroundColor: '#e2e8f0' },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coverEditBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  mainContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatarWrapper: { marginTop: -65, position: 'relative' },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#ffffff',
    backgroundColor: '#e2e8f0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  username: { fontSize: 15, color: '#64748b', marginTop: 2, fontWeight: '600' },
  bio: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    position: 'relative',
  },
  ratingItemVoted: { opacity: 0.9 },
  ratingEmoji: { fontSize: 20 },
  ratingInfo: { flex: 1 },
  ratingLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
  ratingLabelVoted: { color: '#10b981' },
  ratingCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 1,
  },
  ratingCountVoted: { color: '#10b981' },
  ratingDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  votedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 24 },
  highlightsWrapper: { width: '100%', marginTop: 24 },
  highlightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  highlightsTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  highlightsEdit: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  highlightsContainer: { flexDirection: 'row', gap: 16 },
  highlightItem: { alignItems: 'center' },
  highlightImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  highlightImage: { width: '100%', height: '100%' },
  highlightOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  highlightIcon: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    fontSize: 16,
  },
  highlightName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 6,
  },
  addHighlightItem: { alignItems: 'center' },
  addHighlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHighlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  infoGrid: { gap: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 14, color: '#1e293b', fontWeight: '500', flex: 1 },
  linkText: { color: '#3b82f6' },
  connectionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  seeAll: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
  connectionsSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  connectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  connectionCard: { width: (width - 64) / 3, alignItems: 'center' },
  connectionAvatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  connectionName: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 6,
  },
  connectionMutual: { fontSize: 11, color: '#64748b', marginTop: 2 },
  tabsContainer: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#3b82f6' },
  tabContent: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    backgroundColor: '#f8fafc',
    padding: 24,
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  photoItem: { width: '33.333%', padding: 4 },
  photoImage: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  aboutSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  aboutText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  testimonialCard: {
    backgroundColor: '#fafbfc',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testimonialText: { fontStyle: 'italic', color: '#334155' },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  testimonialAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: { fontWeight: '800', color: '#475569' },
  testimonialName: { color: '#475569' },
});
