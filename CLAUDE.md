# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (Expo Go or dev build)
npx expo start --android
npx expo start --ios
```

No lint or test scripts are configured. Type checking is done implicitly via Expo's build process.

Environment variables go in `.env` (see `.env.example`). All Firebase keys must be prefixed `EXPO_PUBLIC_FIREBASE_*`.

## Architecture Overview

**Juander Negros** is a personalized tourism discovery app for Negros Island (Philippines), built with Expo 55 + React Native 0.83, file-based routing via Expo Router, Firebase for auth/database/storage, and `react-native-maps` for the map experience.

### Routing Structure

```
app/
  _layout.jsx              ← Root: AuthGuard, handles splash + redirect logic
  (auth)/
    _layout.jsx            ← Stack navigator (slide_from_right, no header)
    index.jsx              ← Sign-in / Sign-up (email or Google)
    onboarding.jsx         ← 3-step animated carousel (class → travel type → interests)
  (main)/
    _layout.jsx            ← Tab navigator; wraps everything in AppContext.Provider
    index.jsx              ← Map + List exploration screen (core feature)
    bookmarks.jsx          ← Saved destinations
    profile.jsx            ← User info + preference editor
    admin.jsx              ← Admin-only: add/edit destinations & amenities
  destination/
    [id].jsx               ← Destination detail (transparentModal, animated bottom sheet)
```

### Auth & Onboarding Flow

`app/_layout.jsx` runs `useAuth()` which watches Firebase auth state and checks whether a Firestore user profile exists. Three states:
1. Not logged in → redirect to `/(auth)`
2. Logged in, no profile → redirect to `/(auth)/onboarding`
3. Logged in, has profile → allow `/(main)`

Onboarding saves a profile document to Firestore via `createUserProfile()` then navigates to `/(main)`.

### State & Data Flow

- **AppContext** (`context/`) provides `user`, `profile`, `profileLoading`, and `updatePreferences` to all main tabs. Initialized in `(main)/_layout.jsx` using `useUserProfile(user?.uid)`.
- **No Redux or Zustand**; all shared state via React Context + custom hooks.
- **Real-time Firestore listeners** are used everywhere (no polling): profile, destinations, amenities, bookmarks all use `onSnapshot`.

Key hooks:
- `useAuth` — monitors Firebase auth state + onboarding check
- `useUserProfile` — real-time listener on `/users/{uid}`, exposes `updatePreferences`
- `useMapData(profile)` — listens to active destinations, filters by user interests/travel type, loads amenities only for `class === 'tourist'`
- `useLocation` — requests foreground GPS, provides `getDistanceLabel()` and `getDistanceKm()`

### Firestore Schema

```
/users/{uid}
  displayName, email, photoURL, class (local|tourist), travelType (solo|family|group),
  interests (string[]), role (user|admin), createdAt

/destinations/{id}
  name, description, categories (string[]), suitableFor (string[]),
  latitude, longitude, photos (string[]), isActive, createdAt, updatedAt

/amenities/{id}
  type (atm|hotel|restaurant), name, description, latitude, longitude,
  isLocalRestaurant (bool, restaurants only), isActive

/bookmarks/{uid}/places/{destinationId}
  destinationId, savedAt
```

All CRUD is in `firebase/firestore.js`. Admin operations (add/deactivate) are done from `admin.jsx`; soft-delete sets `isActive: false`.

### Map Screen Logic (`app/(main)/index.jsx`)

- Centered on Negros Island (10.2926, 123.0247), dark custom map style from `constants/mapStyle.js`
- Marker clustering via `react-native-map-clustering`
- Two views: Map (default) and List — same data, toggled at top
- `useMapData` filters destinations by matching user's `interests` array against destination `categories`, then sorts by `suitableFor` matching the user's `travelType`
- Amenity layer (ATM/hotel/restaurant) is tourist-only; toggled via three buttons
- Bottom card strip: horizontal FlatList sorted by distance; swiping snaps the camera to that destination

### UI Conventions

- **Dark theme throughout** — color palette in `constants/colors.js` (primary green `#4CAF7D`, accent orange `#F5A623`)
- **Glassmorphic components** — `GlassCard` wraps `expo-blur` `BlurView`; custom `TabBar` uses blur too
- **Typography** — predefined styles in `constants/typography.js` (display → chip); use these instead of raw `fontSize`
- **Categories** — 7 types (nature, adventure, cultural, festivals, food, shopping, relaxation) defined in `constants/categories.js` with icon, color, and description
- **Destination detail** — animated bottom sheet with three snap positions; swipe down or tap backdrop to dismiss

### Role-Based Access

`profile.role === 'admin'` controls visibility of the admin tab in `(main)/_layout.jsx`. `admin.jsx` also redirects non-admins away on mount. Set role directly in Firestore.

### Firebase Configuration

`firebase/config.js` reads from `EXPO_PUBLIC_FIREBASE_*` env vars and enables `AsyncStorage` persistence for offline auth. Exports `auth`, `db`, `storage`.

Google Sign-In uses `@react-native-google-signin/google-signin` configured with `webClientId` from env. Native Google Sign-In requires a dev build (not Expo Go).
