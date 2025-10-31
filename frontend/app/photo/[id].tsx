import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';

export default function PhotoView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id ?? '');
  const src = typeof params.src === 'string' ? params.src : undefined;

  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');

  const handleAddComment = () => {
    const t = comment.trim();
    if (!t) return;
    const newComment = {
      id: `${Date.now()}`,
      user: 'Você',
      text: t,
      timestamp: 'agora',
    };
    setComments((prev) => [newComment, ...prev]);
    setComment('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0f172a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Foto de Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <View style={styles.commentAvatarPlaceholder}>
                <Text style={styles.commentAvatarText}>
                  {String(item.user || 'V')[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{item.user}</Text>
                  <Text style={styles.commentMeta}>{item.timestamp}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: src || 'https://picsum.photos/1000/800' }}
                style={styles.image}
                resizeMode="contain"
              />
              <Text style={styles.sub}>@{id} · comentários</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputBarContainer}>
          <View style={styles.inputBar}>
            <View style={styles.inputAvatarPlaceholder}>
              <Text style={styles.inputAvatarText}>V</Text>
            </View>
            <TextInput
              style={styles.input}
              value={comment}
              onChangeText={setComment}
              placeholder="Adicionar um comentário..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !comment.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!comment.trim()}
            >
              <Send size={18} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  photoWrapper: { padding: 16, alignItems: 'center' },
  sub: { marginTop: 8, fontSize: 12, color: '#64748b' },
  image: { width: '100%', height: 280 },

  commentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#0856d6', fontWeight: '800' },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  commentMeta: { fontSize: 12, color: '#94a3b8' },
  commentText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },

  inputBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 12 + (Platform.OS === 'ios' ? 20 : 0),
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputAvatarText: { color: '#0856d6', fontWeight: '800' },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
});
