import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function MapPlaceholder({ style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Map not available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.preset.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
