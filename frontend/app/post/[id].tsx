import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DetailView from '../../components/DetailView';
import type { ApiPost } from '../../utils/api';
import { getPostById } from '../../utils/api';

export default function PostDetailPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPostById(id);

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
  }, [id]);

  return (
    <DetailView
      post={post}
      loading={loading}
      error={error}
      onBack={() => router.back()}
      title="Post"
    />
  );
}
