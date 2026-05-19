import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const TABS = [
  { name: 'index',     label: 'Home',      icon: 'home' },
  { name: 'bookmarks', label: 'Bookmarks', icon: 'bookmark' },
  { name: 'profile',   label: 'Profile',   icon: 'person' },
];

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={60} tint="dark" style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => {
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
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.glass,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  label: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', fontSize: 10, marginTop: 2 },
  labelActive: { color: colors.primary },
  activeDot: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
