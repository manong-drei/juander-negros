import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import GlassCard from '../../components/ui/GlassCard';
import DestinationCard from '../../components/ui/DestinationCard';
import DestinationMarker from '../../components/map/DestinationMarker';
import AmenityMarker from '../../components/map/AmenityMarker';
import { useAppContext } from '../../context/AppContext';
import { useMapData } from '../../hooks/useMapData';
import { useLocation, getDistanceLabel, getDistanceKm } from '../../hooks/useLocation';
import { darkMapStyle } from '../../constants/mapStyle';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const { width: SCREEN_W } = Dimensions.get('window');

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

export default function MapScreen() {
  const router = useRouter();
  const { profile } = useAppContext();
  const { destinations, amenities } = useMapData(profile);
  const { location } = useLocation();

  const mapRef = useRef(null);
  const listRef = useRef(null);

  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [layers, setLayers] = useState({ atm: true, hotel: true, restaurant: true });
  const [activeIndex, setActiveIndex] = useState(0);

  const sortedDestinations = [...destinations].sort((a, b) =>
    getDistanceKm(location, a) - getDistanceKm(location, b)
  );

  function toggleLayer(type) {
    setLayers((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  function openDestination(item) {
    router.push(`/destination/${item.id}`);
  }

  function onCardScroll(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / (200 + 12));
    if (index !== activeIndex && sortedDestinations[index]) {
      setActiveIndex(index);
      const dest = sortedDestinations[index];
      mapRef.current?.animateToRegion({
        latitude: dest.latitude,
        longitude: dest.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 350);
    }
  }

  function onMarkerPress(item) {
    const idx = sortedDestinations.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      setActiveIndex(idx);
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
    openDestination(item);
  }

  const visibleAmenities = amenities.filter((a) => layers[a.type]);

  const renderCard = useCallback(({ item }) => (
    <DestinationCard
      item={item}
      distance={getDistanceLabel(location, item)}
      onPress={() => openDestination(item)}
      horizontal
    />
  ), [location]);

  const renderListItem = useCallback(({ item }) => (
    <DestinationCard
      item={item}
      distance={getDistanceLabel(location, item)}
      onPress={() => openDestination(item)}
      horizontal={false}
    />
  ), [location]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {viewMode === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            customMapStyle={darkMapStyle}
            initialRegion={NEGROS_REGION}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {sortedDestinations.map((dest) => (
              <DestinationMarker
                key={dest.id}
                destination={dest}
                onPress={onMarkerPress}
              />
            ))}
            {visibleAmenities.map((amenity) => (
              <AmenityMarker key={amenity.id} amenity={amenity} />
            ))}
          </MapView>

          {/* Top controls */}
          <SafeAreaView edges={['top']} style={styles.topControls} pointerEvents="box-none">
            {/* Map/List toggle */}
            <GlassCard style={styles.toggleCard}>
              <TouchableOpacity onPress={() => setViewMode('list')} style={styles.toggleBtn}>
                <Text style={styles.toggleIcon}>☰</Text>
                <Text style={styles.toggleText}>List</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Tourist layer toggle */}
            {profile?.class === 'tourist' && (
              <GlassCard style={styles.layerCard}>
                {[
                  { type: 'atm', label: 'ATM', icon: '💳' },
                  { type: 'hotel', label: 'Hotels', icon: '🏨' },
                  { type: 'restaurant', label: 'Eats', icon: '🍴' },
                ].map((l) => (
                  <TouchableOpacity
                    key={l.type}
                    style={[styles.layerBtn, layers[l.type] && styles.layerBtnActive]}
                    onPress={() => toggleLayer(l.type)}
                  >
                    <Text style={styles.layerIcon}>{l.icon}</Text>
                    <Text style={[styles.layerLabel, layers[l.type] && { color: colors.primary }]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            )}
          </SafeAreaView>

          {/* Bottom card strip */}
          <View style={styles.cardStrip}>
            <FlatList
              ref={listRef}
              data={sortedDestinations}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              onScroll={onCardScroll}
              scrollEventThrottle={16}
              snapToInterval={212}
              decelerationRate="fast"
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No destinations match your preferences.</Text>
                </View>
              }
            />
          </View>
        </>
      ) : (
        /* List view */
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Nearby Destinations</Text>
            <TouchableOpacity onPress={() => setViewMode('map')} style={styles.mapToggleBtn}>
              <Text style={styles.mapToggleText}>🗺 Map</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sortedDestinations}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No destinations match your preferences.</Text>
            }
          />
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  toggleCard: { alignSelf: 'center', borderRadius: 50, overflow: 'hidden' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggleIcon: { fontSize: 16, color: colors.textSecondary },
  toggleText: { ...typography.preset.label, color: colors.textSecondary },

  layerCard: { alignSelf: 'center', borderRadius: 50, flexDirection: 'row' },
  layerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 50,
  },
  layerBtnActive: { backgroundColor: colors.primaryDim },
  layerIcon: { fontSize: 14 },
  layerLabel: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase' },

  cardStrip: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
  cardList: { paddingHorizontal: 16, paddingVertical: 4 },

  emptyCard: {
    width: SCREEN_W - 64,
    height: 160,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', padding: 16 },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: { ...typography.preset.heading2, color: colors.textPrimary },
  mapToggleBtn: {
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapToggleText: { ...typography.preset.label, color: colors.primary },
  listContent: { padding: 16 },
});
