import { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../../firebase/config';
import { useAppContext } from '../../context/AppContext';
import { useLocation, getDistanceLabel } from '../../hooks/useLocation';
import DestinationCard from '../../components/ui/DestinationCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const FILTER_CHIPS = ['All', 'Attractions', 'Restaurants', 'Resorts'];

export default function BookmarksScreen() {
  const { user } = useAppContext();
  const { location } = useLocation();
  const router = useRouter();

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, 'bookmarks', user.uid, 'places'),
      async (snap) => {
        if (snap.empty) { setDestinations([]); setLoading(false); return; }
        const ids = snap.docs.map((d) => d.data().destinationId);
        const fetched = await Promise.all(
          ids.map((id) => getDoc(doc(db, 'destinations', id)))
        );
        setDestinations(
          fetched.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }))
        );
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookmarks</Text>
        <Text style={styles.subtitle}>
          {destinations.length} {destinations.length === 1 ? 'place' : 'places'} saved
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_CHIPS.map((label, i) => (
          <View key={label} style={[styles.filterChip, i === 0 && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, i === 0 && styles.filterChipTextActive]}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : destinations.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="bookmark-border" size={72} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyBody}>
            Tap the bookmark button on any destination to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={destinations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DestinationCard
              item={item}
              distance={getDistanceLabel(location, item)}
              onPress={() => router.push(`/destination/${item.id}`)}
              horizontal={false}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.preset.heading1, color: colors.textPrimary },
  subtitle: { ...typography.preset.caption, color: colors.textMuted, marginTop: 4 },

  filterRow: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: 20, paddingVertical: 14, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  filterChipText: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase' },
  filterChipTextActive: { color: colors.primary },

  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { marginBottom: 20 },
  emptyTitle: { ...typography.preset.heading2, color: colors.textPrimary, marginBottom: 10 },
  emptyBody: {
    ...typography.preset.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
