import { useState, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, FlatList, Image, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { addDestination, updateDestination, addAmenity, updateAmenity } from '../../firebase/firestore';
import { useAdminContext } from '../../context/AdminContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CATEGORIES } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { darkMapStyle } from '../../constants/mapStyle';

const TRAVEL_TYPES  = ['solo', 'family', 'group'];
const AMENITY_TYPES = ['atm', 'hotel', 'restaurant'];
const NEGROS_REGION = { latitude: 10.2926, longitude: 123.0247, latitudeDelta: 1.5, longitudeDelta: 1.5 };

const SORT_OPTIONS = ['az', 'saved', 'active'];
const SORT_LABELS  = { az: 'A–Z', saved: '🔖 Saved', active: 'Active' };

const LAYERS_INIT = { atm: false, hotel: false, restaurant: false };
const AMENITY_ICONS = { atm: '💳', hotel: '🏨', restaurant: '🍴' };

const EMPTY_DEST = {
  name: '', description: '', categories: [], suitableFor: [],
  latitude: '', longitude: '', photos: [], video: '',
};
const EMPTY_AMENITY = {
  type: 'atm', name: '', description: '', latitude: '', longitude: '', isLocalRestaurant: false,
};

function getInitials(name) {
  return (name || 'D').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function DestinationsScreen() {
  const { destinations, amenities, bookmarkCounts } = useAdminContext();
  const toast = useToast();
  const mapRef = useRef(null);

  // View mode
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [layers, setLayers] = useState(LAYERS_INIT);
  const [listSearch, setListSearch] = useState('');
  const [listSort, setListSort] = useState('az');

  // Quick-view sheet (tap marker)
  const [selectedDest, setSelectedDest] = useState(null);

  // Confirm deactivate
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  // Form
  const [showForm, setShowForm]   = useState(false);
  const [formType, setFormType]   = useState('destination');
  const [editingId, setEditingId] = useState(null);
  const [destForm, setDestForm]   = useState(EMPTY_DEST);
  const [amenityForm, setAmenityForm] = useState(EMPTY_AMENITY);
  const [uploading, setUploading]       = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Map picker
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('destination');
  const [tempCoord, setTempCoord] = useState(null);

  // Derived list data
  const filteredDestinations = useMemo(() => {
    let list = destinations;
    const q = listSearch.trim().toLowerCase();
    if (q) list = list.filter((d) => d.name?.toLowerCase().includes(q));
    if (listSort === 'saved')  list = [...list].sort((a, b) => (bookmarkCounts[b.id] ?? 0) - (bookmarkCounts[a.id] ?? 0));
    if (listSort === 'az')     list = [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (listSort === 'active') list = [...list].sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
    return list;
  }, [destinations, listSearch, listSort, bookmarkCounts]);

  const visibleAmenities = amenities.filter((a) => a.isActive && layers[a.type]);

  // ── Form helpers ──────────────────────────────────────────────────────────
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
    setSelectedDest(null);
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
      toast.show({ title: 'No location selected', message: 'Long-press to drop a pin.', type: 'warning' });
      return;
    }
    const lat = String(tempCoord.latitude.toFixed(6));
    const lng = String(tempCoord.longitude.toFixed(6));
    if (mapPickerTarget === 'destination') setDestForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    else setAmenityForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    setShowMapPicker(false);
  }

  function toggleCat(id) {
    setDestForm((p) => ({
      ...p,
      categories: p.categories.includes(id) ? p.categories.filter((c) => c !== id) : [...p.categories, id],
    }));
  }

  function toggleSuitable(id) {
    setDestForm((p) => ({
      ...p,
      suitableFor: p.suitableFor.includes(id) ? p.suitableFor.filter((s) => s !== id) : [...p.suitableFor, id],
    }));
  }

  async function pickAndUploadPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const storageRef = ref(storage, `destinations/uploads/${Date.now()}.jpg`);
      const blob = await (await fetch(uri)).blob();
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob);
        task.on('state_changed', null, reject, () => resolve());
      });
      const url = await getDownloadURL(storageRef);
      setDestForm((p) => ({ ...p, photos: [...p.photos, url] }));
    } catch (e) {
      toast.show({ title: 'Upload Failed', message: e.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url) {
    setDestForm((p) => ({ ...p, photos: p.photos.filter((ph) => ph !== url) }));
  }

  async function pickAndUploadVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: 120 });
    if (result.canceled) return;
    setUploadingVideo(true);
    try {
      const uri = result.assets[0].uri;
      const storageRef = ref(storage, `destinations/videos/${Date.now()}.mp4`);
      const blob = await (await fetch(uri)).blob();
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob);
        task.on('state_changed', null, reject, () => resolve());
      });
      const url = await getDownloadURL(storageRef);
      setDestForm((p) => ({ ...p, video: url }));
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
      const payload = { name, description, categories, suitableFor,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        photos, video: video || '', isActive: true };
      if (editingId) await updateDestination(editingId, payload);
      else await addDestination(payload);
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
      const payload = { type, name, description,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        isLocalRestaurant: type === 'restaurant' ? isLocalRestaurant : false, isActive: true };
      if (editingId) await updateAmenity(editingId, payload);
      else await addAmenity(payload);
      setShowForm(false);
      toast.show({ title: editingId ? 'Amenity updated' : 'Amenity added', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirmDeactivate) return;
    const { id, collection_ } = confirmDeactivate;
    setConfirmDeactivate(null);
    setSelectedDest(null);
    try {
      if (collection_ === 'destinations') await updateDestination(id, { isActive: false });
      else await updateAmenity(id, { isActive: false });
      toast.show({ title: 'Item hidden from the app', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    }
  }

  async function handleActivate(id) {
    try {
      await updateDestination(id, { isActive: true });
      toast.show({ title: 'Destination reactivated', type: 'success' });
    } catch (e) {
      toast.show({ title: 'Something went wrong', message: e.message, type: 'error' });
    }
  }

  const hasCoord = (form) => form.latitude !== '' && form.longitude !== '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {viewMode === 'map' ? (
        /* ── MAP VIEW ── */
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={NEGROS_REGION}
            customMapStyle={darkMapStyle}
            showsUserLocation
            showsCompass={false}
          >
            {destinations.map((dest) => (
              <Marker
                key={dest.id}
                coordinate={{ latitude: dest.latitude, longitude: dest.longitude }}
                opacity={dest.isActive ? 1 : 0.35}
                onPress={() => setSelectedDest(dest)}
              >
                <View style={[styles.markerBubble, !dest.isActive && styles.markerBubbleInactive]}>
                  <Text style={styles.markerIcon}>
                    {CATEGORIES.find((c) => dest.categories?.[0] === c.id)?.icon ?? '📍'}
                  </Text>
                </View>
              </Marker>
            ))}
            {visibleAmenities.map((a) => (
              <Marker
                key={a.id}
                coordinate={{ latitude: a.latitude, longitude: a.longitude }}
              >
                <View style={[styles.amenityBubble, { backgroundColor: colors.amenity[a.type] + '30', borderColor: colors.amenity[a.type] }]}>
                  <Text style={{ fontSize: 14 }}>{AMENITY_ICONS[a.type]}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Top overlay */}
          <SafeAreaView style={styles.topOverlay} edges={['top']}>
            {/* Header row */}
            <View style={styles.topRow}>
              <View style={styles.headerChip}>
                <Text style={styles.headerChipText}>🗺️  All Destinations</Text>
              </View>
              <TouchableOpacity style={styles.viewToggleBtn} onPress={() => setViewMode('list')}>
                <Text style={styles.viewToggleText}>☰ List</Text>
              </TouchableOpacity>
            </View>
            {/* Layer toggles */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layersRow}>
              {AMENITY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.layerChip, layers[type] && { backgroundColor: colors.amenity[type] + '30', borderColor: colors.amenity[type] }]}
                  onPress={() => setLayers((p) => ({ ...p, [type]: !p[type] }))}
                >
                  <Text style={styles.layerChipText}>
                    {AMENITY_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>

          {/* FAB */}
          <SafeAreaView style={styles.fabWrap} edges={['bottom']}>
            <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => openAmenityForm()}>
              <Text style={styles.fabSecondaryText}>+ Amenity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fab} onPress={() => openDestForm()}>
              <Text style={styles.fabText}>+ Destination</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Destination Quick-View Sheet */}
          {selectedDest && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              {selectedDest.photos?.[0] ? (
                <Image source={{ uri: selectedDest.photos[0] }} style={styles.sheetPhoto} />
              ) : (
                <View style={styles.sheetPhotoPlaceholder}>
                  <Text style={{ fontSize: 40 }}>{CATEGORIES.find((c) => selectedDest.categories?.[0] === c.id)?.icon ?? '🏔️'}</Text>
                </View>
              )}
              <View style={styles.sheetBody}>
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetName} numberOfLines={1}>{selectedDest.name}</Text>
                  <View style={[styles.statusBadge, selectedDest.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{selectedDest.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
                <View style={styles.sheetMetaRow}>
                  <Text style={styles.sheetSaves}>🔖 {bookmarkCounts[selectedDest.id] ?? 0} saves</Text>
                  <Text style={styles.sheetCats}>{(selectedDest.categories ?? []).join(', ')}</Text>
                </View>
                {!!selectedDest.description && (
                  <Text style={styles.sheetDesc} numberOfLines={2}>{selectedDest.description}</Text>
                )}
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.sheetEditBtn} onPress={() => openDestForm(selectedDest)}>
                    <Text style={styles.sheetEditText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  {selectedDest.isActive ? (
                    <TouchableOpacity
                      style={styles.sheetDeactivateBtn}
                      onPress={() => setConfirmDeactivate({ id: selectedDest.id, collection_: 'destinations' })}
                    >
                      <Text style={styles.sheetDeactivateText}>Deactivate</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.sheetActivateBtn}
                      onPress={() => { handleActivate(selectedDest.id); setSelectedDest(null); }}
                    >
                      <Text style={styles.sheetActivateText}>Reactivate</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setSelectedDest(null)}>
                    <Text style={styles.sheetCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </>
      ) : (
        /* ── LIST VIEW ── */
        <SafeAreaView style={styles.listSafe} edges={['top']}>
          <View style={styles.listHeader}>
            <TouchableOpacity style={styles.viewToggleBtn} onPress={() => setViewMode('map')}>
              <Text style={styles.viewToggleText}>🗺️ Map</Text>
            </TouchableOpacity>
            <Text style={styles.listTitle}>All Places</Text>
            <TouchableOpacity style={styles.addInlineBtn} onPress={() => openDestForm()}>
              <Text style={styles.addInlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            value={listSearch}
            onChangeText={setListSearch}
            placeholder="Search destinations…"
            placeholderTextColor={colors.textMuted}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
            {SORT_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sortChip, listSort === s && styles.sortChipActive]}
                onPress={() => setListSort(s)}
              >
                <Text style={[styles.sortChipText, listSort === s && styles.sortChipTextActive]}>
                  {SORT_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredDestinations}
            keyExtractor={(d) => d.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.listItem, !item.isActive && { opacity: 0.45 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemMeta}>
                    {(item.categories ?? []).join(', ')}{!item.isActive ? ' · INACTIVE' : ''}
                  </Text>
                </View>
                <View style={styles.saveBadgeSmall}>
                  <Text style={styles.saveBadgeSmallText}>🔖 {bookmarkCounts[item.id] ?? 0}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => openDestForm(item)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                {item.isActive ? (
                  <TouchableOpacity
                    style={styles.deactivateBtn}
                    onPress={() => setConfirmDeactivate({ id: item.id, collection_: 'destinations' })}
                  >
                    <Text style={styles.deactivateBtnText}>✕</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.activateBtn} onPress={() => handleActivate(item.id)}>
                    <Text style={styles.activateBtnText}>↩</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No destinations found.</Text>}
          />

          {/* Amenity add button */}
          <TouchableOpacity style={styles.amenityFloatBtn} onPress={() => openAmenityForm()}>
            <Text style={styles.amenityFloatText}>+ Add Amenity</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ── Confirm deactivate ── */}
      <ConfirmModal
        visible={!!confirmDeactivate}
        title="Hide this item?"
        message="It will no longer appear on the map or list. You can re-activate it later."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmDeactivate(null)}
      />

      {/* ── Form Modal ── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.formSafe} edges={['top', 'bottom']}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.formCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>
              {editingId ? 'Edit' : 'Add'} {formType === 'destination' ? 'Destination' : 'Amenity'}
            </Text>
            <TouchableOpacity onPress={formType === 'destination' ? saveDestination : saveAmenity} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.formSave}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {formType === 'destination' ? (
              <>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput style={styles.input} value={destForm.name}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, name: v }))}
                  placeholder="Destination name" placeholderTextColor={colors.textMuted} />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={destForm.description}
                  onChangeText={(v) => setDestForm((p) => ({ ...p, description: v }))}
                  placeholder="Write a description..." placeholderTextColor={colors.textMuted} multiline />

                <Text style={styles.fieldLabel}>Categories</Text>
                <View style={styles.chipsGrid}>
                  {CATEGORIES.map((cat) => {
                    const sel = destForm.categories.includes(cat.id);
                    return (
                      <TouchableOpacity key={cat.id}
                        style={[styles.chip, sel && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => toggleCat(cat.id)}>
                        <Text style={styles.chipIcon}>{cat.icon}</Text>
                        <Text style={[styles.chipLabel, sel && { color: '#fff' }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Suitable For</Text>
                <View style={styles.chipsGrid}>
                  {TRAVEL_TYPES.map((t) => {
                    const sel = destForm.suitableFor.includes(t);
                    return (
                      <TouchableOpacity key={t}
                        style={[styles.chip, sel && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => toggleSuitable(t)}>
                        <Text style={[styles.chipLabel, sel && { color: colors.background }]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Location *</Text>
                <TouchableOpacity
                  style={[styles.mapPickerBtn, hasCoord(destForm) && styles.mapPickerBtnSet]}
                  onPress={() => openMapPicker('destination')}
                >
                  <Text style={{ fontSize: 20 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    {hasCoord(destForm) ? (
                      <>
                        <Text style={[styles.mapPickerLabel, { color: colors.primary }]}>Location Set</Text>
                        <Text style={styles.mapPickerCoords}>
                          {parseFloat(destForm.latitude).toFixed(5)},{'  '}{parseFloat(destForm.longitude).toFixed(5)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.mapPickerLabel}>Tap to pick location on map</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {destForm.photos.map((url) => (
                    <View key={url} style={styles.photoWrap}>
                      <Image source={{ uri: url }} style={styles.photoThumb} />
                      <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(url)}>
                        <Text style={styles.removePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickAndUploadPhoto} disabled={uploading}>
                    {uploading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.addPhotoBtnText}>+</Text>}
                  </TouchableOpacity>
                </ScrollView>

                <Text style={styles.fieldLabel}>Video</Text>
                {destForm.video ? (
                  <View style={styles.videoCard}>
                    <View style={styles.videoIconWrap}><Text style={{ fontSize: 18, color: colors.primary }}>▶</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.videoAttached}>Video attached</Text>
                      <Text style={styles.videoAttachedSub}>Tap × to remove</Text>
                    </View>
                    <TouchableOpacity style={styles.removeVideoBtn} onPress={() => setDestForm((p) => ({ ...p, video: '' }))}>
                      <Text style={styles.removeVideoBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addVideoBtn} onPress={pickAndUploadVideo} disabled={uploadingVideo}>
                    {uploadingVideo
                      ? <><ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} /><Text style={styles.addVideoBtnText}>Uploading…</Text></>
                      : <><Text style={{ fontSize: 20 }}>🎬</Text><Text style={styles.addVideoBtnText}>Add Video</Text></>
                    }
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.chipsGrid}>
                  {AMENITY_TYPES.map((t) => (
                    <TouchableOpacity key={t}
                      style={[styles.chip, amenityForm.type === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setAmenityForm((p) => ({ ...p, type: t }))}>
                      <Text style={[styles.chipLabel, amenityForm.type === t && { color: colors.background }]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput style={styles.input} value={amenityForm.name}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, name: v }))}
                  placeholder="Amenity name" placeholderTextColor={colors.textMuted} />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={amenityForm.description}
                  onChangeText={(v) => setAmenityForm((p) => ({ ...p, description: v }))}
                  placeholder="Optional description" placeholderTextColor={colors.textMuted} multiline />

                <Text style={styles.fieldLabel}>Location *</Text>
                <TouchableOpacity
                  style={[styles.mapPickerBtn, hasCoord(amenityForm) && styles.mapPickerBtnSet]}
                  onPress={() => openMapPicker('amenity')}
                >
                  <Text style={{ fontSize: 20 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    {hasCoord(amenityForm) ? (
                      <>
                        <Text style={[styles.mapPickerLabel, { color: colors.primary }]}>Location Set</Text>
                        <Text style={styles.mapPickerCoords}>
                          {parseFloat(amenityForm.latitude).toFixed(5)},{'  '}{parseFloat(amenityForm.longitude).toFixed(5)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.mapPickerLabel}>Tap to pick location on map</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={tempCoord ? { ...tempCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 } : NEGROS_REGION}
            customMapStyle={darkMapStyle}
            onLongPress={(e) => setTempCoord(e.nativeEvent.coordinate)}
          >
            {tempCoord && (
              <Marker coordinate={tempCoord} draggable pinColor={colors.primary}
                onDragEnd={(e) => setTempCoord(e.nativeEvent.coordinate)} />
            )}
          </MapView>
          <SafeAreaView style={styles.mapPickerTopBar} edges={['top']}>
            <TouchableOpacity style={styles.mapPickerCloseBtn} onPress={() => setShowMapPicker(false)}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
            <View style={styles.mapPickerHintBadge}>
              <Text style={styles.mapPickerHintText}>Long-press to drop pin · Drag to adjust</Text>
            </View>
          </SafeAreaView>
          <SafeAreaView style={styles.mapPickerBottomBar} edges={['bottom']}>
            <Text style={styles.mapPickerCoordText}>
              {tempCoord
                ? `${tempCoord.latitude.toFixed(6)},  ${tempCoord.longitude.toFixed(6)}`
                : 'No location selected yet'}
            </Text>
            <TouchableOpacity
              style={[styles.mapPickerConfirmBtn, !tempCoord && { opacity: 0.4 }]}
              onPress={confirmMapCoord} disabled={!tempCoord}
            >
              <Text style={styles.mapPickerConfirmText}>Use This Location</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Map overlay
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  headerChip: { flex: 1, backgroundColor: colors.overlay, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  headerChipText: { ...typography.preset.label, color: colors.textPrimary },
  viewToggleBtn: { backgroundColor: colors.overlay, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  viewToggleText: { ...typography.preset.label, color: colors.textSecondary },
  layersRow: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  layerChip: { backgroundColor: colors.overlay, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent' },
  layerChipText: { ...typography.preset.label, color: colors.textSecondary },

  // FAB
  fabWrap: { position: 'absolute', bottom: 0, right: 0, left: 0, flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  fab: { backgroundColor: colors.primary, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  fabText: { ...typography.preset.button, color: colors.background },
  fabSecondary: { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent },
  fabSecondaryText: { ...typography.preset.button, color: colors.accent },

  // Quick-view sheet
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetPhoto: { width: '100%', height: 140 },
  sheetPhotoPlaceholder: { width: '100%', height: 100, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: 16 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sheetName: { ...typography.preset.heading2, color: colors.textPrimary, flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusActive: { backgroundColor: colors.primaryDim },
  statusInactive: { backgroundColor: colors.danger + '20' },
  statusText: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },
  sheetMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sheetSaves: { ...typography.preset.label, color: colors.accent },
  sheetCats: { ...typography.preset.caption, color: colors.textMuted, flex: 1 },
  sheetDesc: { ...typography.preset.body, color: colors.textSecondary, marginBottom: 14 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetEditBtn: { flex: 2, backgroundColor: colors.primaryDim, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  sheetEditText: { ...typography.preset.button, color: colors.primary },
  sheetDeactivateBtn: { flex: 1, backgroundColor: colors.danger + '20', borderRadius: 12, borderWidth: 1, borderColor: colors.danger, paddingVertical: 12, alignItems: 'center' },
  sheetDeactivateText: { ...typography.preset.button, color: colors.danger },
  sheetActivateBtn: { flex: 1, backgroundColor: colors.primaryDim, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  sheetActivateText: { ...typography.preset.button, color: colors.primary },
  sheetCloseBtn: { width: 46, backgroundColor: colors.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { ...typography.preset.label, color: colors.textMuted },

  // Marker
  markerBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  markerBubbleInactive: { borderColor: colors.danger, backgroundColor: colors.card },
  markerIcon: { fontSize: 18 },
  amenityBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },

  // List view
  listSafe: { flex: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { ...typography.preset.heading2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  addInlineBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addInlineBtnText: { ...typography.preset.button, color: colors.background },
  searchInput: { ...typography.preset.body, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: colors.textPrimary, margin: 16, marginBottom: 8 },
  sortRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  sortChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sortChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  sortChipText: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },
  sortChipTextActive: { color: colors.primary },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  listItemName: { ...typography.preset.subtitle, color: colors.textPrimary, marginBottom: 2 },
  listItemMeta: { ...typography.preset.caption, color: colors.textMuted },
  saveBadgeSmall: { backgroundColor: colors.accentDim, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, marginHorizontal: 4 },
  saveBadgeSmallText: { ...typography.preset.chip, color: colors.accent },
  editBtn: { backgroundColor: colors.primaryDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 4 },
  editBtnText: { ...typography.preset.label, color: colors.primary },
  deactivateBtn: { backgroundColor: colors.danger + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 4 },
  deactivateBtnText: { ...typography.preset.label, color: colors.danger },
  activateBtn: { backgroundColor: colors.primaryDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 4 },
  activateBtnText: { ...typography.preset.label, color: colors.primary },
  emptyText: { ...typography.preset.body, color: colors.textMuted, textAlign: 'center', paddingTop: 40 },
  amenityFloatBtn: { position: 'absolute', bottom: 16, right: 16, left: 16, backgroundColor: colors.accentDim, borderRadius: 14, borderWidth: 1, borderColor: colors.accent, paddingVertical: 14, alignItems: 'center' },
  amenityFloatText: { ...typography.preset.button, color: colors.accent },

  // Form modal
  formSafe: { flex: 1, backgroundColor: colors.background },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  formTitle: { ...typography.preset.heading3, color: colors.textPrimary },
  formCancel: { ...typography.preset.button, color: colors.textMuted },
  formSave: { ...typography.preset.button, color: colors.primary },
  formScroll: { padding: 20, paddingBottom: 60 },
  fieldLabel: { ...typography.preset.label, color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: colors.textPrimary, ...typography.preset.body },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: colors.border },
  chipIcon: { fontSize: 14 },
  chipLabel: { ...typography.preset.chip, color: colors.textSecondary, textTransform: 'uppercase' },
  mapPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 14 },
  mapPickerBtnSet: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  mapPickerLabel: { ...typography.preset.body, color: colors.textSecondary },
  mapPickerCoords: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  photoWrap: { position: 'relative', marginRight: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 10 },
  removePhoto: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtnText: { fontSize: 28, color: colors.textMuted },
  videoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: 14, paddingVertical: 14 },
  videoIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  videoAttached: { ...typography.preset.subtitle, color: colors.textPrimary },
  videoAttachedSub: { ...typography.preset.caption, color: colors.textMuted, marginTop: 2 },
  removeVideoBtn: { backgroundColor: colors.danger + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  removeVideoBtnText: { ...typography.preset.label, color: colors.danger },
  addVideoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', paddingVertical: 16 },
  addVideoBtnText: { ...typography.preset.button, color: colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { ...typography.preset.body, color: colors.textSecondary },

  // Map picker modal
  mapPickerTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  mapPickerCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  mapPickerHintBadge: { flex: 1, backgroundColor: colors.overlay, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  mapPickerHintText: { ...typography.preset.caption, color: colors.textSecondary },
  mapPickerBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.overlay, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 },
  mapPickerCoordText: { ...typography.preset.label, color: colors.textSecondary, textAlign: 'center' },
  mapPickerConfirmBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  mapPickerConfirmText: { ...typography.preset.button, color: colors.background },
});
