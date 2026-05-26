import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { auth } from "./config";

export { signUpWithEmail, signInWithEmail } from "./auth.shared";

const AUTH_KEY = "firebase:authUser";

onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ uid: user.uid, email: user.email }),
    );
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
});

setInterval(() => {
  if (auth.currentUser && !localStorage.getItem(AUTH_KEY)) {
    firebaseSignOut(auth);
  }
}, 1000);

export async function signInWithGoogle() {
  return signInWithPopup(
    auth,
    new GoogleAuthProvider(),
    browserPopupRedirectResolver,
  );
}

export async function signOut() {
  return firebaseSignOut(auth);
}
