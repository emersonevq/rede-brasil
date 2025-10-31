import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { OverlayText } from './StoryEditorTypes';

export default function TextOverlay({ item, selected, onSelect }: { item: OverlayText; selected?: boolean; onSelect?: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => onSelect && onSelect(item.id)}
      style={[styles.wrapper, { left: item.x, top: item.y }]}
    >
      <View style={[styles.box, selected && styles.boxSelected]}>
        <Text style={[styles.text, { color: item.color, fontFamily: item.fontFamily }]}>{item.text}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute' },
  box: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: 'transparent' },
  boxSelected: { borderWidth: 1, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.06)' },
  text: { fontSize: 20, fontWeight: '700' },
});
