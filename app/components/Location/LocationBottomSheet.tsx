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
  Pressable
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
                  <Text style={styles.headerTitle}>
                    {isMapMode ? 'Pin Location' : 'Choose Location'}
                  </Text>
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

                {/* Search Field */}
                {!isMapMode && (
                  <View style={styles.searchContainer}>
                    <LocationSearchField
                      value={searchText}
                      onChangeText={onSearchTextChange}
                      onClear={() => onSearchTextChange('')}
                      placeholder="Search address or place"
                      autoFocus={true}
                    />
                  </View>
                )}

                {/* Content */}
                <View style={styles.content}>
                  {isMapMode ? (
                    <LocationMapView
                      region={mapRegion}
                      onRegionChange={() => {}}
                      onPinDrop={onPinDrop}
                      selectedCoordinate={selectedLocation?.coordinate}
                    />
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
    paddingBottom: SPACING.sm
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md
  }
});

export default LocationBottomSheet;