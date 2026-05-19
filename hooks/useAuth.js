import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setNeedsOnboarding(!snap.exists());
        setUser(firebaseUser);
      } else {
        setNeedsOnboarding(false);
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  return {
    user,
    loading: user === undefined,
    needsOnboarding,
    completeOnboarding: () => setNeedsOnboarding(false),
  };
}
