import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminContext } from '../../context/AdminContext';
import GlassCard from '../../components/ui/GlassCard';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

function BarRow({ label, count, pct, color, showCount = true }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel}>{label}</Text>
        {showCount && <Text style={styles.barCount}>{count}</Text>}
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function RankedDestRow({ rank, dest, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <View style={[styles.rankedRow, rank === 1 && styles.rankedRowFirst]}>
      <View style={[styles.rankCircle, rank <= 3 && styles.rankCircleTop]}>
        <Text style={[styles.rankText, rank <= 3 && { color: colors.accent }]}>{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rankedName} numberOfLines={1}>{dest.name}</Text>
        <View style={styles.rankedBarTrack}>
          <View style={[styles.rankedBarFill, { width: `${Math.max(pct, 2)}%` }]} />
        </View>
      </View>
      <View style={styles.saveBadge}>
        <Text style={styles.saveBadgeText}>🔖 {count}</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { destinations, allUsers, bookmarkCounts } = useAdminContext();

  const activeDestinations = destinations.filter((d) => d.isActive);
  const totalBookmarks = Object.values(bookmarkCounts).reduce((s, n) => s + n, 0);
  const avgSaves = activeDestinations.length > 0
    ? (totalBookmarks / activeDestinations.length).toFixed(1)
    : 0;
  const unsavedCount = activeDestinations.filter((d) => !bookmarkCounts[d.id]).length;

  // Most saved — top 10
  const rankedDestinations = useMemo(() =>
    [...activeDestinations]
      .sort((a, b) => (bookmarkCounts[b.id] ?? 0) - (bookmarkCounts[a.id] ?? 0))
      .slice(0, 10),
    [destinations, bookmarkCounts],
  );
  const maxSaves = bookmarkCounts[rankedDestinations[0]?.id] ?? 1;

  // Destinations per category
  const destPerCategory = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((c) => (counts[c.id] = 0));
    activeDestinations.forEach((d) =>
      (d.categories ?? []).forEach((cat) => { if (cat in counts) counts[cat]++; }),
    );
    return counts;
  }, [destinations]);
  const maxDestPerCat = Math.max(...Object.values(destPerCategory), 1);

  // User interests
  const interestCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((c) => (counts[c.id] = 0));
    allUsers.forEach((u) => (u.interests ?? []).forEach((i) => { if (i in counts) counts[i]++; }));
    return counts;
  }, [allUsers]);
  const maxInterest = Math.max(...Object.values(interestCounts), 1);
  const sortedInterests = [...CATEGORIES]
    .map((c) => ({ ...c, count: interestCounts[c.id] }))
    .sort((a, b) => b.count - a.count);

  // Demographics
  const total = allUsers.length || 1;
  const localCount   = allUsers.filter((u) => u.class === 'local').length;
  const touristCount = allUsers.filter((u) => u.class === 'tourist').length;
  const travelCounts = { solo: 0, family: 0, group: 0 };
  allUsers.forEach((u) => { if (u.travelType) travelCounts[u.travelType]++; });
  const maxTravel = Math.max(...Object.values(travelCounts), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Save Activity Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalBookmarks}</Text>
            <Text style={styles.summaryLabel}>Total Saves</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgSaves}</Text>
            <Text style={styles.summaryLabel}>Avg per Place</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: unsavedCount > 0 ? colors.danger : colors.primary }]}>
              {unsavedCount}
            </Text>
            <Text style={styles.summaryLabel}>Unsaved Places</Text>
          </View>
        </View>

        {/* Most Saved Destinations */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Most Saved Destinations</Text>
          {rankedDestinations.length === 0
            ? <Text style={styles.emptyText}>No save data yet.</Text>
            : rankedDestinations.map((dest, i) => (
                <RankedDestRow
                  key={dest.id}
                  rank={i + 1}
                  dest={dest}
                  count={bookmarkCounts[dest.id] ?? 0}
                  maxCount={maxSaves}
                />
              ))
          }
        </GlassCard>

        {/* Category Coverage */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Destinations per Category</Text>
          {CATEGORIES.map((cat) => (
            <BarRow
              key={cat.id}
              label={`${cat.icon} ${cat.label}`}
              count={destPerCategory[cat.id]}
              pct={(destPerCategory[cat.id] / maxDestPerCat) * 100}
              color={cat.color}
            />
          ))}
        </GlassCard>

        {/* User Interests */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>User Interests</Text>
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

        {/* Demographics */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>User Demographics</Text>
          <Text style={styles.subTitle}>Class</Text>
          <BarRow label="🏡 Local"    count={localCount}   pct={(localCount / total) * 100}   color={colors.primary} />
          <BarRow label="✈️ Tourist"  count={touristCount} pct={(touristCount / total) * 100} color={colors.accent} />
          <Text style={[styles.subTitle, { marginTop: 14 }]}>Travel Style</Text>
          <BarRow label="🧍 Solo"     count={travelCounts.solo}   pct={(travelCounts.solo / maxTravel) * 100}   color={colors.primary} />
          <BarRow label="👨‍👩‍👧 Family"  count={travelCounts.family} pct={(travelCounts.family / maxTravel) * 100} color={colors.accent} />
          <BarRow label="👥 Group"    count={travelCounts.group}  pct={(travelCounts.group / maxTravel) * 100}  color={colors.category.adventure} />
        </GlassCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.preset.heading1, color: colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: 'center' },
  summaryValue: { ...typography.preset.heading2, color: colors.primary },
  summaryLabel: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', marginTop: 4, textAlign: 'center', fontSize: 9 },

  card: { marginBottom: 14, padding: 16 },
  cardTitle: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 14 },
  subTitle: { ...typography.preset.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  barRow: { marginBottom: 12 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel: { ...typography.preset.label, color: colors.textSecondary },
  barCount: { ...typography.preset.label, color: colors.textMuted },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.card, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  rankedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankedRowFirst: { paddingTop: 0 },
  rankCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  rankCircleTop: { backgroundColor: colors.accentDim },
  rankText: { ...typography.preset.label, color: colors.primary },
  rankedName: { ...typography.preset.subtitle, color: colors.textPrimary, marginBottom: 6 },
  rankedBarTrack: { height: 4, borderRadius: 2, backgroundColor: colors.card, overflow: 'hidden' },
  rankedBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  saveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 4 },
  saveBadgeText: { ...typography.preset.label, color: colors.accent },

  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
