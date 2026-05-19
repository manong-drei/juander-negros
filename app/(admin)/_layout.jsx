import { useState, useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { collection, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useRootAuth } from '../_layout';
import { useUserProfile } from '../../hooks/useUserProfile';
import { AdminContext } from '../../context/AdminContext';
import AdminTabBar from '../../components/layout/AdminTabBar';

export default function AdminLayout() {
  const { user } = useRootAuth();
  const { profile, loading: profileLoading, updatePreferences } = useUserProfile(user?.uid);

  const [destinations, setDestinations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bookmarkCounts, setBookmarkCounts] = useState({});

  useEffect(() => {
    return onSnapshot(collection(db, 'destinations'), (snap) => {
      setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'amenities'), (snap) => {
      setAmenities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collectionGroup(db, 'places'), (snap) => {
      const counts = {};
      snap.docs.forEach((d) => {
        const id = d.data().destinationId;
        if (id) counts[id] = (counts[id] ?? 0) + 1;
      });
      setBookmarkCounts(counts);
    });
  }, []);

  if (profileLoading) return null;
  if (profile?.role !== 'admin') return <Redirect href="/(main)" />;

  return (
    <AdminContext.Provider value={{
      user, profile, updatePreferences,
      destinations, amenities, allUsers, bookmarkCounts,
    }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        tabBar={(props) => <AdminTabBar {...props} />}
      >
        <Tabs.Screen name="dashboard"    options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="destinations" options={{ title: 'Destinations' }} />
        <Tabs.Screen name="analytics"   options={{ title: 'Analytics' }} />
        <Tabs.Screen name="users"       options={{ title: 'Users' }} />
        <Tabs.Screen name="settings"    options={{ title: 'Settings' }} />
      </Tabs>
    </AdminContext.Provider>
  );
}
