export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

// Keep the Coordinate interface for backward compatibility
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface LocationSuggestion {
  id: string;
  placeId?: string;
  title: string;
  subtitle?: string;
  coordinate?: Coordinate;
  isPremiumLocation?: boolean;
  type?: 'suggestion' | 'recent' | 'current' | 'postal' | 'saved';
  address?: string;
  postalCode?: string;
  unitNumber?: string;
  buildingName?: string;
  formattedAddress?: string;
}

export interface DeliveryDetails {
  location: LocationSuggestion;
  unitNumber?: string;
  buildingName?: string;
  deliveryInstructions?: string;
  preferredTime?: {
    from: string;
    to: string;
  };
  contactNumber?: string;
  isDefault?: boolean;
}

export interface SavedAddress extends DeliveryDetails {
  id: string;
  label: string; // "Home", "Office", etc.
  createdAt: Date;
  updatedAt: Date;
  icon?: string; // Material icon name
  color?: string; // Optional color for the icon background
}

export interface LocationPickerState {
  isOpen: boolean;
  isMapMode: boolean;
  selectedLocation: LocationSuggestion | null;
  searchText: string;
  suggestions: LocationSuggestion[];
  recentLocations: LocationSuggestion[];
  isLoadingCurrent: boolean;
  currentLocation: LocationSuggestion | null;
}

export interface LocationPickerProps {
  currentLocation?: string;
  onLocationSelect: (location: LocationSuggestion) => void;
  onLocationUpdate?: (location: LocationSuggestion) => void;
  style?: any;
  placeholder?: string;
  mapRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export interface LocationHeaderProps {
  currentLocation: string;
  onPress: () => void;
  isLoading?: boolean;
  inHeaderNav?: boolean;
}

export interface LocationBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationSuggestion) => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  suggestions: LocationSuggestion[];
  recentLocations: LocationSuggestion[];
  currentLocation: LocationSuggestion | null;
  isLoadingCurrent: boolean;
  onRefreshLocation: () => void;
  isMapMode: boolean;
  onToggleMapMode: () => void;
  onConfirm: () => void;
  selectedLocation: LocationSuggestion | null;
  onDeleteRecent: (id: string) => void;
  onPinDrop: (coordinate: LocationCoordinate) => void;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export interface LocationSearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface LocationSuggestionsListProps {
  suggestions: LocationSuggestion[];
  recentLocations: LocationSuggestion[];
  currentLocation: LocationSuggestion | null;
  onLocationSelect: (location: LocationSuggestion) => void;
  onDeleteRecent: (id: string) => void;
  isLoadingCurrent: boolean;
  onRefreshLocation: () => void;
}

export interface LocationMapViewProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChange: (region: any) => void;
  onPinDrop: (coordinate: LocationCoordinate) => void;
  selectedCoordinate?: LocationCoordinate;
}

export interface LocationConfirmButtonProps {
  onConfirm: () => void;
  selectedLocation: LocationSuggestion | null;
  disabled?: boolean;
}

export interface PostalCodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (postalCode: string) => void;
  error?: string;
  loading?: boolean;
  onQuickSelect?: (postalCode: string) => void;
  popularPostalCodes?: Array<{code: string, label: string}>;
}

export interface SavedLocationsProps {
  savedAddresses: SavedAddress[];
  onSelect: (address: SavedAddress) => void;
  onEdit: (address: SavedAddress) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export interface AddressDetailsFormProps {
  location: LocationSuggestion;
  initialValues?: Partial<DeliveryDetails>;
  onSubmit: (details: DeliveryDetails) => void;
  onSave?: (details: DeliveryDetails & {label: string}) => void;
  onCancel: () => void;
  isSaveMode?: boolean;
}

export interface LocationSelectionUIProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  onAddressDetailsSubmit: (details: DeliveryDetails) => void;
  onSaveAddress?: (address: SavedAddress) => void;
  initialLocation?: LocationSuggestion;
  savedAddresses?: SavedAddress[];
}