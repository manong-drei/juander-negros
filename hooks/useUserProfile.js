import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateUserProfile } from '../firebase/firestore';

export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (snap) => {
      setProfile(snap.exists() ? { uid, ...snap.data() } : null);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  const updatePreferences = (patch) => updateUserProfile(uid, patch);

  return { profile, loading, updatePreferences };
}
