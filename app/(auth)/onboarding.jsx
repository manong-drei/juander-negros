import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding — Pick your interests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
