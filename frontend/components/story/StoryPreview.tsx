import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { StorySegment } from '../../components/StoryViewer';

export default function StoryPreview({ uri, onPress }: { uri: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.wrap} activeOpacity={0.9}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 84, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111827', marginRight: 8 },
  image: { width: '100%', height: '100%' },
});
