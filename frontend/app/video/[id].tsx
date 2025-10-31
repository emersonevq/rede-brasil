import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';
import { useLocalSearchParams } from 'expo-router';

export default function VideoView() {
  const { id } = useLocalSearchParams();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar />
      <View style={styles.container}>
        <Text style={styles.title}>Vídeo</Text>
        <Text style={styles.sub}>ID: {String(id ?? '')}</Text>
      </View>
      <BottomNav active="feed" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { marginTop: 6, color: '#64748b' },
});
