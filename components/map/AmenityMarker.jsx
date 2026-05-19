import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../../constants/colors';

const TYPE_CONFIG = {
  atm: { icon: '💳', color: colors.amenity.atm, shape: 'square' },
  hotel: { icon: '🏨', color: colors.amenity.hotel, shape: 'circle' },
  restaurant: { icon: '🍴', color: colors.amenity.restaurant, shape: 'circle' },
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
        <Text style={styles.icon}>{cfg.icon}</Text>
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
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 4,
  },
  square: { borderRadius: 6 },
  icon: { fontSize: 14 },
});
