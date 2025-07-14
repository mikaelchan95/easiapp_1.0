export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // Singapore region settings
  defaultRegion: {
    latitude: 1.3521,
    longitude: 103.8198,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },

  // Marina Bay area (default location)
  marinaBayRegion: {
    latitude: 1.2834,
    longitude: 103.8607,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },

  // Enhanced geocoding settings for Singapore
  geocoding: {
    region: 'sg',
    language: 'en',
    components: 'country:sg', // Restrict to Singapore
    // Additional parameters for better postal code support
    bounds: '1.1496,103.5983|1.4784,104.0120', // Singapore bounds
  },

  // Enhanced Places autocomplete settings
  autocomplete: {
    types: [], // Empty array = search ALL types: addresses, businesses, places, postal codes, etc.
    componentRestrictions: { country: 'sg' },
    fields: [
      'formatted_address',
      'geometry',
      'name',
      'place_id',
      'types',
      'address_components',
    ],
    // Additional settings for Singapore
    strictbounds: true, // Strictly enforce Singapore bounds
    bounds: {
      northeast: { lat: 1.4784, lng: 104.012 },
      southwest: { lat: 1.1496, lng: 103.5983 },
    },
  },

  // Delivery zones for Singapore - We deliver anywhere in Singapore!
  deliveryZones: [
    {
      name: 'Singapore Island-wide',
      center: { latitude: 1.3521, longitude: 103.8198 }, // Singapore center
      radius: 50, // Covers all of Singapore
      isAvailable: true,
      specialPricing: false,
    },
    // Premium zones with special pricing (optional)
    {
      name: 'Marina Bay',
      center: { latitude: 1.2834, longitude: 103.8607 },
      radius: 3, // kilometers
      isAvailable: true,
      specialPricing: true,
    },
    {
      name: 'Central Business District',
      center: { latitude: 1.2789, longitude: 103.8536 },
      radius: 2,
      isAvailable: true,
      specialPricing: true,
    },
    {
      name: 'Orchard Road',
      center: { latitude: 1.3048, longitude: 103.8318 },
      radius: 2,
      isAvailable: true,
      specialPricing: true,
    },
    {
      name: 'Sentosa',
      center: { latitude: 1.2494, longitude: 103.8303 },
      radius: 4,
      isAvailable: true,
      specialPricing: true,
    },
  ],

  // Map styling - Monochrome theme (black and white/grayscale)
  mapStyle: [
    {
      elementType: 'geometry',
      stylers: [
        {
          color: '#212121',
        },
      ],
    },
    {
      elementType: 'labels.icon',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#757575',
        },
      ],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#212121',
        },
      ],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [
        {
          color: '#757575',
        },
      ],
    },
    {
      featureType: 'administrative.country',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#9e9e9e',
        },
      ],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#bdbdbd',
        },
      ],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [
        {
          color: '#1a1a1a',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        {
          color: '#2a2a2a',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'poi.business',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [
        {
          color: '#333333',
        },
      ],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [
        {
          color: '#424242',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.icon',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#8a8a8a',
        },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [
        {
          color: '#373737',
        },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [
        {
          color: '#3c3c3c',
        },
      ],
    },
    {
      featureType: 'road.highway.controlled_access',
      elementType: 'geometry',
      stylers: [
        {
          color: '#4e4e4e',
        },
      ],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#9e9e9e',
        },
      ],
    },
    {
      featureType: 'transit',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [
        {
          color: '#2f2f2f',
        },
      ],
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [
        {
          color: '#3a3a3a',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [
        {
          color: '#000000',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#4a4a4a',
        },
      ],
    },
  ],
};
