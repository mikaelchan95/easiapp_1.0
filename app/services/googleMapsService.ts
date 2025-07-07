import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';
import { LocationCoordinate, LocationSuggestion } from '../types/location';

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

export class GoogleMapsService {
  private static baseUrl = 'https://maps.googleapis.com/maps/api';
  private static apiKey = GOOGLE_MAPS_CONFIG.apiKey;

  /**
   * Get autocomplete suggestions for a search query
   */
  static async getAutocompleteSuggestions(input: string): Promise<LocationSuggestion[]> {
    if (!input.trim()) return [];

    try {
      const params = new URLSearchParams({
        input: input.trim(),
        key: this.apiKey,
        types: GOOGLE_MAPS_CONFIG.autocomplete.types.join('|'),
        components: `country:${GOOGLE_MAPS_CONFIG.autocomplete.componentRestrictions.country}`,
        language: GOOGLE_MAPS_CONFIG.geocoding.language,
      });

      const response = await fetch(
        `${this.baseUrl}/place/autocomplete/json?${params.toString()}`
      );
      
      const data: AutocompleteResponse = await response.json();
      
      if (!data.predictions) return [];

      return data.predictions.map((prediction, index) => ({
        id: prediction.place_id,
        title: prediction.structured_formatting.main_text,
        subtitle: prediction.structured_formatting.secondary_text,
        type: 'suggestion' as const,
        address: prediction.description,
        placeId: prediction.place_id,
      }));
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      return [];
    }
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
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinate: LocationCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Reverse geocode to get address
          const locationData = await this.reverseGeocode(coordinate);
          
          if (locationData) {
            resolve({
              ...locationData,
              id: 'current_location',
              title: 'Current Location',
              type: 'current',
            });
          } else {
            resolve({
              id: 'current_location',
              title: 'Current Location',
              subtitle: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
              type: 'current',
              coordinate,
              address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
            });
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
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
}