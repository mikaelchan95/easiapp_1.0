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
  '670228': {
    id: 'postal_670228',
    title: 'Jurong Point',
    subtitle: '1 Jurong West Central 2, Singapore 670228',
    coordinate: { latitude: 1.3397, longitude: 103.7066 },
    postalCode: '670228',
    type: 'postal',
    formattedAddress: '1 Jurong West Central 2, Singapore 670228',
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
  },
  {
    id: "place_id_5",
    placeId: "place_id_5",
    title: "CHIJMES",
    subtitle: "30 Victoria Street, Singapore 187996",
    coordinate: { latitude: 1.2950, longitude: 103.8520 },
    isPremiumLocation: true,
    postalCode: "187996"
  },
  {
    id: "place_id_6",
    placeId: "place_id_6",
    title: "Bugis Junction",
    subtitle: "200 Victoria Street, Singapore 188021",
    coordinate: { latitude: 1.2999, longitude: 103.8556 },
    isPremiumLocation: false,
    postalCode: "188021"
  },
  {
    id: "place_id_7",
    placeId: "place_id_7",
    title: "Bugis Street",
    subtitle: "3 New Bugis Street, Singapore 188867",
    coordinate: { latitude: 1.3006, longitude: 103.8548 },
    isPremiumLocation: false,
    postalCode: "188867"
  },
  {
    id: "place_id_8",
    placeId: "place_id_8",
    title: "Bugis+",
    subtitle: "201 Victoria Street, Singapore 188067",
    coordinate: { latitude: 1.3005, longitude: 103.8563 },
    isPremiumLocation: false,
    postalCode: "188067"
  },
  {
    id: "place_id_9",
    placeId: "place_id_9",
    title: "Clarke Quay",
    subtitle: "3 River Valley Road, Singapore 179024",
    coordinate: { latitude: 1.2888, longitude: 103.8467 },
    isPremiumLocation: true,
    postalCode: "179024"
  },
  {
    id: "place_id_10",
    placeId: "place_id_10",
    title: "Raffles Place",
    subtitle: "Raffles Place, Singapore 048616",
    coordinate: { latitude: 1.2844, longitude: 103.8514 },
    isPremiumLocation: false,
    postalCode: "048616"
  },
  {
    id: "place_id_11",
    placeId: "place_id_11",
    title: "Chinatown",
    subtitle: "Chinatown, Singapore 058357",
    coordinate: { latitude: 1.2814, longitude: 103.8447 },
    isPremiumLocation: false,
    postalCode: "058357"
  },
  {
    id: "place_id_12",
    placeId: "place_id_12",
    title: "Little India",
    subtitle: "Little India, Singapore 209557",
    coordinate: { latitude: 1.3067, longitude: 103.8520 },
    isPremiumLocation: false,
    postalCode: "209557"
  }
];

// More comprehensive mock neighborhoods for better address suggestions
const NEIGHBORHOODS = [
  "Orchard", "Bukit Timah", "Holland Village", "Bugis", "Marina Bay", 
  "Chinatown", "Little India", "Tiong Bahru", "Joo Chiat", "Katong",
  "Jurong", "Tampines", "Bishan", "Ang Mo Kio", "Toa Payoh", "Serangoon",
  "Clementi", "Punggol", "Sembawang", "Woodlands", "Yishun", "CHIJMES",
  "Clarke Quay", "Boat Quay", "Robertson Quay", "Dhoby Ghaut", "City Hall",
  "Raffles Place", "Tanjong Pagar", "Outram Park", "Somerset", "Newton",
  "Novena", "Thomson", "Farrer Park", "Lavender", "Kallang", "Geylang",
  "Paya Lebar", "Bedok", "Changi", "Pasir Ris", "Hougang", "Sengkang",
  "Buangkok", "Kovan", "Potong Pasir", "Boon Lay", "Pioneer", "Joo Koon"
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
    
    try {
      // Check if query is a postal code (6 digits for Singapore)
      const postalCodeMatch = query.match(/^\d{6}$/);
      if (postalCodeMatch) {
        const postalResult = POSTAL_CODE_DATABASE[query];
        if (postalResult) {
          return [postalResult];
        } else {
          // Try to get from Google Maps API
          const apiResult = await this.getAddressByPostalCode(query);
          if (apiResult) {
            return [apiResult];
          }
        }
      }
      
      // Check for partial postal code match
      const partialPostalMatch = query.match(/^\d{1,6}$/);
      if (partialPostalMatch) {
        const matchingPostalCodes: LocationSuggestion[] = [];
        for (const code in POSTAL_CODE_DATABASE) {
          if (code.startsWith(query)) {
            matchingPostalCodes.push(POSTAL_CODE_DATABASE[code]);
          }
        }
        
        if (matchingPostalCodes.length > 0) {
          return matchingPostalCodes;
        }
      }

       // If no API key available, fallback to mock data
       if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
         return this.getMockSuggestions(query);
       }

       // Real Google Places Autocomplete API call
       const params = new URLSearchParams({
         input: query,
         key: this.apiKey,
         components: GOOGLE_MAPS_CONFIG.geocoding.components,
         types: GOOGLE_MAPS_CONFIG.autocomplete.types.join('|'),
         language: GOOGLE_MAPS_CONFIG.geocoding.language,
         sessiontoken: this.generateSessionToken(),
       });

      const response = await fetch(
        `${this.baseUrl}/place/autocomplete/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AutocompleteResponse = await response.json();
      
      if (data.predictions && data.predictions.length > 0) {
        // Map predictions and fetch place details for each to get coordinates
        const suggestions = await Promise.all(
          data.predictions.map(async (prediction) => {
            try {
              // Get place details to obtain coordinates
              const placeDetails = await this.getPlaceDetails(prediction.place_id);
              
              if (placeDetails && placeDetails.coordinate) {
                return {
                  id: prediction.place_id,
                  title: prediction.structured_formatting.main_text,
                  subtitle: prediction.structured_formatting.secondary_text || prediction.description,
                  type: 'suggestion' as const,
                  placeId: prediction.place_id,
                  address: prediction.description,
                  coordinate: placeDetails.coordinate,
                  formattedAddress: placeDetails.subtitle,
                };
              } else {
                // Fallback without coordinates if place details fail
                return {
                  id: prediction.place_id,
                  title: prediction.structured_formatting.main_text,
                  subtitle: prediction.structured_formatting.secondary_text || prediction.description,
                  type: 'suggestion' as const,
                  placeId: prediction.place_id,
                  address: prediction.description,
                };
              }
            } catch (error) {
              console.error('Error fetching place details for:', prediction.place_id, error);
              // Return suggestion without coordinates if place details fail
              return {
                id: prediction.place_id,
                title: prediction.structured_formatting.main_text,
                subtitle: prediction.structured_formatting.secondary_text || prediction.description,
                type: 'suggestion' as const,
                placeId: prediction.place_id,
                address: prediction.description,
              };
            }
          })
        );
        
        return suggestions;
      }

      // Fallback to mock data if no results
      return this.getMockSuggestions(query);

    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      // Fallback to mock data on error
      return this.getMockSuggestions(query);
    }
  }

  /**
   * Generate session token for Google Places API
   */
  private static generateSessionToken(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Fallback mock suggestions when API is unavailable
   */
  private static getMockSuggestions(query: string): LocationSuggestion[] {
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
        isPremiumLocation: Math.random() > 0.7,
        type: 'suggestion' as const,
        address: `${neighborhood}, Singapore`,
        formattedAddress: `${neighborhood}, Singapore`,
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
      // If no API key available, return null
      if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
        console.warn('No valid API key for place details');
        return null;
      }

      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: GOOGLE_MAPS_CONFIG.autocomplete.fields.join(','),
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
      });

      const response = await fetch(
        `${this.baseUrl}/place/details/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for API errors
      if (data.status !== 'OK') {
        console.warn(`Place Details API returned status: ${data.status}`, data.error_message);
        return null;
      }
      
      if (!data.result) {
        console.warn('No result found for place ID:', placeId);
        return null;
      }

      const place: GooglePlaceDetails = data.result;
      
      // Validate that we have the required geometry data
      if (!place.geometry || !place.geometry.location) {
        console.warn('Place details missing geometry data for:', placeId);
        return null;
      }
      
      return {
        id: place.place_id,
        title: place.name || 'Unknown Location',
        subtitle: place.formatted_address || 'Address not available',
        type: 'suggestion',
        coordinate: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        address: place.formatted_address || '',
        formattedAddress: place.formatted_address || '',
        placeId: place.place_id,
      };
    } catch (error) {
      console.error('Error fetching place details for place ID:', placeId, error);
      return null;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  static async geocodeAddress(address: string): Promise<LocationSuggestion | null> {
    try {
      if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
        console.warn('No valid API key for geocoding');
        return null;
      }

      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
        region: GOOGLE_MAPS_CONFIG.geocoding.region,
        components: GOOGLE_MAPS_CONFIG.geocoding.components,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.warn(`Geocoding API returned status: ${data.status}`, data.error_message);
        return null;
      }
      
      if (!data.results || data.results.length === 0) {
        console.warn('No geocoding results found for:', address);
        return null;
      }

      const result = data.results[0];
      
      return {
        id: `geocoded_${Date.now()}`,
        title: this.extractLocationName(result.formatted_address),
        subtitle: result.formatted_address,
        type: 'suggestion',
        coordinate: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        address: result.formatted_address,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Error geocoding address:', address, error);
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
      // Check if location services are available
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return this.getFallbackLocation();
      }

      // Get current location with timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocodedLocation = await this.reverseGeocode({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocodedLocation) {
        return {
          ...reverseGeocodedLocation,
          id: 'current_location',
          type: 'current',
        };
      }

      return this.getFallbackLocation();
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.getFallbackLocation();
    }
  }

  /**
   * Get fallback location when GPS is unavailable
   */
  private static getFallbackLocation(): LocationSuggestion {
    return {
      id: 'fallback_location',
      title: 'Singapore',
      subtitle: 'Central Region, Singapore',
      type: 'current',
      coordinate: {
        latitude: 1.3521,
        longitude: 103.8198,
      },
      address: 'Singapore',
    };
  }

  /**
   * Check if delivery is available to a specific coordinate
   */
  static isDeliveryAvailable(coordinate: LocationCoordinate): {
    available: boolean;
    zone?: typeof GOOGLE_MAPS_CONFIG.deliveryZones[0];
    distance?: number;
    estimatedTime?: string;
    deliveryFee?: number;
  } {
    try {
      if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') {
        console.warn('Invalid coordinate passed to isDeliveryAvailable');
        return { available: false };
      }

      for (const zone of GOOGLE_MAPS_CONFIG.deliveryZones) {
        const distance = this.calculateDistance(coordinate, zone.center);
        
        if (distance <= zone.radius && zone.isAvailable) {
          // Calculate estimated delivery time based on distance
          const baseTime = 25; // base delivery time in minutes
          const additionalTime = Math.round(distance * 3); // 3 minutes per km
          const estimatedTime = `${baseTime + additionalTime}-${baseTime + additionalTime + 10} min`;
          
          // Calculate delivery fee based on distance and zone
          const baseFee = zone.specialPricing ? 5.99 : 3.99;
          const distanceFee = distance > 2 ? (distance - 2) * 1.50 : 0;
          const deliveryFee = parseFloat((baseFee + distanceFee).toFixed(2));
          
          return {
            available: true,
            zone,
            distance,
            estimatedTime,
            deliveryFee,
          };
        }
      }
      
      return { available: false };
    } catch (error) {
      console.error('Error checking delivery availability:', error);
      return { available: false };
    }
  }

  /**
   * Validate location before saving
   */
  static async validateLocation(location: LocationSuggestion): Promise<{
    valid: boolean;
    error?: string;
    deliveryInfo?: ReturnType<typeof GoogleMapsService.isDeliveryAvailable>;
    enrichedLocation?: LocationSuggestion;
  }> {
    try {
      let enrichedLocation = { ...location };
      
      // Check if location has coordinates, if not try to get them
      if (!location.coordinate) {
        console.log('Location missing coordinates, attempting to fetch...');
        
        // Try to get coordinates using place ID
        if (location.placeId) {
          const placeDetails = await this.getPlaceDetails(location.placeId);
          if (placeDetails && placeDetails.coordinate) {
            enrichedLocation = {
              ...location,
              coordinate: placeDetails.coordinate,
              formattedAddress: placeDetails.formattedAddress || location.address,
            };
            console.log('Successfully fetched coordinates from place details');
          }
        }
        
        // If still no coordinates, try geocoding the address
        if (!enrichedLocation.coordinate && (location.address || location.subtitle)) {
          const addressToGeocode = location.address || location.subtitle || location.title;
          console.log('Attempting to geocode address:', addressToGeocode);
          
          try {
            const geocoded = await this.geocodeAddress(addressToGeocode);
            if (geocoded && geocoded.coordinate) {
              enrichedLocation = {
                ...location,
                coordinate: geocoded.coordinate,
                formattedAddress: geocoded.formattedAddress || location.address,
              };
              console.log('Successfully geocoded address');
            }
          } catch (geocodeError) {
            console.error('Geocoding failed:', geocodeError);
          }
        }
        
        // If we still don't have coordinates, return invalid
        if (!enrichedLocation.coordinate) {
          return {
            valid: false,
            error: 'Unable to determine location coordinates. Please try a different address.',
          };
        }
      }

      // Check delivery availability using the enriched location
      const deliveryInfo = this.isDeliveryAvailable(enrichedLocation.coordinate!);
      
      if (!deliveryInfo.available) {
        return {
          valid: false,
          error: 'Sorry, we don\'t deliver to this area yet. Please try a different location.',
          deliveryInfo,
          enrichedLocation,
        };
      }

      // Additional validation for Singapore bounds
      const { latitude, longitude } = enrichedLocation.coordinate!;
      const singaporeBounds = {
        north: 1.4784,
        south: 1.1496,
        east: 104.0120,
        west: 103.5983,
      };

      if (
        latitude < singaporeBounds.south ||
        latitude > singaporeBounds.north ||
        longitude < singaporeBounds.west ||
        longitude > singaporeBounds.east
      ) {
        return {
          valid: false,
          error: 'Location must be within Singapore',
        };
      }

      return {
        valid: true,
        deliveryInfo,
        enrichedLocation,
      };
    } catch (error) {
      console.error('Error validating location:', error);
      return {
        valid: false,
        error: 'Unable to validate location. Please try again.',
      };
    }
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
      { code: '670228', label: 'Jurong Point' },
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

    // If no API key or using mock key, return null for unknown postal codes
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      console.warn(`Postal code ${postalCode} not found in local database and no valid API key`);
      return null;
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.warn(`Geocoding API returned status: ${data.status}`);
        return null;
      }
      
      if (!data.results || data.results.length === 0) {
        console.warn(`No results found for postal code: ${postalCode}`);
        return null;
      }

      const result = data.results[0];
      
      // Extract postal code from address components
      const postalCodeComponent = result.address_components.find(
        (component: any) => component.types.includes('postal_code')
      );

      // Extract street number and route for better title
      const streetNumber = result.address_components.find(
        (component: any) => component.types.includes('street_number')
      );
      const route = result.address_components.find(
        (component: any) => component.types.includes('route')
      );
      
      let title = this.extractLocationName(result.formatted_address);
      if (streetNumber && route) {
        title = `${streetNumber.long_name} ${route.long_name}`;
      }

      return {
        id: `postal_${postalCode}`,
        title,
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