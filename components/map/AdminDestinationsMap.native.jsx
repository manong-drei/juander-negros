import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { darkMapStyle } from '../../constants/mapStyle';

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

const AMENITY_ICONS = { atm: '💳', hotel: '🏨', restaurant: '🍴' };

export default function AdminDestinationsMap({
  mapRef,
  destinations,
  visibleAmenities,
  onSelectDestination,
  markerStyles,
}) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={NEGROS_REGION}
      customMapStyle={darkMapStyle}
      showsUserLocation
      showsCompass={false}
    >
      {destinations.map((dest) => (
        <Marker
          key={dest.id}
          coordinate={{ latitude: dest.latitude, longitude: dest.longitude }}
          opacity={dest.isActive ? 1 : 0.35}
          onPress={() => onSelectDestination(dest)}
        >
          <View style={[markerStyles.markerBubble, !dest.isActive && markerStyles.markerBubbleInactive]}>
            <MaterialIcons
              name={CATEGORIES.find((c) => dest.categories?.[0] === c.id)?.icon ?? 'place'}
              size={18}
              color={dest.isActive ? '#fff' : '#aaa'}
            />
          </View>
        </Marker>
      ))}
      {visibleAmenities.map((a) => (
        <Marker
          key={a.id}
          coordinate={{ latitude: a.latitude, longitude: a.longitude }}
        >
          <View
            style={[
              markerStyles.amenityBubble,
              { backgroundColor: colors.amenity[a.type] + '30', borderColor: colors.amenity[a.type] },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{AMENITY_ICONS[a.type]}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
