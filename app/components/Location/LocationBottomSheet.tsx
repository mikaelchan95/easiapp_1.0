import React, { useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  TextInput,
  Keyboard
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { LocationBottomSheetProps } from '../../types/location';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';

import LocationSearchField from './LocationSearchField';
import LocationSuggestionsList from './LocationSuggestionsList';
import LocationMapView from './LocationMapView';
import LocationConfirmButton from './LocationConfirmButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.25;

const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  searchText,
  onSearchTextChange,
  suggestions,
  recentLocations,
  currentLocation,
  isLoadingCurrent,
  onRefreshLocation,
  isMapMode,
  onToggleMapMode,
  onConfirm,
  selectedLocation,
  onDeleteRecent,
  onPinDrop,
  mapRegion
}) => {
  // Animation values
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Gesture handlers
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Check if should dismiss based on distance or velocity
      const shouldDismiss = translationY > DISMISS_THRESHOLD || velocityY > 500;
      
      if (shouldDismiss) {
        // Animate out with matching velocity
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: Math.max(200, Math.min(400, 400 - (velocityY / 5))),
          easing: Animations.TIMING.easeOut,
          useNativeDriver: false
        }).start(() => {
          onClose();
        });
        
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false
        }).start();
      } else {
        // Spring back to position
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: false
        }).start();
      }
      
      // Reset drag value
      dragY.setValue(0);
    }
  }, [translateY, backdropOpacity, onClose, dragY]);

  // Show animation
  const showSheet = useCallback(() => {
    translateY.setValue(SHEET_HEIGHT);
    
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8, // Damping ~0.8 as specified
        tension: 100,
        useNativeDriver: false
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: Animations.DURATION.medium,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: false
      })
    ]).start();
  }, [translateY, backdropOpacity]);

  // Hide animation
  const hideSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: Animations.DURATION.medium,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: false
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: Animations.DURATION.medium,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: false
      })
    ]).start();
  }, [translateY, backdropOpacity]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (isVisible) {
      showSheet();
    } else {
      hideSheet();
    }
  }, [isVisible, showSheet, hideSheet]);

  // Backdrop press handler
  const handleBackdropPress = () => {
    onClose();
  };

  // Combined translateY for both gesture and animation
  const combinedTranslateY = Animated.add(translateY, dragY);

  return (
    <Modal
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity
            }
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleBackdropPress}
            accessibilityLabel="Close location picker"
            accessibilityRole="button"
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY: combinedTranslateY }]
              }
            ]}
          >
            <SafeAreaView style={styles.sheet}>
              <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                {/* Handle bar */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                      {isMapMode ? 'Pin Location' : 'Choose Location'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                      {isMapMode ? 'Tap the map to select a point' : 'Select your delivery destination'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onToggleMapMode}
                    style={styles.mapToggle}
                    accessibilityLabel={isMapMode ? 'Switch to list view' : 'Switch to map view'}
                    accessibilityRole="button"
                  >
                    <Ionicons 
                      name={isMapMode ? 'list' : 'map'} 
                      size={24} 
                      color={COLORS.primary} 
                    />
                  </Pressable>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarContainer}>
                  <View style={styles.searchBar}>
                    <View style={styles.searchIconContainer}>
                      <Ionicons 
                        name="search" 
                        size={20} 
                        color={COLORS.inactive} 
                      />
                    </View>
                    
                    <TextInput
                      style={styles.searchInput}
                      placeholder={isMapMode ? "Tap the map to drop a pin" : "Search for a location..."}
                      placeholderTextColor={COLORS.placeholder}
                      value={searchText}
                      onChangeText={onSearchTextChange}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isMapMode}
                    />
                    
                    {/* Toggle View Button */}
                    <TouchableOpacity 
                      style={styles.toggleButton}
                      onPress={onToggleMapMode}
                      accessibilityLabel={isMapMode ? "Switch to list view" : "Switch to map view"}
                      accessibilityHint="Toggle between map and list view"
                    >
                      <View style={[
                        styles.toggleButtonBackground,
                        isMapMode ? styles.toggleButtonActive : null
                      ]}>
                        <Ionicons 
                          name={isMapMode ? "list" : "map"} 
                          size={18} 
                          color={isMapMode ? COLORS.card : COLORS.primary} 
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  {isMapMode ? (
                    <View style={styles.staticMapContainer}>
                      <View style={styles.staticMap}>
                        <View style={styles.mapBackground} />
                        
                        <View style={[styles.deliveryZone, styles.primaryZone]} />
                        <View style={[styles.deliveryZone, styles.secondaryZone]} />
                        
                        {selectedLocation?.coordinate && (
                          <View 
                            style={[
                              styles.staticMarker,
                              {
                                left: '50%',
                                top: '50%',
                              }
                            ]}
                          >
                            <Ionicons name="location" size={32} color="#000000" />
                          </View>
                        )}
                        
                        <View style={styles.mapInstructions}>
                          <View style={styles.instructionCard}>
                            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                            <Text style={styles.instructionText}>
                              Tap to select location
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.locationControl}
                          onPress={() => {
                            if (selectedLocation?.coordinate) {
                              setTimeout(() => {
                                if (onPinDrop && selectedLocation.coordinate) {
                                  onPinDrop(selectedLocation.coordinate);
                                }
                              }, 100);
                            }
                          }}
                        >
                          <Ionicons name="locate" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.mapTapArea}
                        activeOpacity={0.9}
                        onPress={(event) => {
                          const baseLat = 1.3521;
                          const baseLng = 103.8198;
                          
                          const randomLat = baseLat + (Math.random() * 0.05 - 0.025);
                          const randomLng = baseLng + (Math.random() * 0.05 - 0.025);
                          
                          const mockCoordinate = {
                            latitude: randomLat,
                            longitude: randomLng
                          };
                          
                          if (onPinDrop) {
                            onPinDrop(mockCoordinate);
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <LocationSuggestionsList
                      suggestions={suggestions}
                      recentLocations={recentLocations}
                      currentLocation={currentLocation}
                      onLocationSelect={onLocationSelect}
                      onDeleteRecent={onDeleteRecent}
                      isLoadingCurrent={isLoadingCurrent}
                      onRefreshLocation={onRefreshLocation}
                    />
                  )}
                </View>

                {/* Confirm Button */}
                <LocationConfirmButton
                  onConfirm={onConfirm}
                  selectedLocation={selectedLocation}
                  disabled={!selectedLocation}
                />
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary
  },
  sheetContainer: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...SHADOWS.medium
  },
  sheet: {
    flex: 1
  },
  keyboardAvoid: {
    flex: 1
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  mapToggle: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm
  },
  searchIconContainer: {
    marginRight: SPACING.sm
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text
  },
  toggleButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toggleButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md
  },
  staticMapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
    height: 300,
    marginBottom: 16
  },
  staticMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E5E5'
  },
  deliveryZone: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 1000,
    borderWidth: 1,
    opacity: 0.3
  },
  primaryZone: {
    borderColor: '#000000',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: '70%',
    height: '70%'
  },
  secondaryZone: {
    borderColor: '#333333',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '85%',
    height: '85%'
  },
  staticMarker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [
      { translateX: -16 },
      { translateY: -32 }
    ]
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16
  },
  instructionCard: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8
  },
  locationControl: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mapTapArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  }
});

export default LocationBottomSheet;