import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Check } from 'lucide-react-native';
import { searchUsers, createConversation } from '../../utils/api';

const getDimensions = () => {
  if (Platform.OS === 'web') {
    return { width: typeof window !== 'undefined' ? window.innerWidth : 375 };
  }
  return Dimensions.get('window');
};
const { width } = getDimensions();

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
}

const UserItem = ({
  user,
  isSelected,
  onSelect,
}: {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.userItem, isSelected && styles.userItemSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: user.profile_photo || `https://i.pravatar.cc/150?u=${user.id}`,
        }}
        style={styles.userAvatar}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
      </View>

      {isSelected && (
        <View style={styles.checkbox}>
          <Check size={16} color="#fff" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function NewChatScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          setUsers(results);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSelectUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const isGroup = selectedUsers.length > 1;

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsLoading(true);
      const conversation = await createConversation(
        selectedUsers,
        isGroup ? groupName || 'Grupo de chat' : undefined,
      );
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = selectedUsers.length > 0 && (!isGroup || groupName.trim());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isGroup ? 'Novo Grupo' : 'Nova Conversa'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedUsers.length > 0
              ? `${selectedUsers.length} selecionado${selectedUsers.length > 1 ? 's' : ''}`
              : 'Selecione um ou mais usuários'}
          </Text>
        </View>
      </View>

      {isGroup && (
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Nome do grupo (opcional)"
            placeholderTextColor="#94a3b8"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      )}

      <View style={styles.searchBar}>
        <Search size={20} color="#94a3b8" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuários..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserItem
              user={item}
              isSelected={selectedUsers.includes(item.id)}
              onSelect={() => handleSelectUser(item.id)}
            />
          )}
          contentContainerStyle={styles.userList}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Digite para buscar usuários
                </Text>
              </View>
            )
          }
        />
      )}

      {selectedUsers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              !canCreate && styles.createButtonDisabled,
            ]}
            onPress={handleCreateConversation}
            disabled={!canCreate || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>
                Criar {isGroup ? 'Grupo' : 'Conversa'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  groupNameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userList: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userItemSelected: {
    backgroundColor: '#dbeafe',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderBottomColor: '#bfdbfe',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  userUsername: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
