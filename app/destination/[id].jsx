import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '../../firebase/config';
import { addBookmark, removeBookmark } from '../../firebase/firestore';
import { useRootAuth, useDirections } from '../_layout';
import { useToast } from '../../components/ui/Toast';
import { useLocation, getDistanceLabel } from '../../hooks/useLocation';
import CategoryChip from '../../components/ui/CategoryChip';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SNAP_HALF = SCREEN_H * 0.52;
const SNAP_FULL = SCREEN_H * 0.1;
const SNAP_CLOSED = SCREEN_H;

export default function DestinationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useRootAuth();
  const toast = useToast();
  const { setDirectionsTo } = useDirections();
  const { location } = useLocation();

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const translateY = useSharedValue(SNAP_HALF);
  const context = useSharedValue(0);

  // Load destination
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'destinations', id), (snap) => {
      if (snap.exists()) setDestination({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // Check bookmark status
  useEffect(() => {
    if (!user || !id) return;
    const unsub = onSnapshot(doc(db, 'bookmarks', user.uid, 'places', id), (snap) => {
      setSaved(snap.exists());
    });
    return unsub;
  }, [user, id]);

  // Open sheet on mount
  useEffect(() => {
    translateY.value = withSpring(SNAP_HALF, { damping: 20, stiffness: 150 });
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(main)');
  }, [router]);

  function dismiss() {
    translateY.value = withSpring(SNAP_CLOSED, { damping: 20, stiffness: 150 }, () => {
      runOnJS(goBack)();
    });
  }

  const gesture = Gesture.Pan()
    .onStart(() => { context.value = translateY.value; })
    .onUpdate((e) => {
      translateY.value = Math.max(SNAP_FULL, context.value + e.translationY);
    })
    .onEnd((e) => {
      if (e.velocityY > 600 || translateY.value > SCREEN_H * 0.75) {
        runOnJS(dismiss)();
      } else if (translateY.value < SCREEN_H * 0.35) {
        translateY.value = withSpring(SNAP_FULL, { damping: 20, stiffness: 150 });
      } else {
        translateY.value = withSpring(SNAP_HALF, { damping: 20, stiffness: 150 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [SNAP_FULL, SNAP_CLOSED], [0.6, 0]),
  }));

  async function toggleBookmark() {
    if (!user) return;
    try {
      if (saved) {
        await removeBookmark(user.uid, id);
      } else {
        await addBookmark(user.uid, id);
      }
    } catch (e) {
      toast.show({ title: 'Bookmark Error', message: e.message, type: 'error' });
    }
  }

  function openDirections() {
    if (!destination) return;
    setDirectionsTo({
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: destination.name,
    });
    dismiss();
  }

  const photos = destination?.photos ?? [];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropOpacity]}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#000' }}
          activeOpacity={1}
          onPress={dismiss}
        />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : !destination ? (
            <View style={styles.loadingBox}>
              <Text style={styles.errorText}>Destination not found.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Photo gallery */}
              {photos.length > 0 ? (
                <View>
                  <FlatList
                    data={photos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => String(i)}
                    onMomentumScrollEnd={(e) => {
                      setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
                    }}
                    renderItem={({ item }) => (
                      <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
                    )}
                  />
                  {photos.length > 1 && (
                    <View style={styles.dotsRow}>
                      {photos.map((_, i) => (
                        <View key={i} style={[styles.photoDot, i === photoIndex && styles.photoDotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="landscape" size={64} color={colors.border} />
                </View>
              )}

              <View style={styles.content}>
                {/* Name + distance */}
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={2}>{destination.name}</Text>
                  {location && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>
                        {getDistanceLabel(location, destination)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Categories */}
                <View style={styles.chipsRow}>
                  {destination.categories?.map((cat) => (
                    <CategoryChip key={cat} categoryId={cat} />
                  ))}
                </View>

                {/* Description */}
                <Text style={styles.description}>{destination.description}</Text>

                {/* Video */}
                {!!destination.video && (
                  <TouchableOpacity
                    style={styles.videoBtn}
                    onPress={() => Linking.openURL(destination.video)}
                  >
                    <MaterialIcons name="play-arrow" size={20} color={colors.primary} />
                    <Text style={styles.videoBtnText}>Watch Video</Text>
                  </TouchableOpacity>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.bookmarkBtn, saved && styles.bookmarkBtnActive]}
                    onPress={toggleBookmark}
                  >
                    <MaterialIcons
                      name={saved ? 'bookmark' : 'bookmark-border'}
                      size={20}
                      color={saved ? colors.accent : colors.textSecondary}
                    />
                    <Text style={[styles.bookmarkText, saved && { color: colors.accent }]}>
                      {saved ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.directionsBtn} onPress={openDirections}>
                    <MaterialIcons name="directions" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.accent },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  errorText: { ...typography.preset.body, color: colors.textMuted },

  photo: { width: SCREEN_W, height: 260 },
  photoPlaceholder: {
    width: SCREEN_W,
    height: 200,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  photoDotActive: { backgroundColor: colors.accent, width: 18 },

  content: { padding: 20, paddingBottom: 40 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  name: { ...typography.preset.heading1, color: colors.textPrimary, flex: 1 },
  distanceBadge: {
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  distanceText: { ...typography.preset.caption, color: colors.primary, fontWeight: '600' },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },

  description: { ...typography.preset.body, color: colors.textSecondary, lineHeight: 24, marginBottom: 28 },

  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  videoBtnText: { ...typography.preset.button, color: colors.primary },

  actions: { flexDirection: 'row', gap: 12 },
  bookmarkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 14,
  },
  bookmarkBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  bookmarkText: { ...typography.preset.button, color: colors.textSecondary },

  directionsBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtnText: { ...typography.preset.button, color: '#FFFFFF' },
});
