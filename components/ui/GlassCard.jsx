import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../constants/colors';

export default function GlassCard({ style, children, intensity = 40 }) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[styles.card, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
});
