import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdminContext } from '../../context/AdminContext';
import GlassCard from '../../components/ui/GlassCard';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

// ── Shared mini-components ───────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarRow({ label, count, pct, color }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barCount}>{count}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function TopSavedRow({ rank, dest, count }) {
  return (
    <View style={[styles.topRow, rank === 5 && { borderBottomWidth: 0 }]}>
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <Text style={styles.topName} numberOfLines={1}>{dest.name}</Text>
      <View style={styles.saveBadge}>
        <Text style={styles.saveBadgeText}>🔖 {count}</Text>
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { destinations, amenities, allUsers, bookmarkCounts } = useAdminContext();
  const router = useRouter();

  const activeDestCount = destinations.filter((d) => d.isActive).length;
  const activeAmenCount = amenities.filter((a) => a.isActive).length;
  const totalBookmarks  = Object.values(bookmarkCounts).reduce((s, n) => s + n, 0);
  const total           = allUsers.length || 1;

  const localCount   = allUsers.filter((u) => u.class === 'local').length;
  const touristCount = allUsers.filter((u) => u.class === 'tourist').length;

  const travelCounts = { solo: 0, family: 0, group: 0 };
  allUsers.forEach((u) => { if (u.travelType) travelCounts[u.travelType]++; });
  const maxTravel = Math.max(...Object.values(travelCounts), 1);

  const interestCounts = {};
  CATEGORIES.forEach((c) => (interestCounts[c.id] = 0));
  allUsers.forEach((u) => (u.interests ?? []).forEach((i) => { if (i in interestCounts) interestCounts[i]++; }));
  const sortedInterests = [...CATEGORIES]
    .map((c) => ({ ...c, count: interestCounts[c.id] }))
    .sort((a, b) => b.count - a.count);
  const maxInterest = Math.max(...sortedInterests.map((i) => i.count), 1);

  const top5Saved = useMemo(() =>
    [...destinations]
      .filter((d) => d.isActive)
      .sort((a, b) => (bookmarkCounts[b.id] ?? 0) - (bookmarkCounts[a.id] ?? 0))
      .slice(0, 5),
    [destinations, bookmarkCounts],
  );

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>{today}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stat cards */}
        <View style={styles.statRow}>
          <StatCard icon="📍" label="Active Places"  value={activeDestCount} />
          <StatCard icon="🏪" label="Amenities"      value={activeAmenCount} />
          <StatCard icon="👥" label="Users"          value={allUsers.length} />
          <StatCard icon="🔖" label="Total Saves"    value={totalBookmarks}  accent />
        </View>

        {/* Who's Exploring */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Who's Exploring</Text>
          <BarRow label="🏡 Local"    count={localCount}   pct={(localCount / total) * 100}   color={colors.primary} />
          <BarRow label="✈️ Tourist"  count={touristCount} pct={(touristCount / total) * 100} color={colors.accent} />
        </GlassCard>

        {/* Travel Behavior */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>How They Travel</Text>
          <BarRow label="🧍 Solo"       count={travelCounts.solo}   pct={(travelCounts.solo / maxTravel) * 100}   color={colors.primary} />
          <BarRow label="👨‍👩‍👧 Family"    count={travelCounts.family} pct={(travelCounts.family / maxTravel) * 100} color={colors.accent} />
          <BarRow label="👥 Group"      count={travelCounts.group}  pct={(travelCounts.group / maxTravel) * 100}  color={colors.category.adventure} />
        </GlassCard>

        {/* Top Interests */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Top Interests</Text>
          {sortedInterests.map((cat) => (
            <BarRow
              key={cat.id}
              label={`${cat.icon} ${cat.label}`}
              count={cat.count}
              pct={(cat.count / maxInterest) * 100}
              color={cat.color}
            />
          ))}
        </GlassCard>

        {/* Most Saved */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Most Saved Places</Text>
          {top5Saved.length === 0
            ? <Text style={styles.emptyText}>No destinations saved yet.</Text>
            : top5Saved.map((dest, i) => (
                <TopSavedRow key={dest.id} rank={i + 1} dest={dest} count={bookmarkCounts[dest.id] ?? 0} />
              ))
          }
        </GlassCard>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('/(admin)/destinations')}
          >
            <Text style={styles.quickIcon}>📍</Text>
            <Text style={styles.quickLabel}>Add Destination</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickBtnSecondary]}
            onPress={() => router.push('/(admin)/destinations')}
          >
            <Text style={styles.quickIcon}>🏪</Text>
            <Text style={[styles.quickLabel, { color: colors.accent }]}>Add Amenity</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.preset.heading1, color: colors.textPrimary },
  subtitle: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, padding: 12, alignItems: 'center', borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  statCardAccent: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { ...typography.preset.heading2, color: colors.textPrimary },
  statLabel: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', marginTop: 2, textAlign: 'center', fontSize: 9 },

  card: { marginBottom: 14, padding: 16 },
  cardTitle: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 14 },

  barRow: { marginBottom: 12 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel: { ...typography.preset.label, color: colors.textSecondary },
  barCount: { ...typography.preset.label, color: colors.textMuted },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  rankText: { ...typography.preset.label, color: colors.primary },
  topName: { ...typography.preset.subtitle, color: colors.textPrimary, flex: 1 },
  saveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 4 },
  saveBadgeText: { ...typography.preset.label, color: colors.accent },

  sectionLabel: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, backgroundColor: colors.primaryDim, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, paddingVertical: 16, alignItems: 'center', gap: 6 },
  quickBtnSecondary: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  quickIcon: { fontSize: 24 },
  quickLabel: { ...typography.preset.button, color: colors.primary },

  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
