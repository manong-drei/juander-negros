import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    semiBold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
});

export const typography = {
  // Font families
  fontFamily,

  // Scale
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 36,
  },

  // Weight shorthands (used with fontFamily above)
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    caps: 1.5,
  },

  // Preset text styles (spread into StyleSheet)
  heading1: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chip: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
};
