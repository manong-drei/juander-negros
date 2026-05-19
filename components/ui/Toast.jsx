import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const ToastContext = createContext(null);

const TYPE_COLOR = {
  success: colors.primary,
  error: colors.danger,
  warning: '#F59E0B',
  info: colors.textSecondary,
};

function ToastBanner({ toast, translateY }) {
  const insets = useSafeAreaInsets();
  const accent = TYPE_COLOR[toast.type] ?? colors.textSecondary;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top + 12, borderLeftColor: accent, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{toast.title}</Text>
        {!!toast.message && <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>}
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const slideY = useRef(new Animated.Value(-120)).current;
  const timer = useRef(null);

  const show = useCallback(({ title, message, type = 'info', duration = 3500 }) => {
    if (timer.current) clearTimeout(timer.current);

    setToast({ title, message, type });
    slideY.setValue(-120);

    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(slideY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && <ToastBanner toast={toast} translateY={slideY} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  textBlock: { flex: 1 },
  title: { ...typography.preset.subtitle, color: colors.textPrimary },
  message: { ...typography.preset.caption, color: colors.textSecondary, marginTop: 2 },
});
