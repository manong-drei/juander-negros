Web support is in place via Expo/Metro platform splits. The web bundle builds successfully (1333 modules, no react-native-maps or @react-native-google-signin in the web graph).

What changed
1. Firebase config (browserLocalStoragePersistence)
firebase/config.shared.js — shared app, Firestore, Storage init
firebase/config.native.js — getReactNativePersistence(AsyncStorage)
firebase/config.web.js — browserLocalStoragePersistence (writes to localStorage)
Removed firebase/config.js
2. Firebase auth (email + Google on web)
firebase/auth.shared.js — email sign-up / sign-in
firebase/auth.native.js — @react-native-google-signin/google-signin
firebase/auth.web.js — signInWithPopup(auth, new GoogleAuthProvider())
Removed firebase/auth.js
3. Map components (web placeholders)
Component	Native	Web
ExploreMap
Full react-native-maps map
Placeholder
AdminDestinationsMap
Admin map + markers
Placeholder
MapCoordinatePicker
Long-press picker
Placeholder
DestinationMarker / AmenityMarker
Real markers
null
MapPlaceholder
—
"Map not available on web"
Screens updated:

app/(main)/index.jsx — uses ExploreMap (no direct map imports)
app/(admin)/destinations.jsx — uses AdminDestinationsMap + MapCoordinatePicker
Professor verification (localhost:8081)
Start the dev server:
npx expo start --web
Open http://localhost:8081 — login screen should load (no crash).
Sign in with email/password (or Google if localhost is in Firebase Authorized domains).
In DevTools → Application → Local Storage, find a key like: firebase:authUser:<API_KEY>:[DEFAULT]
Delete that key and refresh — user should be logged out and redirected to auth.
Firebase console checklist
Authentication → Sign-in method: Email/Password enabled
Authentication → Settings → Authorized domains: add localhost
For Google on web: enable Google provider and set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env
Native Android/iOS behavior is unchanged; only web resolves the .web.js variants.