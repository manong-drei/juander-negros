import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function SplashLogin() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juander Negros</Text>
      <Text style={styles.subtitle}>Discover the beauty of Negros Island</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    ...typography.heading1,
    color: colors.textOnPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.primaryPale,
    textAlign: 'center',
  },
});
