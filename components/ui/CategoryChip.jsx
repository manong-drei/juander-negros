import { View, Text, StyleSheet } from 'react-native';
import { categoryById } from '../../constants/categories';
import { typography } from '../../constants/typography';
import { colors } from '../../constants/colors';

export default function CategoryChip({ categoryId, style }) {
  const cat = categoryById[categoryId];
  if (!cat) return null;
  return (
    <View style={[styles.chip, { borderColor: cat.color + '50' }, style]}>
      <Text style={styles.icon}>{cat.icon}</Text>
      <Text style={[styles.label, { color: cat.color }]}>{cat.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  icon: { fontSize: 12 },
  label: { ...typography.preset.chip, textTransform: 'uppercase' },
});
