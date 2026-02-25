import React, { useRef, useEffect } from 'react';
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
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { useLocationPicker } from '../../hooks/useLocationPicker';

const { width, height } = Dimensions.get('window');

interface ModernLocationPickerProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  onBack?: () => void;
  initialLocation?: LocationSuggestion | null;
  placeholder?: string;
}

const ModernLocationPicker: React.FC<ModernLocationPickerProps> = ({
  onLocationSelect,
  onBack,
  initialLocation,
  placeholder = 'Search for an address',
}) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // Use custom hook for logic
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
    onLocationSelect,
  });

  // UI State
  const [showSearchModal, setShowSearchModal] = React.useState(false);

  // Animations
  const pinScale = useRef(new Animated.Value(1)).current;
  const pinTranslateY = useRef(new Animated.Value(0)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(0)).current;

  // Sync map with region changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [region]);

  // Animate Pin on map move
  useEffect(() => {
    if (isMapMoving) {
      Animated.parallel([
        Animated.spring(pinScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(pinTranslateY, { toValue: -10, useNativeDriver: true }),
        Animated.timing(bottomSheetTranslateY, {
          toValue: 100,
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
      ]).start();
    }
  }, [isMapMoving]);

  // Handle Search Modal
  const handleSearchFocus = () => setShowSearchModal(true);

  const handleSuggestionPress = (item: LocationSuggestion) => {
    setShowSearchModal(false);
    selectSuggestion(item);
  };

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowSearchModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Search Address</Text>
        </View>

        <View style={styles.modalSearchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.modalSearchInput}
            placeholder="Enter address..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(item)}
            >
              <View style={styles.suggestionIconContainer}>
                <Ionicons name="location" size={20} color={COLORS.text} />
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            isSearching ? (
              <ActivityIndicator
                style={{ marginTop: 20 }}
                color={COLORS.primary}
              />
            ) : searchQuery.length > 0 ? (
              <Text style={styles.emptyText}>No results found</Text>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={GOOGLE_MAPS_CONFIG.mapStyle}
      />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea} pointerEvents="box-none">
        <View style={styles.topBar}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.searchBar, !onBack && { marginLeft: SPACING.lg }]}
            onPress={handleSearchFocus}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {selectedLocation ? selectedLocation.title : placeholder}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Center Pin */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Animated.View
          style={{
            transform: [{ scale: pinScale }, { translateY: pinTranslateY }],
          }}
        >
          <Ionicons
            name="location"
            size={48}
            color={COLORS.primary || 'black'}
          />
          <View style={styles.pinShadow} />
        </Animated.View>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={[styles.currentLocationButton, { bottom: height * 0.45 }]}
        onPress={moveToCurrentLocation}
      >
        <Ionicons name="locate" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Bottom Sheet with Details */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
        contentContainerStyle={{ backgroundColor: 'transparent' }}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetTranslateY }] },
          ]}
        >
          <View style={styles.dragIndicator} />

          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Delivery Location</Text>
              {isGeocoding ? (
                <View style={styles.loadingAddress}>
                  <ActivityIndicator size="small" color={COLORS.text} />
                  <Text style={styles.loadingText}>
                    Identifying location...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.selectedAddressTitle} numberOfLines={1}>
                    {selectedLocation?.title || 'Unknown Location'}
                  </Text>
                  <Text
                    style={styles.selectedAddressSubtitle}
                    numberOfLines={2}
                  >
                    {selectedLocation?.formattedAddress ||
                      selectedLocation?.subtitle ||
                      'Move map to select location'}
                  </Text>
                </>
              )}
            </View>

            {/* Manual Details Inputs */}
            <View style={styles.detailsContainer}>
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.inputContainer,
                    { flex: 0.4, marginRight: SPACING.md },
                  ]}
                >
                  <Text style={styles.inputLabel}>Unit No. (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="#01-01"
                    value={selectedLocation?.unitNumber}
                    onChangeText={text =>
                      updateLocationDetails({ unitNumber: text })
                    }
                    returnKeyType="done"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 0.6 }]}>
                  <Text style={styles.inputLabel}>
                    Building / Landmark (Optional)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Lobby A"
                    value={selectedLocation?.buildingName}
                    onChangeText={text =>
                      updateLocationDetails({ buildingName: text })
                    }
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (isGeocoding || !selectedLocation) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={confirmLocation}
              disabled={isGeocoding || !selectedLocation}
            >
              <Text style={styles.confirmButtonText}>
                Confirm & Deliver Here
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {renderSearchModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerSafeArea: {
    width: '100%',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.medium,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.medium,
  },
  searchPlaceholder: {
    marginLeft: SPACING.sm,
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
    zIndex: 5,
    paddingBottom: 48,
  },
  pinShadow: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: -2,
  },
  currentLocationButton: {
    position: 'absolute',
    right: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 8,
  },
  bottomSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    ...SHADOWS.medium,
    elevation: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  addressContainer: {
    marginBottom: SPACING.lg,
  },
  addressLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedAddressTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 4,
    fontWeight: '700',
  },
  selectedAddressSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  loadingAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  loadingText: {
    marginLeft: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginBottom: SPACING.lg,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  confirmButton: {
    backgroundColor: COLORS.buttonBg || '#000',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.buttonText || '#FFF',
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: { padding: SPACING.xs, marginRight: SPACING.md },
  modalTitle: { ...TYPOGRAPHY.h3, fontWeight: '600' },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.text,
  },
  searchIcon: { marginLeft: SPACING.xs },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  suggestionTextContainer: { flex: 1 },
  suggestionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
    color: COLORS.text,
  },
  suggestionSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

export default ModernLocationPicker;
