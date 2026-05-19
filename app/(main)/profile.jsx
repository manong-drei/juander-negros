import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';
import { signOut } from '../../firebase/auth';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const CLASS_OPTIONS = [
  { id: 'local', label: 'Local', icon: 'home' },
  { id: 'tourist', label: 'Tourist', icon: 'flight' },
];
const TRAVEL_OPTIONS = [
  { id: 'solo', label: 'Solo', icon: 'person' },
  { id: 'family', label: 'Family', icon: 'family-restroom' },
  { id: 'group', label: 'Group', icon: 'groups' },
];

export default function ProfileScreen() {
  const { user, profile, updatePreferences } = useAppContext();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [draftClass, setDraftClass] = useState(profile?.class);
  const [draftTravel, setDraftTravel] = useState(profile?.travelType);
  const [draftInterests, setDraftInterests] = useState(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraftClass(profile?.class);
    setDraftTravel(profile?.travelType);
    setDraftInterests(profile?.interests ?? []);
    setEditing(true);
  }

  function toggleInterest(id) {
    setDraftInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function savePreferences() {
    if (!draftClass || !draftTravel || draftInterests.length === 0) {
      toast.show({ title: 'Incomplete', message: 'Please fill in all preference sections.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await updatePreferences({
        class: draftClass,
        travelType: draftTravel,
        interests: draftInterests,
      });
      setEditing(false);
      toast.show({ title: 'Preferences saved', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Could not save', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    setConfirmSignOut(true);
  }

  const initials = (profile?.displayName || user?.displayName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{profile?.displayName || user?.displayName || 'User'}</Text>
          <View style={styles.userTypeLabelRow}>
            <MaterialIcons
              name={profile?.class === 'tourist' ? 'flight' : 'home'}
              size={13}
              color={colors.accent}
            />
            <Text style={styles.userTypeLabel}>
              {profile?.class === 'tourist' ? 'Tourist Explorer' : 'Local Explorer'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="place" size={13} color={colors.textSecondary} />
            <Text style={styles.locationText}>Bacolod City, Negros Occidental</Text>
          </View>
        </View>

        {/* Preferences section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Preferences</Text>
            {!editing && (
              <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit Preferences</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              {/* Class */}
              <Text style={styles.prefLabel}>Who you are</Text>
              <View style={styles.optionRow}>
                {CLASS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionBtn, draftClass === opt.id && styles.optionBtnActive]}
                    onPress={() => setDraftClass(opt.id)}
                  >
                    <MaterialIcons name={opt.icon} size={18} color={draftClass === opt.id ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.optionLabel, draftClass === opt.id && { color: colors.primary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Travel */}
              <Text style={styles.prefLabel}>How you travel</Text>
              <View style={styles.optionRow}>
                {TRAVEL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionBtn, draftTravel === opt.id && styles.optionBtnActive]}
                    onPress={() => setDraftTravel(opt.id)}
                  >
                    <MaterialIcons name={opt.icon} size={18} color={draftTravel === opt.id ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.optionLabel, draftTravel === opt.id && { color: colors.primary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Interests */}
              <Text style={styles.prefLabel}>Interests</Text>
              <View style={styles.chipsGrid}>
                {CATEGORIES.map((cat) => {
                  const sel = draftInterests.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, sel && { backgroundColor: cat.color, borderColor: cat.color }]}
                      onPress={() => toggleInterest(cat.id)}
                    >
                      <MaterialIcons name={cat.icon} size={14} color={sel ? '#fff' : cat.color} />
                      <Text style={[styles.chipLabel, sel && { color: '#fff' }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save / Cancel */}
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={savePreferences} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.prefRow}>
                <Text style={styles.prefKey}>User Type</Text>
                <Text style={styles.prefVal}>
                  {profile?.class === 'tourist' ? 'Tourist' : 'Local'}
                </Text>
              </View>
              <View style={styles.prefRow}>
                <Text style={styles.prefKey}>Travel Type</Text>
                <Text style={styles.prefVal}>
                  {TRAVEL_OPTIONS.find((t) => t.id === profile?.travelType)?.label ?? '—'}
                </Text>
              </View>
              <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.prefKey}>Interests</Text>
                <Text style={styles.prefVal}>
                  {profile?.interests?.length
                    ? profile.interests.map((i) => CATEGORIES.find((c) => c.id === i)?.label).join(', ')
                    : '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign Out"
        message="You will be returned to the sign-in screen."
        confirmLabel="Sign Out"
        destructive
        onConfirm={() => { setConfirmSignOut(false); signOut(); }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...typography.preset.heading1, color: colors.primary },
  displayName: { ...typography.preset.heading2, color: colors.textPrimary, marginBottom: 4 },
  userTypeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 4 },
  userTypeLabel: { ...typography.preset.label, color: colors.accent },
  email: { ...typography.preset.caption, color: colors.textMuted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { ...typography.preset.caption, color: colors.textSecondary },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: { ...typography.preset.heading3, color: colors.textPrimary },
  editBtn: {
    backgroundColor: colors.primaryDim,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBtnText: { ...typography.preset.label, color: colors.primary },

  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefKey: { ...typography.preset.label, color: colors.textMuted },
  prefVal: { ...typography.preset.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },

  prefLabel: { ...typography.preset.label, color: colors.textMuted, marginTop: 16, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  optionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  optionLabel: { ...typography.preset.label, color: colors.textSecondary },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipLabel: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.preset.button, color: colors.textSecondary },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.preset.button, color: '#FFFFFF' },

  signOutBtn: {
    borderWidth: 1.5,
    borderColor: colors.danger + '60',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.danger + '10',
  },
  signOutText: { ...typography.preset.button, color: colors.danger },
});
