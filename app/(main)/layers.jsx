import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import CategoryChip from '../../components/ui/CategoryChip';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const AMENITY_ROWS = [
  { type: 'atm',        label: 'ATMs',              icon: '💳' },
  { type: 'hotel',      label: 'Hotels',             icon: '🏨' },
  { type: 'restaurant', label: 'Local Restaurants',  icon: '🍴' },
];

export default function LayersScreen() {
  const { profile, amenityLayers, toggleAmenityLayer } = useAppContext();
  const isTourist = profile?.class === 'tourist';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Map Layers</Text>

        {isTourist ? (
          <>
            {/* Amenity Layers */}
            <Text style={styles.sectionTitle}>Amenity Layers</Text>
            <GlassCard style={styles.card}>
              {AMENITY_ROWS.map((row, i) => (
                <View
                  key={row.type}
                  style={[styles.row, i === AMENITY_ROWS.length - 1 && styles.rowLast]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowIcon}>{row.icon}</Text>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                  </View>
                  <Switch
                    value={amenityLayers?.[row.type] ?? true}
                    onValueChange={() => toggleAmenityLayer(row.type)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.offWhite}
                  />
                </View>
              ))}
            </GlassCard>

            {/* Category Filters */}
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Destination Categories</Text>
            <GlassCard style={styles.card}>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((cat) => (
                  <CategoryChip key={cat.id} categoryId={cat.id} />
                ))}
              </View>
            </GlassCard>
          </>
        ) : (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedIcon}>🗂️</Text>
            <Text style={styles.lockedTitle}>Layers for Tourists</Text>
            <Text style={styles.lockedBody}>
              Amenity layers (ATMs, Hotels, Local Restaurants) are available when exploring as a tourist.
              Update your profile type to unlock this feature.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { ...typography.preset.heading1, color: colors.textPrimary, marginBottom: 24 },
  sectionTitle: { ...typography.preset.heading3, color: colors.textSecondary, marginBottom: 14 },

  card: { marginBottom: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { fontSize: 20 },
  rowLabel: { ...typography.preset.subtitle, color: colors.textPrimary },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },

  lockedBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  lockedIcon: { fontSize: 56, marginBottom: 16 },
  lockedTitle: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  lockedBody: { ...typography.preset.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
