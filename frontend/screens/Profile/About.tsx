import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';
import { profileData as seed } from './Data';
import { Home, MapPin, Heart, Briefcase } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { absoluteUrl } from '../../utils/api';

export default function AboutScreen() {
  const { user } = useLocalSearchParams();
  const slug = String(user ?? '').toLowerCase();
  const [p, setP] = React.useState({ ...seed });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!slug) return;
        const api = await import('../../utils/api');

        // try to get profile by username
        try {
          const profile = await api.getProfileById(slug);
          if (!mounted) return;
          if (profile) {
            // ensure we have basic user info as fallback
            let userInfo: any = null;
            try {
              userInfo = await api.getUserById(slug);
            } catch {}

            setP((prev) => ({
              ...prev,
              name:
                (userInfo && `${userInfo.first_name} ${userInfo.last_name}`) ||
                prev.name,
              username: slug,
              avatar:
                absoluteUrl(
                  (userInfo && userInfo.profile_photo) ||
                    profile.profile_photo ||
                    prev.avatar,
                ) || prev.avatar,
              cover:
                absoluteUrl(
                  (userInfo && userInfo.cover_photo) ||
                    profile.cover ||
                    prev.cover,
                ) || prev.cover,
              bio: profile.bio ?? prev.bio,
              hometown: profile.hometown ?? prev.hometown,
              currentCity: profile.current_city ?? prev.currentCity,
              relationshipStatus:
                profile.relationship_status ?? prev.relationshipStatus,
              workplace:
                profile.workplace_company && profile.workplace_title
                  ? `${profile.workplace_company} • ${profile.workplace_title}`
                  : prev.workplace,
              positions: Array.isArray(profile.positions)
                ? profile.positions.map((p: any) => ({
                    company: p.company,
                    title: p.title,
                    start: p.start,
                    end: p.end,
                  }))
                : prev.positions,
              education: Array.isArray(profile.education)
                ? profile.education.map((e: any) => ({
                    institution: e.institution,
                    degree: e.degree,
                    start: e.start,
                    end: e.end,
                  }))
                : prev.education,
            }));
            return;
          }
        } catch (e) {
          // fall back to posts if profile endpoint not available
        }

        // fallback: try to infer from posts
        const posts = await api.getPosts();
        const toSlug = (s: string) =>
          String(s || '')
            .replace(/\s+/g, '')
            .toLowerCase();
        const match = posts.find((x) => toSlug(x.user_name) === slug);
        if (!mounted) return;
        if (match) {
          setP((prev) => ({
            ...prev,
            name: match.user_name,
            username: slug,
            avatar: absoluteUrl(match.user_profile_photo) || prev.avatar,
            cover: absoluteUrl(match.user_cover_photo) || prev.cover,
          }));
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <TopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Image source={{ uri: p.cover }} style={styles.cover} />
        <View style={styles.headerRow}>
          <Image source={{ uri: p.avatar }} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.handle}>@{p.username}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre mim</Text>
          <Text style={styles.text}>{p.bio}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações pessoais</Text>
          <InfoRow icon={Home} label="Cidade natal" value={p.hometown} />
          <InfoRow icon={MapPin} label="Cidade atual" value={p.currentCity} />
          <InfoRow
            icon={Heart}
            label="Relacionamento"
            value={p.relationshipStatus}
          />
          <InfoRow icon={Briefcase} label="Trabalho" value={p.workplace} />
          <InfoRow
            icon={Heart}
            label="Conexões"
            value={`${p.connectionsCount}`}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cargos e Empregos</Text>
          {p.positions.map((pos, i) => (
            <View key={`${pos.company}-${i}`} style={styles.rowBetween}>
              <View>
                <Text style={styles.itemTitle}>{pos.title}</Text>
                <Text style={styles.itemSub}>{pos.company}</Text>
              </View>
              <Text style={styles.itemTime}>
                {pos.start} — {pos.end || 'Presente'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formações</Text>
          {p.education.map((e, i) => (
            <View key={`${e.institution}-${i}`} style={styles.rowBetween}>
              <View>
                <Text style={styles.itemTitle}>{e.degree}</Text>
                <Text style={styles.itemSub}>{e.institution}</Text>
              </View>
              <Text style={styles.itemTime}>
                {e.start} — {e.end || 'Presente'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Grupos</Text>
          {p.groups.map((g) => (
            <View key={g.id} style={styles.rowBetween}>
              <Text style={styles.itemTitle}>{g.name}</Text>
              <Text style={styles.itemSub}>{g.members} membros</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amizades recentes</Text>
          <View style={styles.friendsRow}>
            {p.recentFriends.map((f) => (
              <View key={f.id} style={styles.friendItem}>
                <Image source={{ uri: f.avatar }} style={styles.friendAvatar} />
                <Text style={styles.friendName}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#e9eef8',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Icon size={14} color="#64748b" />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 140 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: -32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  handle: { color: '#6b7280', marginTop: 2 },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5edf6',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    color: '#111827',
  },
  text: { color: '#374151', lineHeight: 20 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: { color: '#6b7280' },
  infoValue: { color: '#111827', fontWeight: '600' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemTitle: { color: '#111827', fontWeight: '700' },
  itemSub: { color: '#6b7280' },
  itemTime: { color: '#6b7280' },
  friendsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  friendItem: { width: '33.33%', alignItems: 'center', marginBottom: 12 },
  friendAvatar: { width: 64, height: 64, borderRadius: 32 },
  friendName: {
    marginTop: 6,
    color: '#111827',
    fontSize: 12,
    textAlign: 'center',
  },
});
