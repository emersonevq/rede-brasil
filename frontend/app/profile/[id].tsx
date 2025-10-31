import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import UserProfileView from '../../components/UserProfileView';
import {
  getUserById,
  getUserPosts,
  getCurrentUser,
  ApiUser,
  ApiPost,
  getUserFriends,
  recordProfileVisit,
} from '../../utils/api';
import { profileData as defaultProfileData } from '../../screens/Profile/Data';
import { getMyProfile, getProfileById } from '../../utils/api';

type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo?: string | null;
  cover_photo?: string | null;
  created_at: string;
};

export default function UserProfilePage() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState(defaultProfileData);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [editable, setEditable] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const userIdentifier = String(id ?? '').trim();

        if (!userIdentifier) {
          setError('ID do usuário não fornecido');
          setLoading(false);
          return;
        }

        let currentUserId: number | null = null;
        try {
          const currentUser = await getCurrentUser();
          currentUserId = currentUser.id;
        } catch {
          currentUserId = null;
        }

        const user = await getUserById(userIdentifier);
        const posts = await getUserPosts(userIdentifier);
        let friends: { id: number; name: string; avatar?: string | null }[] =
          [];
        try {
          friends = await getUserFriends(userIdentifier);
        } catch {}

        if (!mounted) return;

        const isOwnProfile = currentUserId === user.id;
        setEditable(isOwnProfile);
        setUserId(user.id);

        // Record visit if viewing someone else's profile
        if (!isOwnProfile && currentUserId) {
          try {
            await recordProfileVisit(user.id);
          } catch (error) {
            console.error('Error recording visit:', error);
          }
        }

        const fullName = `${user.first_name} ${user.last_name}`;
        const username =
          user.username ||
          `${user.first_name}${user.last_name}`
            .toLowerCase()
            .replace(/\s+/g, '');

        const formattedPosts = posts.map((post: ApiPost) => ({
          id: post.id.toString(),
          userId: post.user_id,
          user: `${post.user_name}`,
          avatar: post.user_profile_photo || undefined,
          cover: post.user_cover_photo || undefined,
          content: post.content,
          time: new Date(post.created_at).toLocaleDateString('pt-BR'),
          image: post.media_url || undefined,
          likes: 0,
          liked: false,
          comments: [],
        }));

        // fetch profile details (real data) if available
        let profileDetails: any = null;
        try {
          if (isOwnProfile) {
            profileDetails = await getMyProfile();
          } else {
            profileDetails = await getProfileById(userIdentifier);
          }
        } catch (e) {
          profileDetails = null;
        }

        const mappedProfile = {
          // base identity
          name: fullName,
          username: username,
          avatar: user.profile_photo || defaultProfileData.avatar,
          cover: user.cover_photo || defaultProfileData.cover,

          // personal info — prefer saved values, otherwise empty (no mocks)
          bio: profileDetails?.bio ?? '',
          hometown: profileDetails?.hometown ?? '',
          currentCity: profileDetails?.current_city ?? '',
          relationshipStatus: profileDetails?.relationship_status ?? '',
          workplace:
            profileDetails?.workplace_company && profileDetails?.workplace_title
              ? `${profileDetails.workplace_company} • ${profileDetails.workplace_title}`
              : (profileDetails?.workplace_company ?? ''),
          connectionsCount: profileDetails?.connections_count ?? 0,
          contact_email: profileDetails?.contact_email ?? '',

          // visibility settings
          show_hometown: profileDetails?.show_hometown ?? true,
          show_current_city: profileDetails?.show_current_city ?? true,
          show_relationship_status:
            profileDetails?.show_relationship_status ?? true,
          show_contact_email: profileDetails?.show_contact_email ?? false,
          show_contact_phone: profileDetails?.show_contact_phone ?? false,
          show_workplace: profileDetails?.show_workplace ?? true,

          // lists
          positions: Array.isArray(profileDetails?.positions)
            ? profileDetails.positions.map((p: any) => ({
                company: p.company,
                title: p.title,
                start: p.start,
                end: p.end,
              }))
            : [],
          education: Array.isArray(profileDetails?.education)
            ? profileDetails.education.map((e: any) => ({
                institution: e.institution,
                degree: e.degree,
                start: e.start,
                end: e.end,
              }))
            : [],

          // lists depending on server data
          recentFriends: friends.map((f) => ({
            id: String(f.id),
            name: f.name,
            avatar: f.avatar || '',
          })),
          testimonials: defaultProfileData.testimonials,
          highlights: defaultProfileData.highlights,
        };

        setProfile(mappedProfile);

        setUserPosts(formattedPosts);
      } catch (err: any) {
        if (!mounted) return;
        console.error('Erro ao carregar perfil:', err);
        setError(err.message || 'Erro ao carregar perfil do usuário');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: '#ef4444', textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <UserProfileView
      profile={profile}
      posts={userPosts}
      editable={editable}
      userId={userId}
    />
  );
}
