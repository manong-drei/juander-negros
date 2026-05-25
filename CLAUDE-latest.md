# CLAUDE-latest.md

This file provides guidance for working with the Juander Negros codebase.

## Quick Start

```bash
npx expo start                # Start dev server (Expo Go or dev build)
npx expo start --android      # Start on Android device/emulator
npx expo start --ios          # Start on iOS simulator/device
```

- No lint or test scripts are configured.
- Type checking is handled by Expo’s build process.
- Environment variables go in `.env` (see `.env.example`). All Firebase keys must be prefixed with `EXPO_PUBLIC_FIREBASE_*`.

## Project Overview

**Juander Negros** is a personalized tourism discovery app for Negros Island (Philippines), built with:

- Expo SDK 55 + React Native 0.83
- Expo Router (file-based navigation)
- Firebase (auth, Firestore, storage)
- `react-native-maps` for map experience

## Folder Structure

- `app/` — All screens, organized by feature and role
  - `_layout.jsx` — Root AuthGuard, splash, redirect logic
  - `(auth)/` — Auth stack: login, onboarding
  - `(main)/` — Main tabs: map/list, bookmarks, profile, admin
  - `destination/` — Dynamic route for destination details
- `components/` — UI, map, and layout components
- `constants/` — Colors, categories, map style, typography
- `context/` — App and admin context providers
- `data/` — Seed data, service account keys
- `firebase/` — Auth, config, Firestore CRUD logic
- `hooks/` — Custom hooks for auth, location, map data, user profile

## Routing & Navigation

- File-based routing via Expo Router.
- `(auth)` stack: sign-in/sign-up, onboarding (3-step carousel: class → travel type → interests).
- `(main)` tab navigator: map/list, bookmarks, profile, admin (admin tab visible only for admins).
- `destination/[id].jsx`: Destination detail modal with animated bottom sheet.

## Auth & Onboarding Flow

- `useAuth()` in `app/_layout.jsx` watches Firebase auth state and checks Firestore user profile.
- Three user states:
  1. Not logged in → redirect to `/(auth)`
  2. Logged in, no profile → redirect to `/(auth)/onboarding`
  3. Logged in, has profile → allow `/(main)`
- Onboarding saves profile to Firestore via `createUserProfile()`, then navigates to main app.

## State & Data Flow

- All shared state via React Context (`AppContext`, `AdminContext`) and custom hooks.
- No Redux or Zustand.
- Real-time Firestore listeners (`onSnapshot`) for profile, destinations, amenities, bookmarks.
- Key hooks:
  - `useAuth` — Auth state and onboarding check
  - `useUserProfile` — Real-time `/users/{uid}` listener, exposes `updatePreferences`
  - `useMapData(profile)` — Listens to active destinations, filters by user interests/travel type, loads amenities for tourists
  - `useLocation` — Foreground GPS, provides `getDistanceLabel()` and `getDistanceKm()`

## Firestore Schema

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

- All Firestore CRUD is in `firebase/firestore.js`.
- Admin operations (add/edit/deactivate) are in `app/(main)/admin.jsx`.
- Soft-delete for destinations/amenities: sets `isActive: false`.

## Map & List Experience

- Map centered on Negros Island (10.2926, 123.0247), dark custom style from `constants/mapStyle.js`.
- Marker clustering via `react-native-map-clustering`.
- Two views: Map (default) and List — toggled at top.
- `useMapData` filters destinations by user’s `interests` and sorts by `travelType`.
- Amenity layer (ATM/hotel/restaurant) is tourist-only; toggled via buttons.
- Bottom card strip: horizontal FlatList sorted by distance; swiping snaps camera to destination.

## UI Conventions

- Dark theme throughout — color palette in `constants/colors.js` (primary green `#4CAF7D`, accent orange `#F5A623`)
- Glassmorphic components — `GlassCard` wraps `expo-blur` `BlurView`; custom `TabBar` uses blur
- Typography — predefined styles in `constants/typography.js` (display → chip)
- Categories — 7 types (nature, adventure, cultural, festivals, food, shopping, relaxation) in `constants/categories.js` with icon, color, description
- Destination detail — animated bottom sheet with three snap positions; swipe down or tap backdrop to dismiss

## Role-Based Access

- `profile.role === 'admin'` controls admin tab visibility in `(main)/_layout.jsx`.
- `admin.jsx` redirects non-admins away on mount.
- Set role directly in Firestore.

## Firebase Configuration

- `firebase/config.js` reads from `EXPO_PUBLIC_FIREBASE_*` env vars.
- Enables `AsyncStorage` persistence for offline auth.
- Exports `auth`, `db`, `storage`.
- Google Sign-In via `@react-native-google-signin/google-signin` with `webClientId` from env.
- Native Google Sign-In requires a dev build (not Expo Go).

---

Let me know if you want to add, remove, or clarify anything before I update the file!
