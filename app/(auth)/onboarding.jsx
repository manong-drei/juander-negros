import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRootAuth } from '../_layout';
import { createUserProfile } from '../../firebase/firestore';
import { useToast } from '../../components/ui/Toast';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const CLASS_OPTIONS = [
  { id: 'local',   label: 'Local',   desc: 'I live here and want to explore my region', icon: 'home' },
  { id: 'tourist', label: 'Tourist', desc: "I'm visiting and need full guidance",         icon: 'flight' },
];

const TRAVEL_OPTIONS = [
  { id: 'solo',   label: 'Solo',   icon: 'person' },
  { id: 'family', label: 'Family', icon: 'family-restroom' },
  { id: 'group',  label: 'Group',  icon: 'groups' },
];

export default function OnboardingScreen() {
  const { user, completeOnboarding } = useRootAuth();
  const router = useRouter();
  const toast = useToast();
  const slideX = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState(0);
  const [userClass, setUserClass] = useState(null);
  const [travelType, setTravelType] = useState(null);
  const [interests, setInterests] = useState([]);
  const [saving, setSaving] = useState(false);

  function goNext() {
    if (step === 0 && !userClass)      { toast.show({ title: 'Who are you?', message: 'Please select whether you are a local or a tourist.', type: 'warning' }); return; }
    if (step === 1 && !travelType)     { toast.show({ title: 'How do you travel?', message: 'Please choose your travel style.', type: 'warning' }); return; }
    if (step === 2 && interests.length === 0) { toast.show({ title: 'Pick your interests', message: 'Select at least one thing you are into.', type: 'warning' }); return; }

    if (step < TOTAL_STEPS - 1) {
      Animated.spring(slideX, {
        toValue: -(step + 1) * SCREEN_W,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
      setStep(step + 1);
    } else {
      handleDone();
    }
  }

  function goBack() {
    if (step === 0) return;
    Animated.spring(slideX, {
      toValue: -(step - 1) * SCREEN_W,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setStep(step - 1);
  }

  function toggleInterest(id) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleDone() {
    setSaving(true);
    try {
      await createUserProfile(user.uid, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || null,
        class: userClass,
        travelType,
        interests,
      });
      completeOnboarding();
      router.replace('/(main)');
    } catch (e) {
      toast.show({ title: 'Could not save profile', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {/* Slides */}
      <Animated.View
        style={[styles.slidesWrapper, { transform: [{ translateX: slideX }] }]}
      >
        {/* Step 0 — Who are you? */}
        <View style={styles.slide}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.question}>Who are you?</Text>
          {CLASS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.bigCard, userClass === opt.id && styles.bigCardActive]}
              onPress={() => setUserClass(opt.id)}
            >
              <MaterialIcons
                name={opt.icon}
                size={32}
                color={userClass === opt.id ? colors.primary : colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigCardLabel, userClass === opt.id && { color: colors.primary }]}>
                  {opt.label}
                </Text>
                <Text style={styles.bigCardDesc}>{opt.desc}</Text>
              </View>
              {userClass === opt.id && (
                <MaterialIcons name="check-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 1 — Travel type */}
        <View style={styles.slide}>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.question}>How are you traveling?</Text>
          <View style={styles.travelRow}>
            {TRAVEL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.travelCard, travelType === opt.id && styles.travelCardActive]}
                onPress={() => setTravelType(opt.id)}
              >
                <MaterialIcons
                  name={opt.icon}
                  size={36}
                  color={travelType === opt.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.travelLabel, travelType === opt.id && { color: colors.primary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2 — Interests */}
        <View style={styles.slide}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.question}>What are you into?</Text>
          <Text style={styles.subtext}>Pick as many as you like.</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.chipsGrid}>
              {CATEGORIES.map((cat) => {
                const selected = interests.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.interestChip,
                      selected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => toggleInterest(cat.id)}
                  >
                    <MaterialIcons
                      name={cat.icon}
                      size={16}
                      color={selected ? '#fff' : cat.color}
                    />
                    <Text style={[styles.chipLabel, selected && { color: '#fff' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS - 1 ? "Let's Explore Negros!" : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    gap: 8,
    marginBottom: 8,
  },
  dot: { width: 8, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 28, height: 6, borderRadius: 3, backgroundColor: colors.primary },

  slidesWrapper: {
    flexDirection: 'row',
    flex: 1,
    width: SCREEN_W * TOTAL_STEPS,
  },
  slide: {
    width: SCREEN_W,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  stepLabel: { ...typography.preset.label, color: colors.textMuted, marginBottom: 8 },
  question: { ...typography.preset.heading1, color: colors.textPrimary, marginBottom: 24 },
  subtext: { ...typography.preset.caption, color: colors.textSecondary, marginBottom: 16 },

  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 16,
  },
  bigCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  bigCardLabel: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 4 },
  bigCardDesc: { ...typography.preset.caption, color: colors.textSecondary },

  travelRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  travelCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 10,
  },
  travelCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  travelLabel: { ...typography.preset.subtitle, color: colors.textPrimary },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipLabel: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backBtnText: { ...typography.preset.button, color: colors.textSecondary },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { ...typography.preset.button, color: '#FFFFFF' },
});
