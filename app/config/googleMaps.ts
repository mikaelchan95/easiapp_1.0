export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyCNpWjIoH986AQx2ea2AaiqzsqUcwaqX9I',
  
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
  
  // Geocoding settings
  geocoding: {
    region: 'sg',
    language: 'en',
    components: 'country:sg', // Restrict to Singapore
  },
  
  // Places autocomplete settings
  autocomplete: {
    types: ['establishment', 'geocode'],
    componentRestrictions: { country: 'sg' },
    fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types'],
  },
  
  // Delivery zones for Singapore
  deliveryZones: [
    {
      name: 'Marina Bay',
      center: { latitude: 1.2834, longitude: 103.8607 },
      radius: 5, // kilometers
      isAvailable: true,
      specialPricing: true,
    },
    {
      name: 'Central Business District',
      center: { latitude: 1.2789, longitude: 103.8536 },
      radius: 3,
      isAvailable: true,
      specialPricing: false,
    },
    {
      name: 'Orchard Road',
      center: { latitude: 1.3048, longitude: 103.8318 },
      radius: 3,
      isAvailable: true,
      specialPricing: false,
    },
    {
      name: 'Clarke Quay',
      center: { latitude: 1.2888, longitude: 103.8467 },
      radius: 2,
      isAvailable: true,
      specialPricing: false,
    },
    {
      name: 'Sentosa',
      center: { latitude: 1.2494, longitude: 103.8303 },
      radius: 4,
      isAvailable: true,
      specialPricing: false,
    },
    {
      name: 'Jurong East',
      center: { latitude: 1.3329, longitude: 103.7436 },
      radius: 5,
      isAvailable: true,
      specialPricing: false,
    },
  ],
  
  // Map styling
  mapStyle: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};