import {
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './config';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(data.idToken);
  return signInWithCredential(auth, credential);
}

export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result;
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // not signed in with Google — ignore
  }
  return firebaseSignOut(auth);
}
