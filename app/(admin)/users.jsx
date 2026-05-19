import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateUserRole } from '../../firebase/firestore';
import { useAdminContext } from '../../context/AdminContext';
import { useToast } from '../../components/ui/Toast';
import CategoryChip from '../../components/ui/CategoryChip';
import GlassCard from '../../components/ui/GlassCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const TRAVEL_LABELS = { solo: '🧍 Solo', family: '👨‍👩‍👧 Family', group: '👥 Group' };
const FILTERS = ['all', 'local', 'tourist', 'admins'];

function getInitials(name) {
  return (name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function UserRow({ user, onPress }) {
  const isLocal = user.class === 'local';
  const isAdmin = user.role === 'admin';
  return (
    <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.75}>
      {user.photoURL ? (
        <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarFallback]}>
          <Text style={styles.userAvatarText}>{getInitials(user.displayName)}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.userName} numberOfLines={1}>{user.displayName || 'No Name'}</Text>
          {isAdmin && <View style={styles.adminPip}><Text style={styles.adminPipText}>admin</Text></View>}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        <Text style={styles.userTravel}>{TRAVEL_LABELS[user.travelType] ?? '—'}</Text>
      </View>
      <View style={[styles.classBadge, { backgroundColor: isLocal ? colors.primaryDim : colors.accentDim }]}>
        <Text style={[styles.classBadgeText, { color: isLocal ? colors.primary : colors.accent }]}>
          {isLocal ? 'Local' : 'Tourist'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function UsersScreen() {
  const { user: adminUser, allUsers, bookmarkCounts } = useAdminContext();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSaveCount, setUserSaveCount] = useState(null);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (classFilter === 'local')   list = list.filter((u) => u.class === 'local');
    if (classFilter === 'tourist') list = list.filter((u) => u.class === 'tourist');
    if (classFilter === 'admins')  list = list.filter((u) => u.role === 'admin');
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((u) =>
      u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
    return list;
  }, [allUsers, classFilter, search]);

  async function openUserDetail(user) {
    setSelectedUser(user);
    setUserSaveCount(null);
    setLoadingSaves(true);
    try {
      const snap = await getDocs(collection(db, 'bookmarks', user.uid, 'places'));
      setUserSaveCount(snap.size);
    } catch {
      setUserSaveCount(0);
    } finally {
      setLoadingSaves(false);
    }
  }

  async function handleRoleChange() {
    const newRole = selectedUser.role === 'admin' ? 'user' : 'admin';
    setRoleChanging(true);
    try {
      await updateUserRole(selectedUser.uid, newRole);
      setSelectedUser((prev) => ({ ...prev, role: newRole }));
      toast.show({ title: newRole === 'admin' ? 'Promoted to Admin' : 'Demoted to User', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Role update failed', message: e.message, type: 'error' });
    } finally {
      setRoleChanging(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{allUsers.length}</Text>
        </View>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name or email…"
        placeholderTextColor={colors.textMuted}
      />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, classFilter === f && styles.filterChipActive]}
            onPress={() => setClassFilter(f)}
          >
            <Text style={[styles.filterChipText, classFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <UserRow user={item} onPress={() => openUserDetail(item)} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
      />

      {/* User Detail Modal */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>User Profile</Text>
            <View style={{ width: 50 }} />
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Avatar */}
              <View style={styles.detailAvatarWrap}>
                {selectedUser.photoURL ? (
                  <Image source={{ uri: selectedUser.photoURL }} style={styles.detailAvatar} />
                ) : (
                  <View style={styles.detailAvatarFallback}>
                    <Text style={styles.detailAvatarText}>{getInitials(selectedUser.displayName)}</Text>
                  </View>
                )}
                <Text style={styles.detailName}>{selectedUser.displayName || 'No Name'}</Text>
                <Text style={styles.detailEmail}>{selectedUser.email}</Text>
                <View style={[styles.roleBadge, selectedUser.role === 'admin' && styles.roleBadgeAdmin]}>
                  <Text style={[styles.roleBadgeText, selectedUser.role === 'admin' && { color: colors.primary }]}>
                    {selectedUser.role === 'admin' ? '⚙️ Admin' : '👤 User'}
                  </Text>
                </View>
              </View>

              {/* Preferences */}
              <GlassCard style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Preferences</Text>
                <DetailRow label="Class"       value={selectedUser.class === 'tourist' ? '✈️ Tourist' : '🏡 Local'} />
                <DetailRow label="Travel Type" value={TRAVEL_LABELS[selectedUser.travelType] ?? '—'} last />
              </GlassCard>

              {/* Interests */}
              <GlassCard style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Interests</Text>
                <View style={styles.chipsGrid}>
                  {(selectedUser.interests ?? []).length > 0
                    ? (selectedUser.interests ?? []).map((id) => <CategoryChip key={id} categoryId={id} />)
                    : <Text style={styles.emptyText}>No interests set.</Text>
                  }
                </View>
              </GlassCard>

              {/* Save Activity */}
              <GlassCard style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Save Activity</Text>
                {loadingSaves
                  ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />
                  : (
                    <View style={styles.saveCountRow}>
                      <Text style={styles.saveCountNum}>{userSaveCount ?? 0}</Text>
                      <Text style={styles.saveCountLabel}>destinations saved</Text>
                    </View>
                  )
                }
              </GlassCard>

              {/* Role toggle */}
              {selectedUser.uid !== adminUser?.uid ? (
                <TouchableOpacity
                  style={[styles.roleBtn, selectedUser.role === 'admin' && styles.roleBtnDemote]}
                  onPress={handleRoleChange}
                  disabled={roleChanging}
                >
                  {roleChanging
                    ? <ActivityIndicator color={colors.background} />
                    : <Text style={styles.roleBtnText}>
                        {selectedUser.role === 'admin' ? '⬇️ Demote to User' : '⬆️ Promote to Admin'}
                      </Text>
                  }
                </TouchableOpacity>
              ) : (
                <Text style={styles.selfGuard}>You cannot change your own role.</Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.preset.heading1, color: colors.textPrimary },
  countBadge: { backgroundColor: colors.primaryDim, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary },
  countText: { ...typography.preset.label, color: colors.primary },

  searchInput: { ...typography.preset.body, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: colors.textPrimary, margin: 16, marginBottom: 8 },

  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  filterChipText: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },
  filterChipTextActive: { color: colors.primary },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  userAvatar: { width: 46, height: 46, borderRadius: 23, flexShrink: 0 },
  userAvatarFallback: { backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { ...typography.preset.subtitle, color: colors.primary },
  userName: { ...typography.preset.subtitle, color: colors.textPrimary, flexShrink: 1 },
  userEmail: { ...typography.preset.caption, color: colors.textMuted },
  userTravel: { ...typography.preset.caption, color: colors.textMuted },
  adminPip: { backgroundColor: colors.primaryDim, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.primary },
  adminPipText: { ...typography.preset.chip, color: colors.primary, fontSize: 9 },
  classBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  classBadgeText: { ...typography.preset.chip, textTransform: 'uppercase' },
  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', paddingTop: 40 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { ...typography.preset.heading3, color: colors.textPrimary },
  modalClose: { ...typography.preset.button, color: colors.textMuted },
  modalScroll: { padding: 20, paddingBottom: 60 },

  detailAvatarWrap: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  detailAvatar: { width: 80, height: 80, borderRadius: 40 },
  detailAvatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { ...typography.preset.heading2, color: colors.primary },
  detailName: { ...typography.preset.heading2, color: colors.textPrimary },
  detailEmail: { ...typography.preset.body, color: colors.textMuted },
  roleBadge: { marginTop: 4, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  roleBadgeAdmin: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  roleBadgeText: { ...typography.preset.label, color: colors.textSecondary },

  detailCard: { marginBottom: 14, padding: 16 },
  detailCardTitle: { ...typography.preset.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { ...typography.preset.body, color: colors.textMuted },
  detailValue: { ...typography.preset.body, color: colors.textPrimary },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  saveCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 6 },
  saveCountNum: { ...typography.preset.heading1, color: colors.primary },
  saveCountLabel: { ...typography.preset.body, color: colors.textMuted },

  roleBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  roleBtnDemote: { backgroundColor: colors.danger },
  roleBtnText: { ...typography.preset.button, color: colors.background },
  selfGuard: { ...typography.preset.caption, color: colors.textMuted, textAlign: 'center', padding: 16 },
});
