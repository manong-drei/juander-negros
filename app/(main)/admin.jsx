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
import { collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { db, storage } from '../../firebase/config';
import { addDestination, updateDestination, addAmenity, updateAmenity } from '../../firebase/firestore';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { darkMapStyle } from '../../constants/mapStyle';

const TRAVEL_TYPES = ['solo', 'family', 'group'];
const AMENITY_TYPES = ['atm', 'hotel', 'restaurant'];

const NEGROS_REGION = {
  latitude: 10.2926,
  longitude: 123.0247,
  latitudeDelta: 1.5,
  longitudeDelta: 1.5,
};

const EMPTY_DEST = {
  name: '', description: '', categories: [], suitableFor: [],
  latitude: '', longitude: '', photos: [], video: '',
};

const EMPTY_AMENITY = {
  type: 'atm', name: '', description: '', latitude: '', longitude: '', isLocalRestaurant: false,
};

export default function AdminScreen() {
  const { profile } = useAppContext();
  const toast = useToast();
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const [tab, setTab] = useState('destinations');
  const [destinations, setDestinations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('destination');
  const [editingId, setEditingId] = useState(null);
  const [destForm, setDestForm] = useState(EMPTY_DEST);
  const [amenityForm, setAmenityForm] = useState(EMPTY_AMENITY);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('destination');
  const [tempCoord, setTempCoord] = useState(null);

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
      video: item.video ?? '',
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

  function openMapPicker(target) {
    setMapPickerTarget(target);
    const form = target === 'destination' ? destForm : amenityForm;
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    setTempCoord(!isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : null);
    setShowMapPicker(true);
  }

  function confirmMapCoord() {
    if (!tempCoord) {
      toast.show({ title: 'No location selected', message: 'Long-press on the map to drop a pin.', type: 'warning' });
      return;
    }
    const lat = String(tempCoord.latitude.toFixed(6));
    const lng = String(tempCoord.longitude.toFixed(6));
    if (mapPickerTarget === 'destination') {
      setDestForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    } else {
      setAmenityForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    }
    setShowMapPicker(false);
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
      mediaTypes: ['images'],
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

  async function pickAndUploadVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 120,
    });
    if (result.canceled) return;

    setUploadingVideo(true);
    try {
      const uri = result.assets[0].uri;
      const filename = `${Date.now()}.mp4`;
      const storageRef = ref(storage, `destinations/videos/${filename}`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob);
        task.on('state_changed', null, reject, () => resolve());
      });
      const url = await getDownloadURL(storageRef);
      setDestForm((prev) => ({ ...prev, video: url }));
      toast.show({ title: 'Video uploaded', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Video Upload Failed', message: e.message, type: 'error' });
    } finally {
      setUploadingVideo(false);
    }
  }

  async function saveDestination() {
    const { name, latitude, longitude, description, categories, suitableFor, photos, video } = destForm;
    if (!name || !latitude || !longitude) {
      toast.show({ title: 'Required Fields Missing', message: 'Name and location are required.', type: 'warning' });
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
        video: video || '',
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
      toast.show({ title: 'Required Fields Missing', message: 'Name and location are required.', type: 'warning' });
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

  const hasCoord = (form) => form.latitude !== '' && form.longitude !== '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

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

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => tab === 'destinations' ? openDestForm() : openAmenityForm()}
      >
        <Text style={styles.addBtnText}>+ Add {tab === 'destinations' ? 'Destination' : 'Amenity'}</Text>
      </TouchableOpacity>

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

      {/* ── Form Modal ── */}
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

                <Text style={styles.fieldLabel}>Location *</Text>
                <TouchableOpacity
                  style={[styles.mapPickerBtn, hasCoord(destForm) && styles.mapPickerBtnSet]}
                  onPress={() => openMapPicker('destination')}
                >
                  <Text style={styles.mapPickerIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    {hasCoord(destForm) ? (
                      <>
                        <Text style={[styles.mapPickerPrimaryLabel, { color: colors.primary }]}>Location Set</Text>
                        <Text style={styles.mapPickerCoords}>
                          {parseFloat(destForm.latitude).toFixed(5)},{'  '}
                          {parseFloat(destForm.longitude).toFixed(5)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.mapPickerPrimaryLabel}>Tap to pick location on map</Text>
                    )}
                  </View>
                  <Text style={styles.mapPickerChevron}>›</Text>
                </TouchableOpacity>

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

                <Text style={styles.fieldLabel}>Video</Text>
                {destForm.video ? (
                  <View style={styles.videoCard}>
                    <View style={styles.videoIconWrap}>
                      <Text style={styles.videoPlayIcon}>▶</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.videoAttachedLabel}>Video attached</Text>
                      <Text style={styles.videoAttachedSub}>Tap × to remove and re-upload</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeVideoBtn}
                      onPress={() => setDestForm((p) => ({ ...p, video: '' }))}
                    >
                      <Text style={styles.removeVideoBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addVideoBtn}
                    onPress={pickAndUploadVideo}
                    disabled={uploadingVideo}
                  >
                    {uploadingVideo ? (
                      <>
                        <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.addVideoBtnText}>Uploading…</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.addVideoBtnIcon}>🎬</Text>
                        <Text style={styles.addVideoBtnText}>Add Video</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
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

                <Text style={styles.fieldLabel}>Location *</Text>
                <TouchableOpacity
                  style={[styles.mapPickerBtn, hasCoord(amenityForm) && styles.mapPickerBtnSet]}
                  onPress={() => openMapPicker('amenity')}
                >
                  <Text style={styles.mapPickerIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    {hasCoord(amenityForm) ? (
                      <>
                        <Text style={[styles.mapPickerPrimaryLabel, { color: colors.primary }]}>Location Set</Text>
                        <Text style={styles.mapPickerCoords}>
                          {parseFloat(amenityForm.latitude).toFixed(5)},{'  '}
                          {parseFloat(amenityForm.longitude).toFixed(5)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.mapPickerPrimaryLabel}>Tap to pick location on map</Text>
                    )}
                  </View>
                  <Text style={styles.mapPickerChevron}>›</Text>
                </TouchableOpacity>

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

      {/* ── Map Picker Modal ── */}
      <Modal visible={showMapPicker} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.mapPickerScreen}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={
              tempCoord
                ? { ...tempCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 }
                : NEGROS_REGION
            }
            customMapStyle={darkMapStyle}
            onLongPress={(e) => setTempCoord(e.nativeEvent.coordinate)}
          >
            {tempCoord && (
              <Marker
                coordinate={tempCoord}
                draggable
                onDragEnd={(e) => setTempCoord(e.nativeEvent.coordinate)}
                pinColor={colors.primary}
              />
            )}
          </MapView>

          <SafeAreaView style={styles.mapPickerTopBar} edges={['top']}>
            <TouchableOpacity style={styles.mapPickerCloseBtn} onPress={() => setShowMapPicker(false)}>
              <Text style={styles.mapPickerCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.mapPickerInstructionBadge}>
              <Text style={styles.mapPickerInstructionText}>Long-press to drop pin · Drag to adjust</Text>
            </View>
          </SafeAreaView>

          <SafeAreaView style={styles.mapPickerBottomBar} edges={['bottom']}>
            {tempCoord ? (
              <Text style={styles.mapPickerCoordDisplay}>
                {tempCoord.latitude.toFixed(6)},{'  '}{tempCoord.longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.mapPickerNoPin}>No location selected yet</Text>
            )}
            <TouchableOpacity
              style={[styles.mapPickerConfirmBtn, !tempCoord && { opacity: 0.4 }]}
              onPress={confirmMapCoord}
              disabled={!tempCoord}
            >
              <Text style={styles.mapPickerConfirmText}>Use This Location</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
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

  // Form modal
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

  // Map picker button (in form)
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mapPickerBtnSet: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  mapPickerIcon: { fontSize: 20 },
  mapPickerPrimaryLabel: { ...typography.preset.body, color: colors.textSecondary },
  mapPickerCoords: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  mapPickerChevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },

  // Photos
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

  // Video
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  videoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: { fontSize: 18, color: colors.primary },
  videoAttachedLabel: { ...typography.preset.subtitle, color: colors.textPrimary },
  videoAttachedSub: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  removeVideoBtn: {
    backgroundColor: colors.danger + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeVideoBtnText: { ...typography.preset.label, color: colors.danger },
  addVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: 16,
  },
  addVideoBtnIcon: { fontSize: 20 },
  addVideoBtnText: { ...typography.preset.button, color: colors.textSecondary },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { ...typography.preset.body, color: colors.textSecondary },

  // Map picker full-screen modal
  mapPickerScreen: { flex: 1, backgroundColor: colors.background },
  mapPickerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  mapPickerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerCloseText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  mapPickerInstructionBadge: {
    flex: 1,
    backgroundColor: colors.overlay,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mapPickerInstructionText: { ...typography.preset.caption, color: colors.textSecondary },
  mapPickerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  mapPickerCoordDisplay: {
    ...typography.preset.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapPickerNoPin: {
    ...typography.preset.label,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mapPickerConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mapPickerConfirmText: { ...typography.preset.button, color: colors.background },
});
