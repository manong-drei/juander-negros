import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MapView, { PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import GlassCard from "../../components/ui/GlassCard";
import DestinationCard from "../../components/ui/DestinationCard";
import DestinationMarker from "../../components/map/DestinationMarker";
import AmenityMarker from "../../components/map/AmenityMarker";
import { useAppContext } from "../../context/AppContext";
import { useDirections } from "../_layout";
import { useToast } from "../../components/ui/Toast";
import { useMapData } from "../../hooks/useMapData";
import {
  useLocation,
  getDistanceLabel,
  getDistanceKm,
} from "../../hooks/useLocation";
import { darkMapStyle } from "../../constants/mapStyle";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

function decodePolyline(encoded) {
  const points = [];
  let index = 0,
    lat = 0,
    lng = 0;
  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const { width: SCREEN_W } = Dimensions.get("window");

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

const LAYER_BUTTONS = [
  { type: "atm", label: "ATMs", icon: "atm" },
  { type: "hotel", label: "Hotels", icon: "hotel" },
  { type: "restaurant", label: "Eats", icon: "restaurant" },
];

export default function MapScreen() {
  const router = useRouter();
  const { profile } = useAppContext();
  const { destinations, amenities } = useMapData(profile);
  const { location } = useLocation();

  const { directionsTo, setDirectionsTo } = useDirections();
  const toast = useToast();

  const mapRef = useRef(null);
  const listRef = useRef(null);

  const [viewMode, setViewMode] = useState("map");
  const [amenityLayers, setAmenityLayers] = useState({
    atm: true,
    hotel: true,
    restaurant: true,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  // Local user amenity toggle
  const [showAmenities, setShowAmenities] = useState(false);

  function toggleLayer(type) {
    setAmenityLayers((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  useEffect(() => {
    if (!directionsTo || !location) return;

    async function fetchRoute() {
      setRouteLoading(true);
      setRouteCoords([]);
      setRouteInfo(null);
      try {
        const origin = `${location.latitude},${location.longitude}`;
        const dest = `${directionsTo.latitude},${directionsTo.longitude}`;
        const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${key}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status !== "OK") {
          toast.show({
            title: "Directions unavailable",
            message: `${json.status}: ${json.error_message ?? ""}`,
            type: "error",
          });
        } else if (json.routes?.length) {
          const leg = json.routes[0].legs[0];
          setRouteCoords(
            decodePolyline(json.routes[0].overview_polyline.points),
          );
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
          });
          mapRef.current?.fitToCoordinates(
            [
              { latitude: location.latitude, longitude: location.longitude },
              {
                latitude: directionsTo.latitude,
                longitude: directionsTo.longitude,
              },
            ],
            {
              edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
              animated: true,
            },
          );
        }
      } catch (e) {
        toast.show({
          title: "Directions fetch failed",
          message: e.message,
          type: "error",
        });
      } finally {
        setRouteLoading(false);
      }
    }

    fetchRoute();
    setViewMode("map");
  }, [directionsTo]);

  function clearDirections() {
    setDirectionsTo(null);
    setRouteCoords([]);
    setRouteInfo(null);
  }

  const sortedDestinations = [...destinations].sort(
    (a, b) => getDistanceKm(location, a) - getDistanceKm(location, b),
  );

  function openDestination(item) {
    router.push(`/destination/${item.id}`);
  }

  function onCardScroll(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / (200 + 12));
    if (index !== activeIndex && sortedDestinations[index]) {
      setActiveIndex(index);
      const dest = sortedDestinations[index];
      mapRef.current?.animateToRegion(
        {
          latitude: dest.latitude,
          longitude: dest.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        350,
      );
    }
  }

  function onMarkerPress(item) {
    const idx = sortedDestinations.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      setActiveIndex(idx);
      listRef.current?.scrollToIndex({
        index: idx,
        animated: true,
        viewPosition: 0.5,
      });
    }
    openDestination(item);
  }

  // FIX 2: locals only see amenities when showAmenities is true; tourists use amenityLayers as before
  const visibleAmenities =
    profile?.class === "tourist" || showAmenities
      ? amenities.filter((a) => amenityLayers[a.type])
      : [];

  const renderCard = useCallback(
    ({ item }) => (
      <DestinationCard
        item={item}
        distance={getDistanceLabel(location, item)}
        onPress={() => openDestination(item)}
        horizontal
      />
    ),
    [location],
  );

  const renderListItem = useCallback(
    ({ item }) => (
      <DestinationCard
        item={item}
        distance={getDistanceLabel(location, item)}
        onPress={() => openDestination(item)}
        horizontal={false}
      />
    ),
    [location],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {viewMode === "map" ? (
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
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={colors.primary}
                strokeWidth={4}
                lineDashPattern={[0]}
              />
            )}
          </MapView>

          {/* FIX 3: Top controls overlay — view toggle + layer buttons (tourist) or amenity toggle (local) */}
          <View style={styles.topControls}>
            <GlassCard style={styles.toggleCard}>
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                style={styles.toggleBtn}
              >
                <MaterialIcons
                  name="list"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.toggleText}>List View</Text>
              </TouchableOpacity>
            </GlassCard>

            {profile?.class === "tourist" && (
              <GlassCard style={styles.layerCard}>
                {LAYER_BUTTONS.map(({ type, label, icon }) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleLayer(type)}
                    style={[
                      styles.layerBtn,
                      amenityLayers[type] && styles.layerBtnActive,
                    ]}
                  >
                    <MaterialIcons
                      name={icon}
                      size={14}
                      color={
                        amenityLayers[type] ? colors.primary : colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.layerLabel,
                        amenityLayers[type] && { color: colors.primary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            )}

            {profile?.class === "local" && (
              <GlassCard style={styles.toggleCard}>
                <TouchableOpacity
                  onPress={() => setShowAmenities((prev) => !prev)}
                  style={styles.toggleBtn}
                >
                  <MaterialIcons
                    name="place"
                    size={16}
                    color={
                      showAmenities ? colors.primary : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      showAmenities && { color: colors.primary },
                    ]}
                  >
                    {showAmenities ? "Hide Amenities" : "Show Amenities"}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            )}
          </View>

          {/* Route nav bar */}
          {routeInfo && (
            <View style={styles.navBar}>
              <MaterialIcons
                name="navigation"
                size={20}
                color={colors.primary}
              />
              <View style={styles.navInfo}>
                <Text style={styles.navName}>
                  {directionsTo?.name ?? "Destination"}
                </Text>
                <Text style={styles.navMeta}>
                  {routeInfo.distance} · {routeInfo.duration}
                </Text>
              </View>
              <TouchableOpacity
                onPress={clearDirections}
                style={styles.navEndBtn}
              >
                <Text style={styles.navEndText}>End</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FIX 1: Restored card strip with correct FlatList opening tag, data, renderItem, and wrapping View */}
          {!routeInfo && (
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
                    <Text style={styles.emptyText}>
                      No destinations match your preferences.
                    </Text>
                  </View>
                }
              />
            </View>
          )}

          {routeLoading && (
            <ActivityIndicator
              style={{ position: "absolute", top: "50%", alignSelf: "center" }}
              color={colors.primary}
              size="large"
            />
          )}
        </>
      ) : (
        /* List view */
        <SafeAreaView
          edges={["top"]}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Nearby Destinations</Text>
            <TouchableOpacity
              onPress={() => setViewMode("map")}
              style={styles.mapToggleBtn}
            >
              <MaterialIcons
                name="map"
                size={14}
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.mapToggleText}>Map View</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sortedDestinations}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No destinations match your preferences.
              </Text>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIconStyle: { marginRight: 10 },
  searchPlaceholder: {
    ...typography.preset.body,
    color: colors.textMuted,
    flex: 1,
  },

  toggleCard: { alignSelf: "center", borderRadius: 50, overflow: "hidden" },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggleText: { ...typography.preset.label, color: colors.textSecondary },

  layerCard: { alignSelf: "center", borderRadius: 50, flexDirection: "row" },
  layerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 50,
  },
  layerBtnActive: { backgroundColor: colors.primaryDim },
  layerLabel: {
    ...typography.preset.chip,
    color: colors.textMuted,
    textTransform: "uppercase",
  },

  navBar: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  navInfo: { flex: 1 },
  navName: { ...typography.preset.subtitle, color: colors.textPrimary },
  navMeta: {
    ...typography.preset.caption,
    color: colors.primary,
    marginTop: 2,
  },
  navEndBtn: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navEndText: { ...typography.preset.button, color: colors.textPrimary },

  cardStrip: { position: "absolute", bottom: 90, left: 0, right: 0 },
  cardList: { paddingHorizontal: 16, paddingVertical: 4 },

  emptyCard: {
    width: SCREEN_W - 64,
    height: 160,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  emptyText: {
    ...typography.preset.body,
    color: colors.textMuted,
    textAlign: "center",
    padding: 16,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: { ...typography.preset.heading2, color: colors.textPrimary },
  mapToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
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
