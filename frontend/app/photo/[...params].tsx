import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DetailView from '../../components/DetailView';
import type { ApiPost } from '../../utils/api';
import { getUserById, absoluteUrl } from '../../utils/api';

export default function PhotoDetailPage() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const paramsArray = Array.isArray(params.params)
    ? params.params
    : params.params
      ? [params.params]
      : [];

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const pathString = paramsArray.join('/');

        if (!pathString) {
          throw new Error('ID not provided');
        }

        const user = await getUserById(pathString);
        const photoUrl = absoluteUrl(user.profile_photo);

        if (!mounted) return;

        const pseudo: ApiPost = {
          id: 0,
          content: `Foto de perfil de ${user.username || user.first_name}`,
          media_url: user.profile_photo || null,
          created_at: user.created_at || new Date().toISOString(),
          user_id: user.id,
          unique_id: '',
          user_name: `${user.first_name} ${user.last_name}`.trim(),
          user_profile_photo: user.profile_photo || null,
        };

        setPost(pseudo);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Falha ao carregar foto');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paramsArray.join('/')]);

  return (
    <DetailView
      post={post}
      loading={loading}
      error={error}
      onBack={() => router.back()}
      title="Foto de Perfil"
    />
  );
}
