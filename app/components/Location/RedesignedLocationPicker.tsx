import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion, SavedAddress } from '../../types/location';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { useLocationPicker } from '../../hooks/useLocationPicker';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const { width, height } = Dimensions.get('window');

interface RedesignedLocationPickerProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  onBack?: () => void;
  initialLocation?: LocationSuggestion | null;
  placeholder?: string;
}

const RedesignedLocationPicker: React.FC<RedesignedLocationPickerProps> = ({
  onLocationSelect,
  onBack,
  initialLocation,
  placeholder = 'Search for your address',
}) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // Get Saved Locations
  const { savedAddresses, saveCurrentLocation, isCurrentLocationSaved } =
    useDeliveryLocation();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [saveLabelType, setSaveLabelType] = useState<'Home' | 'Work' | 'Other'>(
    'Home'
  );

  // Use custom hook for map logic
  const {
    region,
    isMapMoving,
    selectedLocation,
    isGeocoding,
    searchQuery,
    suggestions,
    isSearching,
    handleRegionChange,
    handleRegionChangeComplete,
    handleSearch,
    selectSuggestion,
    moveToCurrentLocation,
    confirmLocation,
    updateLocationDetails,
  } = useLocationPicker({
    initialLocation,
    onLocationSelect: loc => {
      // Just selecting via map doesn't auto-confirm unless we want it to
    },
  });

  // UI State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [noteToDriver, setNoteToDriver] = useState('');

  // Animations
  const pinScale = useRef(new Animated.Value(1)).current;
  const pinTranslateY = useRef(new Animated.Value(0)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(1)).current;

  // Sync map with region changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 400);
    }
  }, [region]);

  // Animate Pin on map move
  useEffect(() => {
    if (isMapMoving) {
      Animated.parallel([
        Animated.spring(pinScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(pinTranslateY, { toValue: -15, useNativeDriver: true }),
        Animated.timing(bottomSheetTranslateY, {
          toValue: 200, // Hide bottom sheet
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarOpacity, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(pinScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(pinTranslateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(bottomSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        }),
        Animated.timing(searchBarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMapMoving]);

  // Handlers
  const handleConfirm = () => {
    if (selectedLocation) {
      // Combine extra details
      const finalLocation = {
        ...selectedLocation,
        deliveryInfo: {
          ...selectedLocation.deliveryInfo,
          specialInstructions: noteToDriver,
        },
      };
      onLocationSelect(finalLocation);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) return;
    const success = await saveCurrentLocation(
      saveLabel || saveLabelType,
      saveLabelType === 'Home'
        ? 'home'
        : saveLabelType === 'Work'
          ? 'briefcase'
          : 'location',
      COLORS.primary
    );
    if (success) {
      setShowSaveModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowSearchModal(false)}
            style={styles.modalCloseButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.modalSearchField}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search address, postal code..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.modalContent}>
          {searchQuery.length === 0 ? (
            // Saved & Recent Locations
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={styles.sectionTitle}>Saved Places</Text>
              {savedAddresses.length > 0 ? (
                savedAddresses.map(addr => (
                  <TouchableOpacity
                    key={addr.id}
                    style={styles.savedLocationItem}
                    onPress={() => {
                      selectSuggestion(addr.location);
                      setShowSearchModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.savedIcon,
                        {
                          backgroundColor: addr.color || COLORS.primary + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name={(addr.icon as any) || 'location'}
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.savedLabel}>{addr.label}</Text>
                      <Text style={styles.savedAddress} numberOfLines={1}>
                        {addr.location.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No saved locations yet.</Text>
              )}

              <TouchableOpacity
                style={styles.useCurrentLocationRow}
                onPress={() => {
                  moveToCurrentLocation();
                  setShowSearchModal(false);
                }}
              >
                <View style={styles.currentLocationIcon}>
                  <Ionicons name="navigate" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.useCurrentText}>
                  Use my current location
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // Search Results
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: SPACING.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    selectSuggestion(item);
                    setShowSearchModal(false);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={COLORS.text}
                    />
                  </View>
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                isSearching ? (
                  <ActivityIndicator
                    style={{ marginTop: 20 }}
                    color={COLORS.primary}
                  />
                ) : (
                  <Text style={styles.emptyText}>No results found</Text>
                )
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={GOOGLE_MAPS_CONFIG.mapStyle}
      />

      {/* Floating Header */}
      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <Animated.View
          style={[styles.searchCard, { opacity: searchBarOpacity }]}
        >
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.9}
          >
            <View style={styles.searchDot} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {selectedLocation ? selectedLocation.title : placeholder}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Center Pin */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ scale: pinScale }, { translateY: pinTranslateY }],
          }}
        >
          {/* Custom Pin Design */}
          <View style={styles.pinHead}>
            <MaterialCommunityIcons
              name="map-marker"
              size={42}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.pinShadow} />
        </Animated.View>
      </View>

      {/* Current Location FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: height * 0.42 }]} // Position above bottom sheet
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          moveToCurrentLocation();
        }}
      >
        <Ionicons name="locate" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
        style={styles.bottomSheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetTranslateY }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.addressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>
                {isGeocoding
                  ? 'Locating...'
                  : selectedLocation?.title || 'Unknown Location'}
              </Text>
              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {isGeocoding
                  ? 'Please wait...'
                  : selectedLocation?.formattedAddress ||
                    selectedLocation?.subtitle ||
                    'Move map to adjust'}
              </Text>
            </View>
            {!isGeocoding && selectedLocation && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowSaveModal(true)}
              >
                <Ionicons
                  name={
                    isCurrentLocationSaved() ? 'bookmark' : 'bookmark-outline'
                  }
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <View
                style={[styles.inputWrapper, { flex: 0.4, marginRight: 12 }]}
              >
                <Text style={styles.inputLabel}>Unit No.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g #02-05"
                  value={selectedLocation?.unitNumber}
                  onChangeText={t => updateLocationDetails({ unitNumber: t })}
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 0.6 }]}>
                <Text style={styles.inputLabel}>Building / Landmark</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g Lobby A"
                  value={selectedLocation?.buildingName}
                  onChangeText={t => updateLocationDetails({ buildingName: t })}
                  returnKeyType="done"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Note to driver (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Call upon arrival"
                value={noteToDriver}
                onChangeText={setNoteToDriver}
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (isGeocoding || !selectedLocation) && styles.disabledButton,
            ]}
            onPress={handleConfirm}
            disabled={isGeocoding || !selectedLocation}
          >
            {isGeocoding ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Simple Save Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.saveModalCard}>
            <Text style={styles.saveModalTitle}>Save Location</Text>
            <Text style={styles.saveModalSubtitle}>
              Give this location a name
            </Text>

            <View style={styles.tagContainer}>
              {['Home', 'Work', 'Other'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tag,
                    saveLabelType === type && styles.activeTag,
                  ]}
                  onPress={() => setSaveLabelType(type as any)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      saveLabelType === type && styles.activeTagText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {saveLabelType === 'Other' && (
              <TextInput
                style={styles.saveInput}
                placeholder="Custom Name (e.g. Mom's House)"
                value={saveLabel}
                onChangeText={setSaveLabel}
                autoFocus
              />
            )}

            <View style={styles.saveActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveConfirmButton}
                onPress={handleSaveLocation}
              >
                <Text style={styles.saveConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? SPACING.md : 0,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.sm,
    ...SHADOWS.medium,
    marginTop: SPACING.xs,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: COLORS.background, // Slightly grey background
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  centerPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40, // Adjust for pin height
  },
  pinHead: {
    // Basic pin styling
  },
  pinShadow: {
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 6,
    marginTop: -2,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    ...SHADOWS.medium,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  sheetSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  saveButton: {
    padding: 8,
    marginLeft: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background, // Light grey
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: COLORS.primary, // Black usually
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.h4,
    color: '#fff',
    fontWeight: '600',
  },
  // Search Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    padding: 8,
    marginRight: 4,
  },
  modalSearchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  modalContent: {
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '600',
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  savedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  savedLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  savedAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  useCurrentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  currentLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  useCurrentText: {
    fontWeight: '600',
    color: COLORS.primary,
    fontSize: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIconContainer: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  // Save Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  saveModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.medium,
  },
  saveModalTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  saveModalSubtitle: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  tag: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTag: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontWeight: '500',
    color: COLORS.text,
  },
  activeTagText: {
    color: '#fff',
  },
  saveInput: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default RedesignedLocationPicker;
