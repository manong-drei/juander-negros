import { Platform } from 'react-native';

const family = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  family,

  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
  },

  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  preset: {
    display: { fontFamily: family, fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
    heading1: { fontFamily: family, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
    heading2: { fontFamily: family, fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
    heading3: { fontFamily: family, fontSize: 17, fontWeight: '600' },
    subtitle: { fontFamily: family, fontSize: 15, fontWeight: '500' },
    body: { fontFamily: family, fontSize: 15, fontWeight: '400', lineHeight: 22 },
    caption: { fontFamily: family, fontSize: 13, fontWeight: '400', lineHeight: 18 },
    label: { fontFamily: family, fontSize: 13, fontWeight: '500' },
    button: { fontFamily: family, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
    chip: { fontFamily: family, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  },
};
