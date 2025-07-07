import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import LocationPicker from './app/components/Location/LocationPicker';
import LocationMapView from './app/components/Location/LocationMapView';
import { LocationSuggestion, LocationCoordinate } from './app/types/location';
import { GoogleMapsService } from './app/services/googleMapsService';
import { GOOGLE_MAPS_CONFIG } from './app/config/googleMaps';

const LocationMapTest: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [currentPosition, setCurrentPosition] = useState<LocationCoordinate | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = useCallback((result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  }, []);

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    setSelectedLocation(location);
    addTestResult(`✅ Location selected: ${location.title}`);
  }, [addTestResult]);

  const handleLocationUpdate = useCallback((location: LocationSuggestion) => {
    addTestResult(`📍 Location updated: ${location.title}`);
  }, [addTestResult]);

  const handlePinDrop = useCallback((coordinate: LocationCoordinate) => {
    addTestResult(`📌 Pin dropped at: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`);
  }, [addTestResult]);

  const testLocationPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        addTestResult('✅ Location permissions granted');
        return true;
      } else {
        addTestResult('❌ Location permissions denied');
        return false;
      }
    } catch (error) {
      addTestResult(`❌ Permission error: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addTestResult]);

  const testCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const location = await GoogleMapsService.getCurrentLocation();
      if (location) {
        setCurrentPosition(location.coordinate);
        addTestResult(`✅ Current location: ${location.title}`);
      } else {
        addTestResult('❌ Failed to get current location');
      }
    } catch (error) {
      addTestResult(`❌ Current location error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [addTestResult]);

  const testGoogleMapsService = useCallback(async () => {
    setIsLoading(true);
    try {
      // Test autocomplete
      const suggestions = await GoogleMapsService.getAutocompleteSuggestions('Marina Bay');
      addTestResult(`✅ Autocomplete test: ${suggestions.length} suggestions found`);

      // Test popular locations
      const popular = GoogleMapsService.getPopularLocations();
      addTestResult(`✅ Popular locations: ${popular.length} locations`);

      // Test postal code validation
      const isValid = GoogleMapsService.isValidPostalCode('018956');
      addTestResult(`✅ Postal code validation: ${isValid ? 'Valid' : 'Invalid'}`);

      // Test delivery zone check
      const testCoord = { latitude: 1.2834, longitude: 103.8607 };
      const deliveryCheck = GoogleMapsService.isDeliveryAvailable(testCoord);
      addTestResult(`✅ Delivery check: ${deliveryCheck.available ? 'Available' : 'Not available'}`);

    } catch (error) {
      addTestResult(`❌ Service test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [addTestResult]);

  const testMapConfiguration = useCallback(() => {
    try {
      const hasApiKey = GOOGLE_MAPS_CONFIG.apiKey && GOOGLE_MAPS_CONFIG.apiKey.length > 0;
      addTestResult(`✅ API Key configured: ${hasApiKey ? 'Yes' : 'No'}`);
      
      const hasDeliveryZones = GOOGLE_MAPS_CONFIG.deliveryZones && GOOGLE_MAPS_CONFIG.deliveryZones.length > 0;
      addTestResult(`✅ Delivery zones configured: ${hasDeliveryZones ? GOOGLE_MAPS_CONFIG.deliveryZones.length : 0}`);
      
      const hasMapStyle = GOOGLE_MAPS_CONFIG.mapStyle && GOOGLE_MAPS_CONFIG.mapStyle.length > 0;
      addTestResult(`✅ Map style configured: ${hasMapStyle ? 'Yes' : 'No'}`);
      
    } catch (error) {
      addTestResult(`❌ Configuration test error: ${error}`);
    }
  }, [addTestResult]);

  const runAllTests = useCallback(async () => {
    setTestResults([]);
    addTestResult('🧪 Starting comprehensive location tests...');
    
    testMapConfiguration();
    await testLocationPermissions();
    await testCurrentLocation();
    await testGoogleMapsService();
    
    addTestResult('✅ All tests completed');
  }, [addTestResult, testMapConfiguration, testLocationPermissions, testCurrentLocation, testGoogleMapsService]);

  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Location & Maps Test</Text>
        <Text style={styles.subtitle}>Testing Google Maps integration and location selector</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Controls */}
        <View style={styles.testControls}>
          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.testButtonDisabled]}
            onPress={runAllTests}
            disabled={isLoading}
          >
            <Ionicons name="play" size={20} color="#ffffff" />
            <Text style={styles.testButtonText}>Run All Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Ionicons name="refresh" size={20} color="#666666" />
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        {/* Location Picker Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Picker Test</Text>
          <LocationPicker
            currentLocation={selectedLocation?.title || 'Select a location'}
            onLocationSelect={handleLocationSelect}
            onLocationUpdate={handleLocationUpdate}
            placeholder="Search for a location..."
            mapRegion={GOOGLE_MAPS_CONFIG.marinaBayRegion}
          />
        </View>

        {/* Map View Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map View Test</Text>
          <View style={styles.mapContainer}>
            <LocationMapView
              region={currentPosition ? {
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              } : GOOGLE_MAPS_CONFIG.marinaBayRegion}
              onRegionChange={() => {}}
              onPinDrop={handlePinDrop}
              selectedCoordinate={selectedLocation?.coordinate}
            />
          </View>
        </View>

        {/* Selected Location Display */}
        {selectedLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Location</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>{selectedLocation.title}</Text>
                {selectedLocation.subtitle && (
                  <Text style={styles.locationSubtitle}>{selectedLocation.subtitle}</Text>
                )}
                {selectedLocation.coordinate && (
                  <Text style={styles.coordinates}>
                    {selectedLocation.coordinate.latitude.toFixed(6)}, {selectedLocation.coordinate.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Test Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <View style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={styles.noResults}>No test results yet. Run tests to see results.</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultItem}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  testControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 8,
  },
  clearButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'monospace',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  noResults: {
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default LocationMapTest;