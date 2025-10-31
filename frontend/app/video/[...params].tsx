import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DetailView from '../../components/DetailView';
import type { ApiPost } from '../../utils/api';
import { getPostById } from '../../utils/api';

export default function VideoDetailPage() {
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

        // Extract ID from path (format: video-123456 or just 123456)
        const idMatch = pathString.match(/(?:video-)?(\d+)/);
        const id = idMatch ? idMatch[1] : pathString;

        const data = await getPostById(id);

        if (!mounted) return;

        setPost(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Falha ao carregar vídeo');
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
      title="Vídeo"
    />
  );
}
