export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocationSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  coordinate?: LocationCoordinate;
  type: 'recent' | 'suggestion' | 'current';
  address?: string;
  placeId?: string;
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