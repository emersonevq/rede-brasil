import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserById, absoluteUrl } from '../../utils/api';
import { ChevronLeft } from 'lucide-react-native';

export default function CoverView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [comments, setComments] = useState<
    { id: string; user: string; text: string }[]
  >([]);
  const [commentText, setCommentText] = useState('');
  const mountedRef = React.useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const user = await getUserById(id);
        if (!mounted || !mountedRef.current) return;
        setCoverUrl(absoluteUrl(user.cover_photo) || null);
      } catch (e: any) {
        if (!mounted || !mountedRef.current) return;
        setError(e?.message || 'Falha ao carregar capa');
      } finally {
        if (mounted && mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [id]);

  const handleAddComment = () => {
    if (!mountedRef.current) return;
    const t = commentText.trim();
    if (!t) return;
    try {
      const newComment = { id: `${Date.now()}`, user: 'Você', text: t };
      if (mountedRef.current) {
        setComments((prev) => [newComment, ...prev]);
        setCommentText('');
      }
    } catch (e) {
      console.error('Error adding comment:', e);
      if (mountedRef.current) {
        alert('Erro ao adicionar comentário');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (error || !coverUrl) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#374151' }}>
          {error || 'Capa não disponível'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capa</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.commentText}> {item.text}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyComments}>
            <Text style={{ color: '#64748b' }}>Seja o primeiro a comentar</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.commentBox}
      >
        <TextInput
          placeholder="Adicione um comentário..."
          placeholderTextColor="#94a3b8"
          value={commentText}
          onChangeText={setCommentText}
          style={styles.commentInput}
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          style={styles.sendBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
  },
  mediaContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  media: {
    width: '100%',
    height: 360,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  commentUser: { fontWeight: '700', color: '#0f172a' },
  commentText: { color: '#374151', marginLeft: 6 },
  emptyComments: { padding: 20, alignItems: 'center' },
  commentBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: { color: '#ffffff', fontWeight: '700' },
});
