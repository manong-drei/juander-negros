import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { darkMapStyle } from '../../constants/mapStyle';

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

export default function MapCoordinatePicker({ tempCoord, onSetCoord }) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={
        tempCoord
          ? { ...tempCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          : NEGROS_REGION
      }
      customMapStyle={darkMapStyle}
      onLongPress={(e) => onSetCoord(e.nativeEvent.coordinate)}
    >
      {tempCoord && (
        <Marker
          coordinate={tempCoord}
          draggable
          pinColor={colors.primary}
          onDragEnd={(e) => onSetCoord(e.nativeEvent.coordinate)}
        />
      )}
    </MapView>
  );
}
