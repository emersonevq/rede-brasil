import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserById, absoluteUrl } from '../../utils/api';
import MediaViewer from '../../components/MediaViewer';

export default function CoverView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const user = await getUserById(id);
        if (!mounted) return;
        setCoverUrl(absoluteUrl(user.cover_photo) || null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Falha ao carregar capa');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (error || !coverUrl) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>{error || 'Capa não disponível'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <MediaViewer visible={true} type="image" uri={coverUrl} onClose={() => router.back()} />
    </SafeAreaView>
  );
}
