import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DetailView from '../../components/DetailView';
import type { ApiPost } from '../../utils/api';

export default function UniversalDetailPage() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // params.params is an array when using [...params]
  const paramsArray = Array.isArray(params.params)
    ? params.params
    : params.params
      ? [params.params]
      : [];

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Publicação');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { parseDetailId, fetchDetailData } = await import(
          '../../utils/detail'
        );

        // Reconstruct the original path from params
        const pathString = paramsArray.join('/');

        if (!pathString) {
          throw new Error('ID not provided');
        }

        const parsed = parseDetailId(pathString);

        // Set title based on type
        switch (parsed.type) {
          case 'profile_photo':
            setTitle('Foto de Perfil');
            break;
          case 'profile_cover':
            setTitle('Capa de Perfil');
            break;
          case 'video':
            setTitle('Vídeo');
            break;
          case 'story':
            setTitle('História');
            break;
          case 'post':
            setTitle('Post');
            break;
          default:
            setTitle('Publicação');
        }

        const { post: data } = await fetchDetailData(parsed);

        if (!mounted) return;

        setPost(data);
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
  }, [paramsArray.join('/')]);

  return (
    <DetailView
      post={post}
      loading={loading}
      error={error}
      onBack={() => router.back()}
      title={title}
    />
  );
}
