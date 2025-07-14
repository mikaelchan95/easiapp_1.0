import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/haptics';
import {
  LocationSuggestion,
  SavedAddress,
  LocationSelectionUIProps,
  DeliveryDetails,
} from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import PostalCodeInput from './PostalCodeInput';
import AddressDetailsForm from './AddressDetailsForm';

// Remove the default export from the end of the file
function LocationSelectionUI({
  onLocationSelect,
  onAddressDetailsSubmit,
  onSaveAddress,
  initialLocation,
  savedAddresses = [],
}: LocationSelectionUIProps) {
  // Component states
  const [currentStep, setCurrentStep] = useState<
    'selection' | 'details' | 'save' | 'search' | 'postal'
  >('selection');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(initialLocation || null);
  const [recentLocations, setRecentLocations] = useState<LocationSuggestion[]>(
    []
  );
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [postalCodeError, setPostalCodeError] = useState<string | undefined>();
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);

  // Load recent locations on mount
  useEffect(() => {
    const loadRecentLocations = async () => {
      const recent = await GoogleMapsService.getRecentLocations();
      setRecentLocations(recent);
    };

    loadRecentLocations();
  }, []);

  // Search for locations when search text changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchText.length > 2) {
        setIsLoadingResults(true);
        try {
          const results =
            await GoogleMapsService.getAutocompleteSuggestions(searchText);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoadingResults(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchText]);

  // Get current location
  const getCurrentLocation = async () => {
    HapticFeedback.medium();
    setIsLoadingCurrent(true);
    try {
      const location = await GoogleMapsService.getCurrentLocation();
      if (location) {
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoadingCurrent(false);
    }
  };
  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    HapticFeedback.light();
    setSelectedLocation(location);

    // Add to recent locations
    GoogleMapsService.addToRecentLocations(location);

    // Move to details step
    setCurrentStep('details');

    // If external handler provided, call it
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  // Search input handler
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  // Navigate to postal code search
  const goToPostalCodeSearch = () => {
    setCurrentStep('postal');
  };

  // Clear search
  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
  };

  // Back to selection screen
  const goBackToSelection = () => {
    setCurrentStep('selection');
  };

  // Handle address details submission
  const handleDetailsSubmit = (details: any) => {
    if (onAddressDetailsSubmit) {
      onAddressDetailsSubmit(details);
    }
  };

  // Handle saving address
  const handleSaveAddress = (address: any) => {
    if (onSaveAddress) {
      onSaveAddress(address);
    }
  };

  // Quick action buttons for location selection methods
  const quickActions = [
    {
      icon: 'search',
      title: 'Search Address',
      subtitle: 'Search by street, building, or landmark',
      onPress: () => setCurrentStep('search'),
      color: '#000000',
    },
    {
      icon: 'pin',
      title: 'Enter Postal Code',
      subtitle: 'Quick search with 6-digit postal code',
      onPress: goToPostalCodeSearch,
      color: '#FF6B6B',
    },
    {
      icon: 'my-location',
      title: 'Current Location',
      subtitle: 'Use your device location',
      onPress: getCurrentLocation,
      color: '#4ECDC4',
      loading: isLoadingCurrent,
    },
  ];

  // Search for location by postal code
  const searchByPostalCode = async (code: string) => {
    setIsLoadingPostal(true);
    setPostalCodeError(undefined);

    try {
      const location = await GoogleMapsService.getAddressByPostalCode(code);
      if (location) {
        handleLocationSelect(location);
      } else {
        setPostalCodeError('No location found for this postal code');
      }
    } catch (error) {
      console.error('Error searching postal code:', error);
      setPostalCodeError('Error searching postal code');
    } finally {
      setIsLoadingPostal(false);
    }
  };

  // Render the appropriate step based on current step state
  const renderContent = () => {
    switch (currentStep) {
      case 'search':
        return (
          <View style={styles.container}>
            <View style={styles.searchHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={goBackToSelection}
              >
                <MaterialIcons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.searchInputContainer}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#555"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for an address"
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                  autoFocus
                />
                {searchText ? (
                  <TouchableOpacity
                    onPress={clearSearch}
                    style={styles.clearButton}
                  >
                    <MaterialIcons name="clear" size={20} color="#555" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {isLoadingResults ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#555"
                      style={styles.resultIcon}
                    />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.resultsList}
                ListEmptyComponent={
                  searchText.length > 2 ? (
                    <View style={styles.emptyResults}>
                      <Text style={styles.emptyResultsText}>
                        No results found
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        );

      case 'postal':
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={goBackToSelection}
              >
                <MaterialIcons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Enter Postal Code</Text>
            </View>

            <View style={styles.contentContainer}>
              <PostalCodeInput
                value={postalCode}
                onChangeText={setPostalCode}
                onSubmit={searchByPostalCode}
                error={postalCodeError}
                loading={isLoadingPostal}
                onQuickSelect={searchByPostalCode}
                onLocationFound={() => {}}
                onClose={() => {}}
              />
            </View>
          </View>
        );

      case 'details':
        return (
          <View style={styles.container}>
            {selectedLocation && (
              <AddressDetailsForm
                location={selectedLocation}
                onSubmit={handleDetailsSubmit}
                onSave={handleSaveAddress}
                onCancel={goBackToSelection}
                isSaveMode={false}
              />
            )}
          </View>
        );

      case 'save':
        return (
          <View style={styles.container}>
            {selectedLocation && (
              <AddressDetailsForm
                location={selectedLocation}
                onSubmit={handleDetailsSubmit}
                onSave={handleSaveAddress}
                onCancel={goBackToSelection}
                isSaveMode={true}
              />
            )}
          </View>
        );

      default:
        // Selection screen (default)
        return (
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Location Method</Text>
              <View style={styles.quickActions}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionCard}
                    onPress={action.onPress}
                    disabled={action.loading}
                  >
                    <View
                      style={[
                        styles.quickActionIcon,
                        { backgroundColor: `${action.color}15` },
                      ]}
                    >
                      <MaterialIcons
                        name={action.icon as any}
                        size={24}
                        color={action.color}
                      />
                    </View>
                    <View style={styles.quickActionContent}>
                      <Text style={styles.quickActionTitle}>
                        {action.title}
                      </Text>
                      <Text style={styles.quickActionSubtitle}>
                        {action.subtitle}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#777"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Saved Locations */}
            {savedAddresses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Saved Locations</Text>
                  <TouchableOpacity onPress={() => setCurrentStep('selection')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedLocationsScroll}
                >
                  {savedAddresses.slice(0, 3).map(address => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.savedLocationCard}
                      onPress={() => handleLocationSelect(address.location)}
                    >
                      <View
                        style={[
                          styles.savedLocationIcon,
                          { backgroundColor: address.color || '#4CAF50' },
                        ]}
                      >
                        <MaterialIcons
                          name={(address.icon || 'place') as any}
                          size={20}
                          color="white"
                        />
                      </View>
                      <Text style={styles.savedLocationLabel}>
                        {address.label}
                      </Text>
                      <Text
                        style={styles.savedLocationAddress}
                        numberOfLines={1}
                      >
                        {address.location.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Locations</Text>
                <View style={styles.recentLocations}>
                  {recentLocations.slice(0, 5).map(location => (
                    <TouchableOpacity
                      key={location.id}
                      style={styles.recentLocationItem}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={styles.recentLocationIcon}>
                        <MaterialIcons name="history" size={18} color="#777" />
                      </View>
                      <View style={styles.recentLocationContent}>
                        <Text style={styles.recentLocationTitle}>
                          {location.title}
                        </Text>
                        {location.subtitle && (
                          <Text style={styles.recentLocationSubtitle}>
                            {location.subtitle}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
  },
  quickActions: {
    marginBottom: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'hsl(0, 0%, 30%)',
  },
  savedLocationsScroll: {
    paddingRight: 20,
  },
  savedLocationCard: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  savedLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'hsl(0, 0%, 50%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  savedLocationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 4,
  },
  savedLocationAddress: {
    fontSize: 12,
    color: 'hsl(0, 0%, 30%)',
  },
  recentLocations: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  recentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
  },
  recentLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'hsl(0, 0%, 95%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentLocationContent: {
    flex: 1,
  },
  recentLocationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 2,
  },
  recentLocationSubtitle: {
    fontSize: 13,
    color: 'hsl(0, 0%, 30%)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(0, 0%, 95%)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'hsl(0, 0%, 0%)',
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: 'hsl(0, 0%, 30%)',
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    color: 'hsl(0, 0%, 50%)',
  },
});

export default LocationSelectionUI;
