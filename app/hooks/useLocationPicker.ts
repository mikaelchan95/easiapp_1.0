import { useState, useCallback, useRef, useEffect } from 'react';
import { Region } from 'react-native-maps';
import { LocationSuggestion, LocationCoordinate } from '../types/location';
import { GoogleMapsService } from '../services/googleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const DEFAULT_REGION = GOOGLE_MAPS_CONFIG.defaultRegion;
const DEBOUNCE_DELAY = 300; // ms

interface UseLocationPickerProps {
  initialLocation?: LocationSuggestion | null;
  onLocationSelect?: (location: LocationSuggestion) => void;
}

export const useLocationPicker = ({
  initialLocation,
  onLocationSelect,
}: UseLocationPickerProps) => {
  // Map State
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Location State
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(
    initialLocation || null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for debouncing
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize with current location if no initial location provided
  useEffect(() => {
    const initLocation = async () => {
      if (initialLocation && initialLocation.coordinate) {
        setRegion({
          latitude: initialLocation.coordinate.latitude,
          longitude: initialLocation.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setSelectedLocation(initialLocation);
      } else {
        try {
          const current = await GoogleMapsService.getCurrentLocation();
          if (current && current.coordinate) {
            setRegion({
              latitude: current.coordinate.latitude,
              longitude: current.coordinate.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
            setSelectedLocation(current);
          }
        } catch (error) {
          console.warn('Failed to get current location on init', error);
        }
      }
      setIsMapReady(true);
    };

    initLocation();
  }, [initialLocation]);

  // Handle Map Region Change
  const handleRegionChange = useCallback(() => {
    if (!isMapMoving) setIsMapMoving(true);
    // Cancel any pending geocoding
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
  }, [isMapMoving]);

  const handleRegionChangeComplete = useCallback(
    (newRegion: Region) => {
      setIsMapMoving(false);
      setRegion(newRegion);

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Debounce Reverse Geocoding
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      setIsGeocoding(true);
      geocodeTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await GoogleMapsService.reverseGeocode({
            latitude: newRegion.latitude,
            longitude: newRegion.longitude,
          });

          if (result) {
            // Keep existing manual details if we are just refining position
            setSelectedLocation(prev => {
              if (prev) {
                 return { ...result, unitNumber: prev.unitNumber, buildingName: prev.buildingName };
              }
              return result;
            });
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        } finally {
          setIsGeocoding(false);
        }
      }, 100); // Small delay to ensure map has settled
    },
    []
  );

  // Handle Search
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await GoogleMapsService.getAutocompleteSuggestions(text);
          setSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, DEBOUNCE_DELAY);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, []);

  const selectSuggestion = useCallback(async (suggestion: LocationSuggestion) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsSearching(false);

    let locationToSet = suggestion;

    // If no coordinates, fetch details
    if (!suggestion.coordinate && suggestion.placeId) {
      try {
        const details = await GoogleMapsService.getPlaceDetails(suggestion.placeId);
        if (details) {
          locationToSet = details;
        }
      } catch (error) {
        console.error('Failed to get place details:', error);
      }
    }

    if (locationToSet.coordinate) {
      setRegion({
        latitude: locationToSet.coordinate.latitude,
        longitude: locationToSet.coordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setSelectedLocation(locationToSet);
    }
  }, []);

  const moveToCurrentLocation = useCallback(async () => {
    try {
      const current = await GoogleMapsService.getCurrentLocation();
      if (current && current.coordinate) {
        setRegion({
          latitude: current.coordinate.latitude,
          longitude: current.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setSelectedLocation(current);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }, []);

  const confirmLocation = useCallback(() => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
  }, [selectedLocation, onLocationSelect]);

  const updateLocationDetails = useCallback((details: Partial<LocationSuggestion>) => {
    setSelectedLocation((prev) => (prev ? { ...prev, ...details } : null));
  }, []);

  return {
    region,
    isMapReady,
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
  };
};
