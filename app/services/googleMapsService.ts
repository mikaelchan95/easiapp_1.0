import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';
import { LocationCoordinate, Coordinate, LocationSuggestion } from '../types/location';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

export interface AutocompleteResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
}

// Singapore postal code database (sample)
const POSTAL_CODE_DATABASE: Record<string, LocationSuggestion> = {
  '018956': {
    id: 'postal_018956',
    title: 'Marina Bay Sands',
    subtitle: '10 Bayfront Avenue, Singapore 018956',
    coordinate: { latitude: 1.2839, longitude: 103.8607 },
    postalCode: '018956',
    type: 'postal',
    formattedAddress: '10 Bayfront Avenue, Singapore 018956',
  },
  '238859': {
    id: 'postal_238859',
    title: 'Orchard Road',
    subtitle: '2 Orchard Turn, Singapore 238859',
    coordinate: { latitude: 1.3036, longitude: 103.8318 },
    postalCode: '238859',
    type: 'postal',
    formattedAddress: '2 Orchard Turn, Singapore 238859',
  },
  '098632': {
    id: 'postal_098632',
    title: 'Sentosa',
    subtitle: '8 Sentosa Gateway, Singapore 098632',
    coordinate: { latitude: 1.2494, longitude: 103.8303 },
    postalCode: '098632',
    type: 'postal',
    formattedAddress: '8 Sentosa Gateway, Singapore 098632',
  },
  '819663': {
    id: 'postal_819663',
    title: 'Changi Airport',
    subtitle: 'Airport Boulevard, Singapore 819663',
    coordinate: { latitude: 1.3644, longitude: 103.9915 },
    postalCode: '819663',
    type: 'postal',
    formattedAddress: 'Airport Boulevard, Singapore 819663',
  },
};

// Enhanced mock data for more realistic search results
const POPULAR_LOCATIONS = [
  {
    id: "place_id_1",
    placeId: "place_id_1",
    title: "Marina Bay Sands",
    subtitle: "10 Bayfront Avenue, Singapore 018956",
    coordinate: { latitude: 1.2839, longitude: 103.8607 },
    isPremiumLocation: true,
    postalCode: "018956"
  },
  {
    id: "place_id_2",
    placeId: "place_id_2",
    title: "Orchard Road",
    subtitle: "Orchard Road, Singapore 238859",
    coordinate: { latitude: 1.3036, longitude: 103.8318 },
    isPremiumLocation: false,
    postalCode: "238859"
  },
  {
    id: "place_id_3",
    placeId: "place_id_3", 
    title: "Sentosa Island",
    subtitle: "Sentosa Island, Singapore 098632",
    coordinate: { latitude: 1.2494, longitude: 103.8303 },
    isPremiumLocation: true,
    postalCode: "098632"
  },
  {
    id: "place_id_4",
    placeId: "place_id_4",
    title: "Changi Airport",
    subtitle: "Airport Boulevard, Singapore 819663",
    coordinate: { latitude: 1.3644, longitude: 103.9915 },
    isPremiumLocation: false,
    postalCode: "819663"
  }
];

// More comprehensive mock neighborhoods for better address suggestions
const NEIGHBORHOODS = [
  "Orchard", "Bukit Timah", "Holland Village", "Bugis", "Marina Bay", 
  "Chinatown", "Little India", "Tiong Bahru", "Joo Chiat", "Katong",
  "Jurong", "Tampines", "Bishan", "Ang Mo Kio", "Toa Payoh", "Serangoon",
  "Clementi", "Punggol", "Sembawang", "Woodlands", "Yishun"
];

export class GoogleMapsService {
  private static baseUrl = 'https://maps.googleapis.com/maps/api';
  private static apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  private static readonly SAVED_ADDRESSES_KEY = '@easiapp:saved_addresses';
  private static readonly RECENT_LOCATIONS_KEY = '@easiapp:recent_locations';

  /**
   * Get autocomplete suggestions for a search query
   */
  static async getAutocompleteSuggestions(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) return [];
    
    // Check if query is a postal code (6 digits for Singapore)
    const postalCodeMatch = query.match(/^\d{6}$/);
    if (postalCodeMatch) {
      const postalResult = POSTAL_CODE_DATABASE[query];
      if (postalResult) {
        return [postalResult];
      }
    }
    
    // Check for partial postal code match
    const partialPostalMatch = query.match(/^\d{1,6}$/);
    if (partialPostalMatch) {
      const matchingPostalCodes = Object.entries(POSTAL_CODE_DATABASE)
        .filter(([code]) => code.startsWith(query))
        .map(([_, location]) => location);
      
      if (matchingPostalCodes.length > 0) {
        return matchingPostalCodes;
      }
    }
    
    // For demo purposes, simulate network latency (250-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 250));
    
    // First try exact matches in our popular locations
    const exactMatches = POPULAR_LOCATIONS.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      (item.postalCode && item.postalCode.includes(query))
    );
    
    // Then generate some dynamic suggestions based on neighborhoods
    const dynamicSuggestions = NEIGHBORHOODS
      .filter(neighborhood => 
        neighborhood.toLowerCase().includes(query.toLowerCase())
      )
      .map((neighborhood, index) => ({
        id: `dynamic_${Date.now()}_${index}`,
        placeId: `dynamic_place_${Date.now()}_${index}`,
        title: `${neighborhood} ${Math.random() > 0.5 ? 'Road' : 'Street'}`,
        subtitle: `${neighborhood}, Singapore`,
        coordinate: { 
          latitude: 1.3 + (Math.random() * 0.1 - 0.05), 
          longitude: 103.8 + (Math.random() * 0.1 - 0.05) 
        },
        isPremiumLocation: Math.random() > 0.7
      }))
      .slice(0, 5); // Limit to 5 dynamic suggestions
    
    // Combine and return (exact matches first, then dynamic suggestions)
    return [...exactMatches, ...dynamicSuggestions];
  }

  /**
   * Get detailed information about a place using Place ID
   */
  static async getPlaceDetails(placeId: string): Promise<LocationSuggestion | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: GOOGLE_MAPS_CONFIG.autocomplete.fields.join(','),
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
      });

      const response = await fetch(
        `${this.baseUrl}/place/details/json?${params.toString()}`
      );
      
      const data = await response.json();
      
      if (!data.result) return null;

      const place: GooglePlaceDetails = data.result;
      
      return {
        id: place.place_id,
        title: place.name,
        subtitle: place.formatted_address,
        type: 'suggestion',
        coordinate: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        address: place.formatted_address,
        placeId: place.place_id,
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address information
   */
  static async reverseGeocode(coordinate: LocationCoordinate): Promise<LocationSuggestion | null> {
    try {
      const params = new URLSearchParams({
        latlng: `${coordinate.latitude},${coordinate.longitude}`,
        key: this.apiKey,
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
        region: GOOGLE_MAPS_CONFIG.geocoding.region,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`
      );
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) return null;

      const result = data.results[0];
      
      return {
        id: `reverse_${Date.now()}`,
        title: this.extractLocationName(result.formatted_address),
        subtitle: result.formatted_address,
        type: 'suggestion',
        coordinate,
        address: result.formatted_address,
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get current location using device GPS
   */
  static async getCurrentLocation(): Promise<LocationSuggestion | null> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 0
      });

      const coordinate: LocationCoordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Reverse geocode to get address
      const locationData = await this.reverseGeocode(coordinate);
      
      if (locationData) {
        return {
          ...locationData,
          id: 'current_location',
          title: 'Current Location',
          type: 'current',
        };
      } else {
        return {
          id: 'current_location',
          title: 'Current Location',
          subtitle: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
          type: 'current',
          coordinate,
          address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        };
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Check if delivery is available to a specific coordinate
   */
  static isDeliveryAvailable(coordinate: LocationCoordinate): {
    available: boolean;
    zone?: typeof GOOGLE_MAPS_CONFIG.deliveryZones[0];
    distance?: number;
  } {
    for (const zone of GOOGLE_MAPS_CONFIG.deliveryZones) {
      const distance = this.calculateDistance(coordinate, zone.center);
      
      if (distance <= zone.radius && zone.isAvailable) {
        return {
          available: true,
          zone,
          distance,
        };
      }
    }
    
    return { available: false };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(point1: LocationCoordinate, point2: LocationCoordinate): number {
    const toRad = (value: number): number => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Extract a meaningful location name from formatted address
   */
  private static extractLocationName(formattedAddress: string): string {
    const parts = formattedAddress.split(',');
    
    // Try to get the first meaningful part (usually building/street name)
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      
      // If it's just a number, include the second part too
      if (/^\d+/.test(firstPart) && parts.length > 1) {
        return `${firstPart}, ${parts[1].trim()}`;
      }
      
      return firstPart;
    }
    
    return formattedAddress;
  }

  /**
   * Get popular delivery locations in Singapore
   */
  static getPopularLocations(): LocationSuggestion[] {
    return [
      {
        id: 'marina_bay_sands',
        title: 'Marina Bay Sands',
        subtitle: '10 Bayfront Ave, Singapore 018956',
        type: 'suggestion',
        coordinate: { latitude: 1.2834, longitude: 103.8607 },
        address: '10 Bayfront Ave, Singapore 018956',
      },
      {
        id: 'gardens_by_bay',
        title: 'Gardens by the Bay',
        subtitle: '18 Marina Gardens Dr, Singapore 018953',
        type: 'suggestion',
        coordinate: { latitude: 1.2816, longitude: 103.8636 },
        address: '18 Marina Gardens Dr, Singapore 018953',
      },
      {
        id: 'raffles_hotel',
        title: 'Raffles Hotel Singapore',
        subtitle: '1 Beach Rd, Singapore 189673',
        type: 'suggestion',
        coordinate: { latitude: 1.2947, longitude: 103.8547 },
        address: '1 Beach Rd, Singapore 189673',
      },
      {
        id: 'orchard_road',
        title: 'Orchard Road',
        subtitle: 'Orchard, Singapore',
        type: 'suggestion',
        coordinate: { latitude: 1.3048, longitude: 103.8318 },
        address: 'Orchard, Singapore',
      },
      {
        id: 'clarke_quay',
        title: 'Clarke Quay',
        subtitle: '3 River Valley Rd, Singapore 179024',
        type: 'suggestion',
        coordinate: { latitude: 1.2888, longitude: 103.8467 },
        address: '3 River Valley Rd, Singapore 179024',
      },
    ];
  }

  /**
   * Get popular postal codes in Singapore
   */
  static getPopularPostalCodes(): Array<{code: string, label: string}> {
    return [
      { code: '018956', label: 'Marina Bay Sands' },
      { code: '238859', label: 'ION Orchard' },
      { code: '098632', label: 'Sentosa' },
      { code: '819663', label: 'Changi Airport' },
      { code: '189702', label: 'Bugis Junction' },
    ];
  }

  /**
   * Validate Singapore postal code format (6 digits)
   */
  static isValidPostalCode(postalCode: string): boolean {
    return /^\d{6}$/.test(postalCode);
  }

  /**
   * Get address by postal code
   */
  static async getAddressByPostalCode(postalCode: string): Promise<LocationSuggestion | null> {
    // First check our local database
    if (POSTAL_CODE_DATABASE[postalCode]) {
      return POSTAL_CODE_DATABASE[postalCode];
    }

    // Otherwise call the Google Maps Geocoding API
    try {
      const params = new URLSearchParams({
        address: `${postalCode} Singapore`,
        key: this.apiKey,
        components: 'country:SG',
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`
      );
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) return null;

      const result = data.results[0];
      
      // Extract postal code from address components
      const postalCodeComponent = result.address_components.find(
        (component: any) => component.types.includes('postal_code')
      );

      return {
        id: `postal_${postalCode}`,
        title: this.extractLocationName(result.formatted_address),
        subtitle: result.formatted_address,
        type: 'postal',
        coordinate: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        address: result.formatted_address,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        postalCode: postalCodeComponent?.long_name || postalCode,
      };
    } catch (error) {
      console.error('Error fetching address by postal code:', error);
      return null;
    }
  }

  /**
   * Save an address to persistent storage
   */
  static async saveAddress(address: import('../types/location').SavedAddress): Promise<void> {
    try {
      // First get existing saved addresses
      const savedAddresses = await this.getSavedAddresses();
      
      // Check if address with same ID already exists
      const existingIndex = savedAddresses.findIndex(a => a.id === address.id);
      
      if (existingIndex >= 0) {
        // Update existing address
        savedAddresses[existingIndex] = {
          ...address,
          updatedAt: new Date(),
        };
      } else {
        // Add new address
        savedAddresses.push({
          ...address,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Save updated list
      await AsyncStorage.setItem(
        this.SAVED_ADDRESSES_KEY,
        JSON.stringify(savedAddresses)
      );
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  }

  /**
   * Get all saved addresses
   */
  static async getSavedAddresses(): Promise<import('../types/location').SavedAddress[]> {
    try {
      const savedAddressesJson = await AsyncStorage.getItem(this.SAVED_ADDRESSES_KEY);
      
      if (!savedAddressesJson) return [];
      
      const savedAddresses = JSON.parse(savedAddressesJson);
      
      // Convert string dates back to Date objects
      return savedAddresses.map((address: any) => ({
        ...address,
        createdAt: new Date(address.createdAt),
        updatedAt: new Date(address.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting saved addresses:', error);
      return [];
    }
  }

  /**
   * Delete a saved address
   */
  static async deleteAddress(id: string): Promise<void> {
    try {
      const savedAddresses = await this.getSavedAddresses();
      const filteredAddresses = savedAddresses.filter(address => address.id !== id);
      
      await AsyncStorage.setItem(
        this.SAVED_ADDRESSES_KEY,
        JSON.stringify(filteredAddresses)
      );
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  /**
   * Add a location to recent locations
   */
  static async addToRecentLocations(location: LocationSuggestion): Promise<void> {
    try {
      const recentLocations = await this.getRecentLocations();
      
      // Remove if already exists
      const filteredLocations = recentLocations.filter(loc => loc.id !== location.id);
      
      // Add to beginning of array
      filteredLocations.unshift({
        ...location,
        type: 'recent',
      });
      
      // Limit to 5 recent locations
      const limitedLocations = filteredLocations.slice(0, 5);
      
      await AsyncStorage.setItem(
        this.RECENT_LOCATIONS_KEY,
        JSON.stringify(limitedLocations)
      );
    } catch (error) {
      console.error('Error adding to recent locations:', error);
    }
  }

  /**
   * Get recent locations
   */
  static async getRecentLocations(): Promise<LocationSuggestion[]> {
    try {
      const recentLocationsJson = await AsyncStorage.getItem(this.RECENT_LOCATIONS_KEY);
      
      if (!recentLocationsJson) return [];
      
      return JSON.parse(recentLocationsJson);
    } catch (error) {
      console.error('Error getting recent locations:', error);
      return [];
    }
  }

  /**
   * Delete a recent location
   */
  static async deleteRecentLocation(id: string): Promise<void> {
    try {
      const recentLocations = await this.getRecentLocations();
      const filteredLocations = recentLocations.filter(location => location.id !== id);
      
      await AsyncStorage.setItem(
        this.RECENT_LOCATIONS_KEY,
        JSON.stringify(filteredLocations)
      );
    } catch (error) {
      console.error('Error deleting recent location:', error);
    }
  }
}