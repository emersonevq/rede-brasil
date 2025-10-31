import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Search, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnread } from '../contexts/UnreadContext';
import FriendRequests from './FriendRequests';
import { getIncomingFriendRequests } from '../utils/api';

export default function TopBar() {
  const router = useRouter();
  const { unreadNotifications } = useUnread();
  const insets = useSafeAreaInsets();
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [unreadFriendRequests, setUnreadFriendRequests] = useState(0);

  useEffect(() => {
    loadFriendRequestCount();
    const interval = setInterval(loadFriendRequestCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFriendRequestCount = async () => {
    try {
      const requests = await getIncomingFriendRequests();
      setUnreadFriendRequests(requests.length);
    } catch (error) {
      console.error('Error loading friend request count:', error);
    }
  };

  const paddingTop = Math.max(
    insets.top + 2,
    Platform.OS === 'android' ? 12 : 14,
  );

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop, paddingBottom: Platform.OS === 'ios' ? 8 : 6 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/feed')}
          activeOpacity={0.7}
        >
          <Text style={styles.logo}>Vibe</Text>
        </TouchableOpacity>

        <View style={styles.rightRow}>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={styles.iconBtn}
            activeOpacity={0.6}
          >
            <Search size={20} color="#64748b" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.iconBtn}
            activeOpacity={0.6}
          >
            <Bell size={20} color="#64748b" strokeWidth={2} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowFriendRequests(true);
              loadFriendRequestCount();
            }}
            style={styles.iconBtn}
            activeOpacity={0.6}
          >
            <Users size={20} color="#64748b" strokeWidth={2} />
            {unreadFriendRequests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadFriendRequests > 99 ? '99+' : unreadFriendRequests}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FriendRequests
        visible={showFriendRequests}
        onClose={() => {
          setShowFriendRequests(false);
          loadFriendRequestCount();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0856d6',
    letterSpacing: -1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
