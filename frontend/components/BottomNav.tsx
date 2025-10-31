import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Eye,
  User,
  Image as ImageIcon,
  MessageCircle,
} from 'lucide-react-native';

import { useUnread } from '../contexts/UnreadContext';

type ActiveTab =
  | 'feed'
  | 'story'
  | 'messages'
  | 'visits'
  | 'profile'
  | 'create';

type BottomNavProps = {
  active?: ActiveTab;
  unreadMessages?: number;
  unreadVisits?: number;
};

function formatBadgeValue(value?: number) {
  if (!value) return '';
  return value > 99 ? '99+' : String(value);
}

function BottomNavInner({
  active,
  unreadMessages = 0,
  unreadVisits = 0,
}: BottomNavProps) {
  const router = useRouter();
  type TabRoute = Parameters<typeof router.push>[0];
  const insets = useSafeAreaInsets();
  const go = useCallback((path: TabRoute) => () => router.push(path), [router]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(
            insets.bottom + 6,
            Platform.OS === 'android' ? 22 : 18,
          ),
        },
      ]}
    >
      <TouchableOpacity style={styles.tab} onPress={go('/feed')}>
        <View style={styles.iconWrapper}>
          <Home size={20} color={active === 'feed' ? '#0856d6' : '#6b7280'} />
        </View>
        <Text style={[styles.label, active === 'feed' && styles.active]}>
          Feed
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={go('/story')}>
        <View style={styles.iconWrapper}>
          <ImageIcon
            size={20}
            color={active === 'story' ? '#0856d6' : '#6b7280'}
          />
        </View>
        <Text style={[styles.label, active === 'story' && styles.active]}>
          Story
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={go('/messages')}>
        <View style={styles.iconWrapper}>
          <MessageCircle
            size={20}
            color={active === 'messages' ? '#0856d6' : '#6b7280'}
          />
          {unreadMessages > 0 && (
            <View style={[styles.badge, styles.badgeMessage]}>
              <Text style={styles.badgeText}>
                {formatBadgeValue(unreadMessages)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, active === 'messages' && styles.active]}>
          Mensagens
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={go('/visits')}>
        <View style={styles.iconWrapper}>
          <Eye size={20} color={active === 'visits' ? '#0856d6' : '#6b7280'} />
          {unreadVisits > 0 && (
            <View style={[styles.badge, styles.badgeVisits]}>
              <Text style={styles.badgeText}>
                {formatBadgeValue(unreadVisits)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, active === 'visits' && styles.active]}>
          Visitas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={go('/profile')}>
        <View style={styles.iconWrapper}>
          <User
            size={20}
            color={active === 'profile' ? '#0856d6' : '#6b7280'}
          />
        </View>
        <Text style={[styles.label, active === 'profile' && styles.active]}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomNavWithBadges(props: { active?: ActiveTab }) {
  const { unreadMessages, unreadVisits } = useUnread();
  return (
    <BottomNavInner
      active={props.active}
      unreadMessages={unreadMessages}
      unreadVisits={unreadVisits}
    />
  );
}

export default React.memo(BottomNavWithBadges);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  label: {
    color: '#374151',
    fontSize: 12,
    marginTop: 2,
  },
  active: {
    color: '#0856d6',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeMessage: {
    right: -8,
  },
  badgeVisits: {
    right: -10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
