import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function MessageItem({
  item,
  onPress,
}: {
  item: any;
  onPress?: () => void;
}) {
  const router = useRouter();
  const slug = String(item.name || '')
    .replace(/\s+/g, '')
    .toLowerCase();
  return (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <TouchableOpacity
        onPress={() => router.push(`/profile/${slug}`)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${slug}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text numberOfLines={1} style={styles.snippet}>
          {item.snippet}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontWeight: '700', fontSize: 16, color: '#111827' },
  time: { color: '#6b7280', fontSize: 12 },
  snippet: { color: '#374151', marginTop: 2 },
});
