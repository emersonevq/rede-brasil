import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CoverView() {
  const params = useLocalSearchParams();
  const id = String(params.id ?? '');
  const src = typeof params.src === 'string' ? params.src : undefined;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Foto de capa</Text>
        <Text style={styles.sub}>@{id}</Text>
        <Image
          source={{ uri: src || 'https://picsum.photos/1200/400' }}
          style={styles.image}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { marginTop: 6, color: '#64748b' },
  image: { width: '100%', height: 200, borderRadius: 10, marginTop: 12 },
});
