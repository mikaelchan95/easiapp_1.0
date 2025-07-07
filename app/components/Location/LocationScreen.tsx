import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Easing,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS } from '../../utils/theme';
import { Coordinate, LocationSuggestion, Region, SavedAddress } from '../../types/location';
import { useLocation } from '../../context/LocationContext';
import { GoogleMapsService } from '../../services/googleMapsService';
import LocationMapView from './LocationMapView';
import LocationSearchInput from './LocationSearchInput';
import SavedLocations from './SavedLocations';
import AddressDetailsForm from './AddressDetailsForm';

const SAVED_LOCATIONS_KEY = 'saved_delivery_locations';

const LocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);
  const { 
    currentLocation, 
    setCurrentLocation, 
    addRecentLocation,
    deliveryZones,
    recentLocations
  } = useLocation();

  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 1.2904, // Singapore
    longitude: 103.8520,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [loading, setLoading] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now().toString());
  const [showRecentLocations, setShowRecentLocations] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedAddress[]>([]);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [showPostalCodeInput, setShowPostalCodeInput] = useState(false);
  
  // Add animations
  const mapOpacity = useRef(new Animated.Value(1)).current;
  const searchExpandAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Load saved locations
  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
      if (saved) {
        setSavedLocations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  };

  const saveSavedLocations = async (locations: SavedAddress[]) => {
    try {
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving locations:', error);
    }
  };

  // ... rest of the component will be updated in the next edit
}