import { Tabs } from 'expo-router';
import { useRootAuth } from '../_layout';
import { useUserProfile } from '../../hooks/useUserProfile';
import { AppContext } from '../../context/AppContext';
import TabBar from '../../components/layout/TabBar';
import { colors } from '../../constants/colors';

export default function MainLayout() {
  const { user } = useRootAuth();
  const { profile, loading, updatePreferences } = useUserProfile(user?.uid);
  const isAdmin = profile?.role === 'admin';

  return (
    <AppContext.Provider value={{ user, profile, profileLoading: loading, updatePreferences }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        tabBar={(props) => <TabBar {...props} isAdmin={isAdmin} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Explore' }} />
        <Tabs.Screen name="bookmarks" options={{ title: 'Saved' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="admin" options={{ title: 'Admin' }} />
      </Tabs>
    </AppContext.Provider>
  );
}
