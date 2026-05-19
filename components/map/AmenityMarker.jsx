import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { colors } from '../../constants/colors';

const TYPE_CONFIG = {
  atm:        { icon: 'atm',        color: colors.amenity.atm,        shape: 'square' },
  hotel:      { icon: 'hotel',      color: colors.amenity.hotel,      shape: 'circle' },
  restaurant: { icon: 'restaurant', color: colors.amenity.restaurant, shape: 'circle' },
};

export default function AmenityMarker({ amenity, onPress }) {
  const cfg = TYPE_CONFIG[amenity.type] ?? TYPE_CONFIG.atm;

  return (
    <Marker
      coordinate={{ latitude: amenity.latitude, longitude: amenity.longitude }}
      onPress={() => onPress?.(amenity)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.pin,
          cfg.shape === 'square' && styles.square,
          { borderColor: cfg.color },
        ]}
      >
        <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 5,
  },
  square: { borderRadius: 6 },
});
