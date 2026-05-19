import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import CategoryChip from './CategoryChip';

function PhotoFallback({ style }) {
  return (
    <View style={[style, styles.fallback]}>
      <Text style={styles.fallbackIcon}>🌴</Text>
    </View>
  );
}

export default function DestinationCard({ item, distance, onPress, horizontal = true }) {
  const photo = item.photos?.[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={horizontal ? styles.cardH : styles.cardV}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={horizontal ? styles.imageH : styles.imageV}
          resizeMode="cover"
        />
      ) : (
        <PhotoFallback style={horizontal ? styles.imageH : styles.imageV} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.row}>
          {item.categories?.[0] && <CategoryChip categoryId={item.categories[0]} />}
          {distance ? (
            <Text style={styles.distance}>{distance}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardH: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  cardV: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  imageH: { width: '100%', height: 130 },
  imageV: { width: 100, height: 90 },
  fallback: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  fallbackIcon: { fontSize: 36 },
  info: { padding: 12, flex: 1 },
  name: { ...typography.preset.subtitle, color: colors.textPrimary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  distance: { ...typography.preset.caption, color: colors.textMuted },
});
