import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAdminContext } from '../../context/AdminContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import GlassCard from '../../components/ui/GlassCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

function getInitials(name) {
  return (name || 'A').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettingsScreen() {
  const { user, profile } = useAdminContext();
  const toast = useToast();
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (e) {
      toast.show({ title: 'Sign out failed', message: e.message, type: 'error' });
    }
  }

  function handleSwitchToUserView() {
    router.replace('/(main)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Admin Profile */}
        <GlassCard style={styles.card}>
          <View style={styles.profileRow}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials(profile?.displayName)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.displayName || 'Admin'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>⚙️ Administrator</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* App Info */}
        <Text style={styles.sectionLabel}>APP INFO</Text>
        <GlassCard style={styles.card}>
          <InfoRow label="App" value="Juander Negros" />
          <InfoRow label="Role" value="Admin Console" last />
        </GlassCard>

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSwitchToUserView}>
            <Text style={styles.actionIcon}>🧭</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Switch to User View</Text>
              <Text style={styles.actionSub}>Browse the app as a regular user</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => setConfirmSignOut(true)}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign Out?"
        message="You will be returned to the sign-in screen."
        confirmLabel="Sign Out"
        destructive
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.preset.heading1, color: colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 60 },

  sectionLabel: { ...typography.preset.chip, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },

  card: { padding: 0, overflow: 'hidden', marginBottom: 4 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  avatarText: { ...typography.preset.heading2, color: colors.primary },
  profileName: { ...typography.preset.heading3, color: colors.textPrimary, marginBottom: 2 },
  profileEmail: { ...typography.preset.caption, color: colors.textMuted, marginBottom: 8 },
  adminBadge: { alignSelf: 'flex-start', backgroundColor: colors.primaryDim, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary },
  adminBadgeText: { ...typography.preset.chip, color: colors.primary },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { ...typography.preset.body, color: colors.textMuted },
  infoValue: { ...typography.preset.body, color: colors.textPrimary },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  actionIcon: { fontSize: 22 },
  actionLabel: { ...typography.preset.subtitle, color: colors.textPrimary },
  actionSub: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted },

  signOutBtn: { marginTop: 24, backgroundColor: colors.danger + '20', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
  signOutText: { ...typography.preset.button, color: colors.danger },
});
