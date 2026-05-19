import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useMapData(profile) {
  const [allDestinations, setAllDestinations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'destinations'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setAllDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (profile?.class !== 'tourist') {
      setAmenities([]);
      return;
    }
    const q = query(collection(db, 'amenities'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setAmenities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [profile?.class]);

  const destinations = useMemo(() => {
    if (!profile?.interests?.length) return allDestinations;
    return allDestinations
      .filter((d) => d.categories?.some((c) => profile.interests.includes(c)))
      .sort((a, b) => {
        const aOk = a.suitableFor?.includes(profile.travelType) ? 0 : 1;
        const bOk = b.suitableFor?.includes(profile.travelType) ? 0 : 1;
        return aOk - bOk;
      });
  }, [allDestinations, profile?.interests, profile?.travelType]);

  return { destinations, amenities, loading };
}
