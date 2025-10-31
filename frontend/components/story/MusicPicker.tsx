import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Music } from 'lucide-react-native';

const TRACKS = [
  { id: 't1', title: 'SoundHelix 1', artist: 'SoundHelix', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 't2', title: 'SoundHelix 2', artist: 'SoundHelix', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
];

export default function MusicPicker({ onSelect }: { onSelect: (track: any | null) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  async function toggle(t: any) {
    if (playing === t.id) {
      await sound?.stopAsync().catch(() => {});
      await sound?.unloadAsync().catch(() => {});
      setSound(null);
      setPlaying(null);
      onSelect(null);
      return;
    }
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
      setSound(null);
    }
    const s = new Audio.Sound();
    try {
      await s.loadAsync({ uri: t.uri }, { shouldPlay: true, isLooping: true });
      setSound(s);
      setPlaying(t.id);
      onSelect(t);
    } catch (e) {
      console.warn(e);
    }
  }

  return (
    <View style={{ padding: 8 }}>
      <FlatList
        data={TRACKS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggle(item)} style={[styles.row, playing === item.id && styles.active]}>
            <Music size={18} color={playing === item.id ? '#fff' : '#111827'} strokeWidth={2} />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, playing === item.id && { color: '#fff' }]}>{item.title}</Text>
              <Text style={[styles.artist, playing === item.id && { color: '#e6eefc' }]}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#f8fafc', marginBottom: 8 },
  active: { backgroundColor: '#0856d6' },
  title: { fontWeight: '700' },
  artist: { fontSize: 12, color: '#6b7280' },
});
