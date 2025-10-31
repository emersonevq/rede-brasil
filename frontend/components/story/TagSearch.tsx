import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { searchUsers } from '../../utils/api';

export default function TagSearch({ onSelect }: { onSelect: (user: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    (async () => {
      try {
        const res = await searchUsers(q.trim());
        if (active) setResults(res || []);
      } catch {
        if (active) setResults([]);
      }
    })();
    return () => { active = false; };
  }, [q]);

  return (
    <View style={{ padding: 8 }}>
      <TextInput value={q} onChangeText={setQ} placeholder="Buscar amigos" style={styles.input} />
      <FlatList
        data={results}
        keyExtractor={(i) => String(i.id || i.username || Math.random())}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item)} style={styles.item}>
            <Text style={styles.name}>@{item.username || item.first_name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Comece a digitar para buscar</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e6eef8', marginBottom: 8 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  name: { fontWeight: '700' },
  empty: { color: '#9ca3af', paddingVertical: 12 },
});
