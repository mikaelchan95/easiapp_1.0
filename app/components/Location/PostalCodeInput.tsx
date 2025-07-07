import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { GoogleMapsService } from '../../services/googleMapsService';
import { LocationSuggestion } from '../../types/location';

interface PostalCodeInputProps {
  onLocationFound: (location: LocationSuggestion) => void;
  onClose: () => void;
}

const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  onLocationFound,
  onClose,
}) => {
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePostalCodeChange = (text: string) => {
    // Only allow numbers and limit to 6 digits for Singapore postal codes
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setPostalCode(cleaned);
    setError('');
  };

  const searchPostalCode = async () => {
    if (postalCode.length !== 6) {
      setError('Please enter a valid 6-digit postal code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await GoogleMapsService.getAutocompleteSuggestions(postalCode);
      
      if (results.length > 0) {
        // Found a location for the postal code
        onLocationFound(results[0]);
      } else {
        setError('No location found for this postal code');
      }
    } catch (err) {
      setError('Error searching postal code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter Postal Code</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Enter your Singapore postal code to quickly find your delivery address
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g., 018956"
          placeholderTextColor={COLORS.placeholder}
          value={postalCode}
          onChangeText={handlePostalCodeChange}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            postalCode.length !== 6 && styles.searchButtonDisabled,
          ]}
          onPress={searchPostalCode}
          disabled={postalCode.length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.card} />
          ) : (
            <Ionicons name="search" size={20} color={COLORS.card} />
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.helperText}>
          Singapore postal codes are 6 digits long
        </Text>
      )}

      <View style={styles.examples}>
        <Text style={styles.examplesTitle}>Popular Areas:</Text>
        <View style={styles.exampleTags}>
          {['018956', '238859', '098632', '819663'].map((code) => (
            <TouchableOpacity
              key={code}
              style={styles.exampleTag}
              onPress={() => {
                setPostalCode(code);
                handlePostalCodeChange(code);
              }}
            >
              <Text style={styles.exampleTagText}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    letterSpacing: 2,
  },
  searchButton: {
    marginLeft: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.inactive,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  examples: {
    marginTop: 24,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default PostalCodeInput;