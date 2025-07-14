import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';
import {
  LocationCoordinate,
  Coordinate,
  LocationSuggestion,
} from '../types/location';
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
  status: string;
  error_message?: string;
}

export class GoogleMapsService {
  private static baseUrl = 'https://maps.googleapis.com/maps/api';
  private static apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  private static readonly SAVED_ADDRESSES_KEY = '@easiapp:saved_addresses';
  private static readonly RECENT_LOCATIONS_KEY = '@easiapp:recent_locations';

  /**
   * Get autocomplete suggestions using Google Places Autocomplete API
   * Based on: https://developers.google.com/maps/documentation/places/web-service/autocomplete
   */
  static async getAutocompleteSuggestions(
    query: string
  ): Promise<LocationSuggestion[]> {
    try {
      console.log('🔍 Starting autocomplete search for:', query);
      console.log(
        '🔑 API Key check:',
        this.apiKey ? 'API key present' : 'API key missing'
      );

      // Check if API key is valid or in development mode
      if (
        !this.apiKey ||
        this.apiKey === 'your_google_maps_api_key_here' ||
        this.apiKey === 'DEVELOPMENT_MODE'
      ) {
        if (this.apiKey === 'DEVELOPMENT_MODE') {
          console.log('🔧 Google Maps in development mode - using mock data');
        } else {
          console.error(
            '❌ Invalid or missing Google Maps API key:',
            this.apiKey
          );
        }
        console.log('🔍 GoogleMapsService fallback autocomplete for:', query);
        console.log('🔄 Returning mock Singapore locations...');
        return this.getMockSuggestions(query);
      }

      // Use the real Google Places Autocomplete API with config
      const sessionToken = this.generateSessionToken();
      const params = new URLSearchParams({
        input: query,
        key: this.apiKey,
        sessiontoken: sessionToken,
        components: 'country:sg',
        language: 'en',
        location: '1.3521,103.8198', // Singapore center
        radius: '50000', // 50km radius to cover all of Singapore
        strictbounds: GOOGLE_MAPS_CONFIG.autocomplete.strictbounds.toString(),
      });

      // Only add types parameter if we have specific types to search for
      // Empty array means search ALL types (addresses, businesses, places, postal codes, etc.)
      if (GOOGLE_MAPS_CONFIG.autocomplete.types.length > 0) {
        params.append('types', GOOGLE_MAPS_CONFIG.autocomplete.types.join('|'));
      }

      const url = `${this.baseUrl}/place/autocomplete/json?${params.toString()}`;
      console.log('📡 Making API request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(fetchError => {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      });

      console.log('📥 API Response status:', response.status);

      if (!response.ok) {
        console.error('❌ HTTP error! status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        console.log('🔍 GoogleMapsService fallback autocomplete for:', query);
        console.log('🔄 Returning mock Singapore locations...');
        return this.getMockSuggestions(query);
      }

      const data: AutocompleteResponse = await response.json();
      console.log('📊 API Response status:', data.status);
      console.log(
        '📊 API Response predictions count:',
        data.predictions?.length || 0
      );

      // Check for API errors
      if (data.status && data.status !== 'OK') {
        console.error('❌ Google API error:', data.status, data.error_message);
        console.log('🔍 GoogleMapsService fallback autocomplete for:', query);
        console.log('🔄 Returning mock Singapore locations...');
        return this.getMockSuggestions(query);
      }

      if (data.predictions && data.predictions.length > 0) {
        console.log('✅ Found', data.predictions.length, 'predictions');

        // Convert predictions to LocationSuggestion format
        const suggestions: LocationSuggestion[] = data.predictions
          .slice(0, 5)
          .map(prediction => {
            console.log('🔄 Processing prediction:', prediction.description);

            // Create suggestion without place details call (to avoid API errors)
            return {
              id: prediction.place_id,
              placeId: prediction.place_id,
              title: prediction.structured_formatting.main_text,
              subtitle:
                prediction.structured_formatting.secondary_text ||
                prediction.description,
              type: 'suggestion' as const,
              address: prediction.description,
              formattedAddress: prediction.description,
              // We'll get coordinates when user selects this location
            };
          });

        console.log('✅ Returning', suggestions.length, 'suggestions');
        return suggestions;
      }

      console.log('⚠️ No predictions found in API response');
      console.log('🔍 GoogleMapsService fallback autocomplete for:', query);
      console.log('🔄 Returning mock Singapore locations...');
      return this.getMockSuggestions(query);
    } catch (error) {
      console.error('❌ Error fetching autocomplete suggestions:', error);
      console.log('🔍 GoogleMapsService fallback autocomplete for:', query);
      console.log('🔄 Returning mock Singapore locations...');
      return this.getMockSuggestions(query);
    }
  }

  /**
   * Get place details using Google Places Details API
   * Based on: https://developers.google.com/maps/documentation/places/web-service/details
   */
  static async getPlaceDetails(
    placeId: string
  ): Promise<LocationSuggestion | null> {
    try {
      console.log('🔍 Getting place details for:', placeId);

      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields:
          'formatted_address,geometry,name,place_id,types,address_components',
        language: 'en',
      });

      const url = `${this.baseUrl}/place/details/json?${params.toString()}`;
      console.log('📡 Making place details request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Place details response status:', response.status);

      if (!response.ok) {
        console.error('❌ Place details HTTP error! status:', response.status);
        const errorText = await response.text();
        console.error('❌ Place details error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        '📊 Place details response data:',
        JSON.stringify(data, null, 2)
      );

      // Check for API errors
      if (data.status && data.status !== 'OK') {
        console.error(
          '❌ Google Place Details API error:',
          data.status,
          data.error_message
        );
        return null;
      }

      if (data.result) {
        const result = data.result;
        const location = result.geometry?.location;

        // Extract postal code from address components
        let postalCode = '';
        if (result.address_components) {
          const postalComponent = result.address_components.find(
            (component: any) => component.types.includes('postal_code')
          );
          if (postalComponent) {
            postalCode = postalComponent.long_name;
          }
        }

        const locationSuggestion = {
          id: result.place_id,
          placeId: result.place_id,
          title:
            result.name || this.extractLocationName(result.formatted_address),
          subtitle: result.formatted_address,
          coordinate: location
            ? {
                latitude: location.lat,
                longitude: location.lng,
              }
            : undefined,
          type: 'suggestion' as const,
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          postalCode: postalCode,
        };

        console.log(
          '✅ Place details processed successfully:',
          locationSuggestion.title
        );
        return locationSuggestion;
      }

      console.log('⚠️ No result found in place details response');
      return null;
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Geocode an address using Google Geocoding API
   * Based on: https://developers.google.com/maps/documentation/geocoding/overview
   */
  static async geocodeAddress(
    address: string
  ): Promise<LocationSuggestion | null> {
    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        region: 'sg',
        language: 'en',
        components: 'country:sg',
        bounds: '1.1496,103.5983|1.4784,104.0120', // Singapore bounds
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry?.location;

        // Extract postal code from address components
        let postalCode = '';
        if (result.address_components) {
          const postalComponent = result.address_components.find(
            (component: any) => component.types.includes('postal_code')
          );
          if (postalComponent) {
            postalCode = postalComponent.long_name;
          }
        }

        return {
          id: `geocode_${Date.now()}`,
          title: this.extractLocationName(result.formatted_address),
          subtitle: result.formatted_address,
          coordinate: location
            ? {
                latitude: location.lat,
                longitude: location.lng,
              }
            : undefined,
          type: 'suggestion' as const,
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          postalCode: postalCode,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates using Google Geocoding API
   * Based on: https://developers.google.com/maps/documentation/geocoding/overview#ReverseGeocoding
   */
  static async reverseGeocode(
    coordinate: LocationCoordinate
  ): Promise<LocationSuggestion | null> {
    try {
      const params = new URLSearchParams({
        latlng: `${coordinate.latitude},${coordinate.longitude}`,
        key: this.apiKey,
        region: 'sg',
        language: 'en',
        result_type: 'street_address|premise|establishment',
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        // Extract postal code from address components
        let postalCode = '';
        if (result.address_components) {
          const postalComponent = result.address_components.find(
            (component: any) => component.types.includes('postal_code')
          );
          if (postalComponent) {
            postalCode = postalComponent.long_name;
          }
        }

        return {
          id: `reverse_geocode_${Date.now()}`,
          title: this.extractLocationName(result.formatted_address),
          subtitle: result.formatted_address,
          coordinate: coordinate,
          type: 'suggestion' as const,
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          postalCode: postalCode,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Generate session token for Google Places API
   */
  private static generateSessionToken(): string {
    return (
      'session_' +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
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
   * We deliver anywhere in Singapore!
   */
  static isDeliveryAvailable(coordinate: LocationCoordinate): {
    available: boolean;
    zone?: (typeof GOOGLE_MAPS_CONFIG.deliveryZones)[0];
    distance?: number;
    estimatedTime?: string;
    deliveryFee?: number;
  } {
    try {
      if (
        !coordinate ||
        typeof coordinate.latitude !== 'number' ||
        typeof coordinate.longitude !== 'number'
      ) {
        console.warn('Invalid coordinate passed to isDeliveryAvailable');
        return { available: false };
      }

      // Check if location is within Singapore bounds
      const singaporeBounds = {
        north: 1.4784,
        south: 1.1496,
        east: 104.012,
        west: 103.5983,
      };

      const { latitude, longitude } = coordinate;
      const isInSingapore =
        latitude >= singaporeBounds.south &&
        latitude <= singaporeBounds.north &&
        longitude >= singaporeBounds.west &&
        longitude <= singaporeBounds.east;

      if (!isInSingapore) {
        return { available: false };
      }

      // Calculate distance from city center (Marina Bay) for delivery time and fee estimation
      const cityCenter = { latitude: 1.2834, longitude: 103.8607 };
      const distanceFromCenter = this.calculateDistance(coordinate, cityCenter);

      // Calculate estimated delivery time based on distance from center
      const baseTime = 30; // base delivery time in minutes
      const additionalTime = Math.round(distanceFromCenter * 2); // 2 minutes per km from center
      const estimatedTime = `${baseTime + additionalTime}-${baseTime + additionalTime + 15} min`;

      // Calculate delivery fee based on distance from center
      let deliveryFee = 3.99; // base delivery fee

      // Add distance-based fee for locations far from center
      if (distanceFromCenter > 15) {
        // Locations more than 15km from center (e.g., Jurong, Changi)
        deliveryFee = 6.99;
      } else if (distanceFromCenter > 8) {
        // Locations 8-15km from center
        deliveryFee = 4.99;
      }

      // Check if location is in a premium zone for special pricing
      const premiumZone = GOOGLE_MAPS_CONFIG.deliveryZones.find(zone => {
        const distanceToZone = this.calculateDistance(coordinate, zone.center);
        return distanceToZone <= zone.radius && zone.specialPricing;
      });

      if (premiumZone) {
        deliveryFee = Math.max(deliveryFee, 5.99); // Premium areas have minimum $5.99 fee
      }

      return {
        available: true,
        zone: premiumZone || {
          name: 'Singapore',
          center: cityCenter,
          radius: 50, // All of Singapore
          isAvailable: true,
          specialPricing: false,
        },
        distance: distanceFromCenter,
        estimatedTime,
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      };
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
              formattedAddress:
                placeDetails.formattedAddress || location.address,
            };
            console.log('Successfully fetched coordinates from place details');
          }
        }

        // If still no coordinates, try geocoding the address
        if (
          !enrichedLocation.coordinate &&
          (location.address || location.subtitle)
        ) {
          const addressToGeocode =
            location.address || location.subtitle || location.title;
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
            error:
              'Unable to determine location coordinates. Please try a different address.',
          };
        }
      }

      // Check delivery availability using the enriched location
      const deliveryInfo = this.isDeliveryAvailable(
        enrichedLocation.coordinate!
      );

      if (!deliveryInfo.available) {
        return {
          valid: false,
          error:
            'Sorry, we only deliver within Singapore. Please select a location in Singapore.',
          deliveryInfo,
          enrichedLocation,
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
  static calculateDistance(
    point1: LocationCoordinate,
    point2: LocationCoordinate
  ): number {
    const toRad = (value: number): number => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.latitude)) *
        Math.cos(toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    // Return empty array - let the API handle popular locations
    return [];
  }

  /**
   * Get popular postal codes in Singapore
   */
  static getPopularPostalCodes(): Array<{ code: string; label: string }> {
    // Return empty array - let the API handle postal codes
    return [];
  }

  /**
   * Validate Singapore postal code format (6 digits)
   */
  static isValidPostalCode(postalCode: string): boolean {
    // Singapore postal codes are exactly 6 digits
    if (!/^\d{6}$/.test(postalCode)) {
      return false;
    }

    // Additional validation: Singapore postal codes start with certain prefixes
    // First digit indicates the postal district (01-80, 96-98)
    const firstTwoDigits = parseInt(postalCode.substring(0, 2), 10);

    return (
      (firstTwoDigits >= 1 && firstTwoDigits <= 80) ||
      (firstTwoDigits >= 96 && firstTwoDigits <= 98)
    );
  }

  /**
   * Get address by postal code
   */
  static async getAddressByPostalCode(
    postalCode: string
  ): Promise<LocationSuggestion | null> {
    // If no API key or using mock key, return null
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      console.warn(`No valid API key for postal code lookup: ${postalCode}`);
      return null;
    }

    // Call the Google Maps Geocoding API with improved formatting
    try {
      // Format the query specifically for Singapore postal codes
      const formattedQuery = `${postalCode}, Singapore`;

      const params = new URLSearchParams({
        address: formattedQuery,
        key: this.apiKey,
        components: 'country:SG|postal_code:' + postalCode, // More specific component filtering
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
        region: GOOGLE_MAPS_CONFIG.geocoding.region,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn(
          `Geocoding API returned status: ${data.status}`,
          data.error_message
        );

        // Try alternative query format if first attempt fails
        if (data.status === 'ZERO_RESULTS') {
          return await this.tryAlternativePostalCodeQuery(postalCode);
        }

        return null;
      }

      if (!data.results || data.results.length === 0) {
        console.warn(`No results found for postal code: ${postalCode}`);
        return await this.tryAlternativePostalCodeQuery(postalCode);
      }

      const result = data.results[0];

      // Validate that this is actually a Singapore result
      const country = result.address_components.find((component: any) =>
        component.types.includes('country')
      );

      if (country?.short_name !== 'SG') {
        console.warn(`Postal code result not in Singapore: ${postalCode}`);
        return null;
      }

      // Extract postal code from address components for verification
      const postalCodeComponent = result.address_components.find(
        (component: any) => component.types.includes('postal_code')
      );

      // Extract street number and route for better title
      const streetNumber = result.address_components.find((component: any) =>
        component.types.includes('street_number')
      );
      const route = result.address_components.find((component: any) =>
        component.types.includes('route')
      );
      const subpremise = result.address_components.find((component: any) =>
        component.types.includes('subpremise')
      );
      const premise = result.address_components.find((component: any) =>
        component.types.includes('premise')
      );

      // Build a meaningful title from address components
      let title = this.extractLocationName(result.formatted_address);
      if (premise?.long_name) {
        title = premise.long_name;
      } else if (streetNumber && route) {
        title = `${streetNumber.long_name} ${route.long_name}`;
        if (subpremise?.long_name) {
          title = `${subpremise.long_name}, ${title}`;
        }
      } else if (route?.long_name) {
        title = route.long_name;
      }

      const locationSuggestion: LocationSuggestion = {
        id: `postal_${postalCode}`,
        title,
        subtitle: result.formatted_address,
        type: 'postal' as const,
        coordinate: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        address: result.formatted_address,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        postalCode: postalCodeComponent?.long_name || postalCode,
      };

      return locationSuggestion;
    } catch (error) {
      console.error('Error fetching address by postal code:', error);
      return await this.tryAlternativePostalCodeQuery(postalCode);
    }
  }

  /**
   * Try alternative postal code query formats
   */
  private static async tryAlternativePostalCodeQuery(
    postalCode: string
  ): Promise<LocationSuggestion | null> {
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      return null;
    }

    try {
      // Try with "Singapore" prefix
      const alternativeQuery = `Singapore ${postalCode}`;

      const params = new URLSearchParams({
        address: alternativeQuery,
        key: this.apiKey,
        components: 'country:SG',
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
        region: GOOGLE_MAPS_CONFIG.geocoding.region,
      });

      const response = await fetch(
        `${this.baseUrl}/geocode/json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];

        // Verify the postal code matches
        const postalCodeComponent = result.address_components.find(
          (component: any) => component.types.includes('postal_code')
        );

        if (postalCodeComponent?.long_name === postalCode) {
          const locationSuggestion: LocationSuggestion = {
            id: `postal_${postalCode}`,
            title: this.extractLocationName(result.formatted_address),
            subtitle: result.formatted_address,
            type: 'postal' as const,
            coordinate: {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
            },
            address: result.formatted_address,
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            postalCode: postalCode,
          };

          return locationSuggestion;
        }
      }

      return null;
    } catch (error) {
      console.error('Error in alternative postal code query:', error);
      return null;
    }
  }

  /**
   * Generate postal code suggestions for partial matches
   */
  private static async generatePostalCodeSuggestions(
    partialCode: string
  ): Promise<LocationSuggestion[]> {
    const suggestions: LocationSuggestion[] = [];

    // Generate some common postal code patterns for Singapore
    const commonPrefixes = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
    ];

    for (const prefix of commonPrefixes) {
      if (
        prefix.startsWith(partialCode) &&
        prefix.length > partialCode.length
      ) {
        // Generate a sample postal code
        const samplePostalCode =
          prefix + '0000'.substring(0, 6 - prefix.length);

        // Try to get location for this postal code
        try {
          const location = await this.getAddressByPostalCode(samplePostalCode);
          if (location) {
            suggestions.push(location);
            if (suggestions.length >= 3) break; // Limit suggestions
          }
        } catch (error) {
          // Skip this one
          continue;
        }
      }
    }

    return suggestions;
  }

  /**
   * Save an address to persistent storage
   */
  static async saveAddress(
    address: import('../types/location').SavedAddress
  ): Promise<void> {
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
  static async getSavedAddresses(): Promise<
    import('../types/location').SavedAddress[]
  > {
    try {
      const savedAddressesJson = await AsyncStorage.getItem(
        this.SAVED_ADDRESSES_KEY
      );

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
   * Delete an address from persistent storage
   */
  static async deleteAddress(id: string): Promise<void> {
    try {
      // Get existing saved addresses
      const savedAddresses = await this.getSavedAddresses();

      // Filter out the address to delete
      const updatedAddresses = savedAddresses.filter(
        address => address.id !== id
      );

      // Save updated list
      await AsyncStorage.setItem(
        this.SAVED_ADDRESSES_KEY,
        JSON.stringify(updatedAddresses)
      );
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  /**
   * Add a location to recent locations
   */
  static async addToRecentLocations(
    location: LocationSuggestion
  ): Promise<void> {
    try {
      const recentLocations = await this.getRecentLocations();

      // Remove if already exists
      const filteredLocations = recentLocations.filter(
        loc => loc.id !== location.id
      );

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
      const recentLocationsJson = await AsyncStorage.getItem(
        this.RECENT_LOCATIONS_KEY
      );

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
      const filteredLocations = recentLocations.filter(
        location => location.id !== id
      );

      await AsyncStorage.setItem(
        this.RECENT_LOCATIONS_KEY,
        JSON.stringify(filteredLocations)
      );
    } catch (error) {
      console.error('Error deleting recent location:', error);
    }
  }

  /**
   * Clear all cached location data
   */
  static async clearAllCachedData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.SAVED_ADDRESSES_KEY,
        this.RECENT_LOCATIONS_KEY,
        '@easiapp:location_preferences',
        '@easiapp:delivery_location',
        '@easiapp:pickup_location',
      ]);
      console.log('All cached location data cleared');
    } catch (error) {
      console.error('Error clearing cached data:', error);
    }
  }

  /**
   * Get mock suggestions for fallback when API is unavailable
   */
  private static getMockSuggestions(query: string): LocationSuggestion[] {
    const mockLocations: LocationSuggestion[] = [
      {
        id: 'mock_marina_bay',
        title: 'Marina Bay Sands',
        subtitle: '10 Bayfront Ave, Singapore 018956',
        coordinate: { latitude: 1.2834, longitude: 103.8607 },
        type: 'suggestion',
        address: '10 Bayfront Ave, Singapore 018956',
        formattedAddress: '10 Bayfront Ave, Singapore 018956',
        postalCode: '018956',
      },
      {
        id: 'mock_orchard_road',
        title: 'Orchard Road',
        subtitle: 'Orchard Road, Singapore',
        coordinate: { latitude: 1.3048, longitude: 103.8318 },
        type: 'suggestion',
        address: 'Orchard Road, Singapore',
        formattedAddress: 'Orchard Road, Singapore',
      },
      {
        id: 'mock_chinatown',
        title: 'Chinatown',
        subtitle: 'Chinatown, Singapore',
        coordinate: { latitude: 1.2792, longitude: 103.8454 },
        type: 'suggestion',
        address: 'Chinatown, Singapore',
        formattedAddress: 'Chinatown, Singapore',
      },
      {
        id: 'mock_clarke_quay',
        title: 'Clarke Quay',
        subtitle: '3 River Valley Rd, Singapore 179024',
        coordinate: { latitude: 1.2884, longitude: 103.8469 },
        type: 'suggestion',
        address: '3 River Valley Rd, Singapore 179024',
        formattedAddress: '3 River Valley Rd, Singapore 179024',
        postalCode: '179024',
      },
      {
        id: 'mock_sentosa',
        title: 'Sentosa Island',
        subtitle: 'Sentosa Island, Singapore',
        coordinate: { latitude: 1.2494, longitude: 103.8303 },
        type: 'suggestion',
        address: 'Sentosa Island, Singapore',
        formattedAddress: 'Sentosa Island, Singapore',
      },
    ];

    if (!query || query.length === 0) {
      return mockLocations.slice(0, 3);
    }

    // Filter based on query
    const filtered = mockLocations.filter(
      location =>
        location.title.toLowerCase().includes(query.toLowerCase()) ||
        location.subtitle.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.length > 0 ? filtered : mockLocations.slice(0, 3);
  }
}
