import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';

type User = {
  id: number;
  name: string;
  username: string;
  profile_photo?: string | null;
  cover_photo?: string | null;
};

type UserRowProps = {
  user: User;
  onPress: () => void;
};

function UserRow({ user, onPress }: UserRowProps) {
  const fullName = user.name;
  const initial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <TouchableOpacity
      style={styles.personRow}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.personAvatar}>
        <Text style={styles.personInitial}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{fullName}</Text>
        <Text style={styles.personLocation}>@{user.username}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const handleSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const api = await import('../../utils/api');
      const results = await api.searchUsers(searchQuery);
      setUsers(results);
    } catch (e) {
      console.error('Search error:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (text.trim()) {
        const timeout = setTimeout(() => {
          handleSearch(text);
        }, 300);
        setSearchTimeout(timeout);
      } else {
        setUsers([]);
      }
    },
    [searchTimeout, handleSearch],
  );

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const renderUser = useCallback<ListRenderItem<User>>(
    ({ item }) => (
      <UserRow user={item} onPress={() => router.push(`/profile/${item.username}`)} />
    ),
    [router],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon size={18} color="#6b7280" />
          <TextInput
            placeholder="Buscar pessoas por nome ou email"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={handleChangeText}
            style={styles.searchInput}
            accessibilityLabel="Campo de busca"
            returnKeyType="search"
          />
        </View>

        {query && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            <Text style={styles.resultCount}>
              {loading
                ? '...'
                : `${users.length} ${users.length === 1 ? 'resultado' : 'resultados'}`}
            </Text>
          </View>
        )}

        {loading && query && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        )}

        {!loading && query && (
          <FlatList<User>
            data={users}
            keyExtractor={(user) => user.id.toString()}
            renderItem={renderUser}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  Nenhum perfil encontrado
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Tente um termo diferente para encontrar novas conexões.
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}

        {!query && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Digite para buscar</Text>
            <Text style={styles.emptyStateSubtitle}>
              Procure por nomes de usuários ou emails para encontrar pessoas.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultCount: {
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  personInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#075985',
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  personLocation: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
});
