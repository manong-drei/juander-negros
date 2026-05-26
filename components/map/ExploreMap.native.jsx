import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import DestinationMarker from './DestinationMarker';
import AmenityMarker from './AmenityMarker';
import { darkMapStyle } from '../../constants/mapStyle';
import { colors } from '../../constants/colors';

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

export default function ExploreMap({
  mapRef,
  destinations,
  amenities,
  routeCoords,
  onMarkerPress,
}) {
  return (
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
      {destinations.map((dest) => (
        <DestinationMarker
          key={dest.id}
          destination={dest}
          onPress={onMarkerPress}
        />
      ))}
      {amenities.map((amenity) => (
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
  );
}
