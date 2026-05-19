import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

// Geographical center of Negros Island as default
const NEGROS_CENTER = { latitude: 10.2926, longitude: 123.0247 };

export function useLocation() {
  const [location, setLocation] = useState(NEGROS_CENTER);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let watcher;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setPermissionGranted(true);
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
        ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude })
      );
    })();
    return () => watcher?.remove();
  }, []);

  return { location, permissionGranted };
}

export function getDistanceLabel(from, to) {
  if (!from || !to) return '';
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function getDistanceKm(from, to) {
  if (!from || !to) return Infinity;
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
