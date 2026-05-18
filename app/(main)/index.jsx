import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function HomeMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home / Map</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});
