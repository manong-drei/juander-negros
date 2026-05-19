import { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function BookmarkButton({ saved, onPress, size = 24, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
  }, [saved]);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, style]} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialIcons
          name={saved ? 'bookmark' : 'bookmark-border'}
          size={size}
          color={saved ? colors.accent : colors.textMuted}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.dot,
          { transform: [{ scale }] },
          saved ? styles.dotActive : styles.dotInactive,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    bottom: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: { backgroundColor: colors.accent },
  dotInactive: { backgroundColor: 'transparent' },
});
