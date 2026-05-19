import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const ADMIN_TABS = [
  { name: 'dashboard',    label: 'Dashboard',  icon: '📊' },
  { name: 'destinations', label: 'Destinations', icon: '🗺️' },
  { name: 'analytics',   label: 'Analytics',  icon: '📈' },
  { name: 'users',       label: 'Users',      icon: '👥' },
  { name: 'settings',    label: 'Settings',   icon: '⚙️' },
];

export default function AdminTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={60} tint="dark" style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.adminBadgeRow}>
        <Text style={styles.adminBadge}>ADMIN</Text>
      </View>
      <View style={styles.tabs}>
        {ADMIN_TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const isFocused = state.index === state.routes.indexOf(route);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              }}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {isFocused && <View style={styles.activeDot} />}
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1.5,
    borderTopColor: colors.primary,
    backgroundColor: colors.glass,
  },
  adminBadgeRow: {
    alignItems: 'center',
    paddingTop: 6,
  },
  adminBadge: {
    ...typography.preset.chip,
    color: colors.primary,
    letterSpacing: 2,
    fontSize: 9,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  icon: { fontSize: 20, marginBottom: 3 },
  label: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', fontSize: 9 },
  labelActive: { color: colors.primary },
  activeDot: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
