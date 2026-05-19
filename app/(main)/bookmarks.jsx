import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../../firebase/config';
import { useAppContext } from '../../context/AppContext';
import { useLocation, getDistanceLabel } from '../../hooks/useLocation';
import DestinationCard from '../../components/ui/DestinationCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

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
        <Text style={styles.title}>Saved Places</Text>
        <Text style={styles.subtitle}>{destinations.length} saved</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : destinations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔖</Text>
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
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 8 },
  emptyBody: {
    ...typography.preset.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
