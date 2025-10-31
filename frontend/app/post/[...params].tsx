import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DetailView from '../../components/DetailView';
import type { ApiPost } from '../../utils/api';
import { getPostById } from '../../utils/api';

export default function PostDetailPage() {
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
  const [title, setTitle] = useState('Post');

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

        // Determine type and extract ID
        // Format: "photo-id-{uniqueId}" or "photo-{id}" or "photo-{id}-{uniqueId}"
        let id = pathString;
        let detailType = 'post';

        if (pathString.includes('photo-')) {
          detailType = 'photo';
          const match = pathString.match(/photo-id-(\d{10})|photo-(.+)/);
          if (match) {
            id = match[1] || match[2] || pathString;
          }
          setTitle('Foto');
        } else if (pathString.includes('video-')) {
          detailType = 'video';
          const match = pathString.match(/video-(\d+)/);
          if (match) {
            id = match[1];
          }
          setTitle('Vídeo');
        } else if (pathString.includes('cover-')) {
          detailType = 'cover';
          const match = pathString.match(/cover-id-(\d{10})|cover-(.+)/);
          if (match) {
            id = match[1] || match[2] || pathString;
          }
          setTitle('Capa');
        } else {
          // Default to post
          const match = pathString.match(/(?:post-)?(\d+)/);
          id = match ? match[1] : pathString;
          setTitle('Post');
        }

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
