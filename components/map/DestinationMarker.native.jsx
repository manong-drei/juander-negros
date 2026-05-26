import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { categoryById } from '../../constants/categories';
import { colors } from '../../constants/colors';

export default function DestinationMarker({ destination, onPress }) {
  const primaryCat = destination.categories?.[0];
  const cat = categoryById[primaryCat];
  const pinColor = cat?.color ?? colors.primary;

  return (
    <Marker
      coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
      onPress={() => onPress(destination)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        <View style={[styles.bubble, { borderColor: pinColor }]}>
          <MaterialIcons name={cat?.icon ?? 'place'} size={18} color={pinColor} />
        </View>
        <View style={[styles.tail, { borderTopColor: pinColor }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 6,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
