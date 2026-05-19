import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';

// ── Users ──────────────────────────────────────────────────────────────────

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    role: 'user',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function updateUserProfile(uid, patch) {
  await updateDoc(doc(db, 'users', uid), patch);
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

// ── Destinations ───────────────────────────────────────────────────────────

export async function addDestination(data) {
  return addDoc(collection(db, 'destinations'), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDestination(id, patch) {
  await updateDoc(doc(db, 'destinations', id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

// ── Amenities ──────────────────────────────────────────────────────────────

export async function addAmenity(data) {
  return addDoc(collection(db, 'amenities'), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateAmenity(id, patch) {
  await updateDoc(doc(db, 'amenities', id), patch);
}

// ── Bookmarks ──────────────────────────────────────────────────────────────

export async function addBookmark(uid, destinationId) {
  await setDoc(doc(db, 'bookmarks', uid, 'places', destinationId), {
    destinationId,
    savedAt: serverTimestamp(),
  });
}

export async function removeBookmark(uid, destinationId) {
  await deleteDoc(doc(db, 'bookmarks', uid, 'places', destinationId));
}

export async function getBookmarkedDestinations(uid) {
  const snap = await getDocs(collection(db, 'bookmarks', uid, 'places'));
  const ids = snap.docs.map((d) => d.data().destinationId);
  if (ids.length === 0) return [];
  const destSnaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'destinations', id))));
  return destSnaps
    .filter((d) => d.exists())
    .map((d) => ({ id: d.id, ...d.data() }));
}
