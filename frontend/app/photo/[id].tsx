import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserById, absoluteUrl } from '../../utils/api';
import MediaViewer from '../../components/MediaViewer';

export default function PhotoView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const user = await getUserById(id);
        if (!mounted) return;
        setPhotoUrl(absoluteUrl(user.profile_photo) || null);
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
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (error || !photoUrl) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>{error || 'Foto não disponível'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <MediaViewer visible={true} type="image" uri={photoUrl} onClose={() => router.back()} />
    </SafeAreaView>
  );
}
