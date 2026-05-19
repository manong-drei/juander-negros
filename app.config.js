export default {
  expo: {
    name: 'Juander Negros',
    slug: 'juander-negros',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'juandernegros',
    userInterfaceStyle: 'dark',
    android: {
      package: 'com.juandernegros.app',
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      'expo-router',
      'expo-location',
      [
        'expo-image-picker',
        { photosPermission: 'Allow Juander Negros to access your photos for destination uploads.' },
      ],
      '@react-native-google-signin/google-signin',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: '23e90280-9d20-4aef-8912-b677809b48ec',
      },
    },
  },
};
