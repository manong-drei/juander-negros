import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { categoryById } from '../../constants/categories';
import { typography } from '../../constants/typography';
import { colors } from '../../constants/colors';

export default function CategoryChip({ categoryId, style }) {
  const cat = categoryById[categoryId];
  if (!cat) return null;
  return (
    <View style={[styles.chip, { borderColor: cat.color + '50' }, style]}>
      <MaterialIcons name={cat.icon} size={12} color={cat.color} />
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
  label: { ...typography.preset.chip, textTransform: 'uppercase' },
});
