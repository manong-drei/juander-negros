import { Redirect, Tabs } from 'expo-router';
import { useRootAuth } from '../_layout';
import { useUserProfile } from '../../hooks/useUserProfile';
import { AppContext } from '../../context/AppContext';
import TabBar from '../../components/layout/TabBar';

export default function MainLayout() {
  const { user } = useRootAuth();
  const { profile, loading, updatePreferences } = useUserProfile(user?.uid);

  if (!loading && profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return (
    <AppContext.Provider value={{ user, profile, profileLoading: loading, updatePreferences }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="index"     options={{ title: 'Home' }} />
        <Tabs.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
        <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
      </Tabs>
    </AppContext.Provider>
  );
}
