import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../../firebase/config';
import { addDestination, updateDestination, addAmenity, updateAmenity } from '../../firebase/firestore';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const TRAVEL_TYPES = ['solo', 'family', 'group'];
const AMENITY_TYPES = ['atm', 'hotel', 'restaurant'];

const EMPTY_DEST = {
  name: '', description: '', categories: [], suitableFor: [],
  latitude: '', longitude: '', photos: [],
};

const EMPTY_AMENITY = {
  type: 'atm', name: '', description: '', latitude: '', longitude: '', isLocalRestaurant: false,
};

export default function AdminScreen() {
  const { profile } = useAppContext();
  const toast = useToast();
  const [confirmDeactivate, setConfirmDeactivate] = useState(null); // { collection_, id }

  const [tab, setTab] = useState('destinations'); // 'destinations' | 'amenities'
  const [destinations, setDestinations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('destination'); // 'destination' | 'amenity'
  const [editingId, setEditingId] = useState(null);
  const [destForm, setDestForm] = useState(EMPTY_DEST);
  const [amenityForm, setAmenityForm] = useState(EMPTY_AMENITY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (profile?.role !== 'admin') {
    return <Redirect href="/(main)" />;
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'destinations'), (snap) => {
      setDestinations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'amenities'), (snap) => {
      setAmenities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  function openDestForm(item = null) {
    setFormType('destination');
    setEditingId(item?.id ?? null);
    setDestForm(item ? {
      name: item.name ?? '',
      description: item.description ?? '',
      categories: item.categories ?? [],
      suitableFor: item.suitableFor ?? [],
      latitude: String(item.latitude ?? ''),
      longitude: String(item.longitude ?? ''),
      photos: item.photos ?? [],
    } : EMPTY_DEST);
    setShowForm(true);
  }

  function openAmenityForm(item = null) {
    setFormType('amenity');
    setEditingId(item?.id ?? null);
    setAmenityForm(item ? {
      type: item.type ?? 'atm',
      name: item.name ?? '',
      description: item.description ?? '',
      latitude: String(item.latitude ?? ''),
      longitude: String(item.longitude ?? ''),
      isLocalRestaurant: item.isLocalRestaurant ?? false,
    } : EMPTY_AMENITY);
    setShowForm(true);
  }

  function toggleCat(id) {
    setDestForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  }

  function toggleSuitable(id) {
    setDestForm((prev) => ({
      ...prev,
      suitableFor: prev.suitableFor.includes(id)
        ? prev.suitableFor.filter((s) => s !== id)
        : [...prev.suitableFor, id],
    }));
  }

  async function pickAndUploadPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `destinations/uploads/${filename}`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob);
        task.on('state_changed', null, reject, () => resolve());
      });
      const url = await getDownloadURL(storageRef);
      setDestForm((prev) => ({ ...prev, photos: [...prev.photos, url] }));
    } catch (e) {
      toast.show({ title: 'Upload Failed', message: e.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url) {
    setDestForm((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== url) }));
  }

  async function saveDestination() {
    const { name, description, categories, suitableFor, latitude, longitude, photos } = destForm;
    if (!name || !latitude || !longitude) {
      toast.show({ title: 'Required Fields Missing', message: 'Name, latitude, and longitude are required.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        categories,
        suitableFor,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photos,
        isActive: true,
      };
      if (editingId) {
        await updateDestination(editingId, payload);
      } else {
        await addDestination(payload);
      }
      setShowForm(false);
      toast.show({ title: editingId ? 'Destination updated' : 'Destination added', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function saveAmenity() {
    const { type, name, latitude, longitude, description, isLocalRestaurant } = amenityForm;
    if (!name || !latitude || !longitude) {
      toast.show({ title: 'Required Fields Missing', message: 'Name, latitude, and longitude are required.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type, name, description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isLocalRestaurant: type === 'restaurant' ? isLocalRestaurant : false,
        isActive: true,
      };
      if (editingId) {
        await updateAmenity(editingId, payload);
      } else {
        await addAmenity(payload);
      }
      setShowForm(false);
      toast.show({ title: editingId ? 'Amenity updated' : 'Amenity added', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function deactivate(collection_, id) {
    setConfirmDeactivate({ collection_, id });
  }

  async function confirmDeactivateAction() {
    const { collection_, id } = confirmDeactivate;
    setConfirmDeactivate(null);
    try {
      if (collection_ === 'destinations') await updateDestination(id, { isActive: false });
      else await updateAmenity(id, { isActive: false });
      toast.show({ title: 'Item hidden from the app', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {['destinations', 'amenities'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabLabel, tab === t && { color: colors.primary }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => tab === 'destinations' ? openDestForm() : openAmenityForm()}
      >
        <Text style={styles.addBtnText}>+ Add {tab === 'destinations' ? 'Destination' : 'Amenity'}</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={tab === 'destinations' ? destinations : amenities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.listItem, !item.isActive && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {tab === 'destinations'
                  ? (item.categories ?? []).join(', ')
                  : item.type}
                {!item.isActive ? ' · INACTIVE' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editItemBtn}
              onPress={() => tab === 'destinations' ? openDestForm(item) : openAmenityForm(item)}
            >
              <Text style={styles.editItemText}>Edit</Text>
            </TouchableOpacity>
            {item.isActive && (
              <TouchableOpacity
                style={styles.deactivateBtn}
                onPress={() => deactivate(tab, item.id)}
              >
                <Text style={styles.deactivateBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No {tab} yet.</Text>
        }
      />

      <ConfirmModal
        visible={!!confirmDeactivate}
        title="Hide this item?"
        message="It will no longer appear on the map or list. You can re-activate it later."
        confirmLabel="Deactivate"
        destructive
        onConfirm={confirmDeactivateAction}
        onCancel={() => setConfirmDeactivate(null)}
      />

      {/* Form modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit' : 'Add'} {formType === 'destination' ? 'Destination' : 'Amenity'}
            </Text>
            <TouchableOpacity onPress={formType === 'destination' ? saveDestination : saveAmenity} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {formType === 'destination' ? (
              <>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={destForm.name}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, name: v }))}
                  placeholder="Destination name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={destForm.description}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, description: v }))}
                  placeholder="Write a description..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                <Text style={styles.fieldLabel}>Categories</Text>
                <View style={styles.chipsGrid}>
                  {CATEGORIES.map((cat) => {
                    const sel = destForm.categories.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.formChip, sel && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => toggleCat(cat.id)}
                      >
                        <Text style={styles.formChipIcon}>{cat.icon}</Text>
                        <Text style={[styles.formChipLabel, sel && { color: '#fff' }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Suitable For</Text>
                <View style={styles.chipsGrid}>
                  {TRAVEL_TYPES.map((t) => {
                    const sel = destForm.suitableFor.includes(t);
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.formChip, sel && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => toggleSuitable(t)}
                      >
                        <Text style={[styles.formChipLabel, sel && { color: colors.background }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={destForm.latitude}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, latitude: v }))}
                  placeholder="e.g. 10.2926"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.fieldLabel}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={destForm.longitude}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, longitude: v }))}
                  placeholder="e.g. 123.0247"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.fieldLabel}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {destForm.photos.map((url) => (
                    <View key={url} style={styles.photoThumbWrapper}>
                      <Image source={{ uri: url }} style={styles.photoThumb} />
                      <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(url)}>
                        <Text style={styles.removePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickAndUploadPhoto} disabled={uploading}>
                    {uploading ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={styles.addPhotoBtnText}>+</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.chipsGrid}>
                  {AMENITY_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.formChip, amenityForm.type === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setAmenityForm((p) => ({ ...p, type: t }))}
                    >
                      <Text style={[styles.formChipLabel, amenityForm.type === t && { color: colors.background }]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={amenityForm.name}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, name: v }))}
                  placeholder="Amenity name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={amenityForm.description}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, description: v }))}
                  placeholder="Optional description"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                <Text style={styles.fieldLabel}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={amenityForm.latitude}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, latitude: v }))}
                  placeholder="e.g. 10.2926"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.fieldLabel}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={amenityForm.longitude}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, longitude: v }))}
                  placeholder="e.g. 123.0247"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                {amenityForm.type === 'restaurant' && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Local restaurant (not a chain)</Text>
                    <Switch
                      value={amenityForm.isLocalRestaurant}
                      onValueChange={(v) => setAmenityForm((p) => ({ ...p, isLocalRestaurant: v }))}
                      trackColor={{ true: colors.primary, false: colors.border }}
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.preset.heading1, color: colors.textPrimary },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  tabLabel: { ...typography.preset.label, color: colors.textSecondary },

  addBtn: {
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: { ...typography.preset.button, color: colors.background },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: { ...typography.preset.subtitle, color: colors.textPrimary, marginBottom: 2 },
  itemMeta: { ...typography.preset.caption, color: colors.textMuted },
  editItemBtn: {
    backgroundColor: colors.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  editItemText: { ...typography.preset.label, color: colors.primary },
  deactivateBtn: {
    backgroundColor: colors.danger + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 6,
  },
  deactivateBtnText: { ...typography.preset.label, color: colors.danger },
  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', paddingTop: 40 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.preset.heading3, color: colors.textPrimary },
  modalCancel: { ...typography.preset.button, color: colors.textMuted },
  modalSave: { ...typography.preset.button, color: colors.primary },
  formScroll: { padding: 20, paddingBottom: 60 },

  fieldLabel: { ...typography.preset.label, color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    ...typography.preset.body,
  },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  formChipIcon: { fontSize: 14 },
  formChipLabel: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },

  photoThumbWrapper: { position: 'relative', marginRight: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 10 },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtnText: { fontSize: 28, color: colors.textMuted },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { ...typography.preset.body, color: colors.textSecondary },
});
