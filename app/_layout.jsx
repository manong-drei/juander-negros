import { useEffect, createContext, useContext, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../components/ui/Toast';
import { colors } from '../constants/colors';

export const RootAuthContext = createContext(null);
export function useRootAuth() {
  return useContext(RootAuthContext);
}

export const DirectionsContext = createContext(null);
export function useDirections() {
  return useContext(DirectionsContext);
}

function AuthGuard({ children }) {
  const auth = useAuth();
  const { user, loading, needsOnboarding } = auth;
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)');
      return;
    }
    if (user && needsOnboarding && segments[1] !== 'onboarding') {
      router.replace('/(auth)/onboarding');
      return;
    }
    if (user && !needsOnboarding && inAuth) {
      router.replace('/(main)');
    }
  }, [user, loading, needsOnboarding, segments]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <RootAuthContext.Provider value={auth}>
      {children}
    </RootAuthContext.Provider>
  );
}

export default function RootLayout() {
  const [directionsTo, setDirectionsTo] = useState(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
      <DirectionsContext.Provider value={{ directionsTo, setDirectionsTo }}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen
            name="destination/[id]"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack>
      </AuthGuard>
      </DirectionsContext.Provider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
