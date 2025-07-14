import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { GoogleMapsService } from '../../services/googleMapsService';
import { LocationSuggestion } from '../../types/location';
import { HapticFeedback } from '../../utils/haptics';

interface PostalCodeInputProps {
  onLocationFound: (location: LocationSuggestion) => void;
  onClose: () => void;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  error: string | undefined;
  loading?: boolean;
  onQuickSelect?: (postalCode: string) => void;
  popularPostalCodes?: { code: string; label: string }[];
}

const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  onLocationFound,
  onClose,
  value,
  onChangeText,
  onSubmit,
  error,
  loading = false,
  onQuickSelect,
  popularPostalCodes = GoogleMapsService.getPopularPostalCodes(),
}) => {
  const [focused, setFocused] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(error);

  // Clear local error when error prop changes
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Handle validation on blur
  const handleBlur = () => {
    setFocused(false);

    if (value && !GoogleMapsService.isValidPostalCode(value)) {
      setLocalError('Please enter a valid 6-digit postal code');
    } else {
      setLocalError(undefined);
    }
  };

  // Handle submission
  const handleSubmit = () => {
    if (!value) {
      setLocalError('Postal code is required');
      return;
    }

    if (!GoogleMapsService.isValidPostalCode(value)) {
      setLocalError('Please enter a valid 6-digit postal code');
      return;
    }

    setLocalError(undefined);
    Keyboard.dismiss();
    onSubmit(value);
  };

  // Handle quick selection
  const handleQuickSelect = (postalCode: string) => {
    HapticFeedback.light();
    onChangeText(postalCode);
    if (onQuickSelect) {
      onQuickSelect(postalCode);
    } else {
      onSubmit(postalCode);
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

      <View
        style={[
          styles.inputContainer,
          focused ? styles.inputContainerFocused : {},
          localError ? styles.inputContainerError : {},
        ]}
      >
        <MaterialIcons
          name="location-on"
          size={24}
          color="#000"
          style={styles.icon}
        />

        <TextInput
          value={value}
          onChangeText={text => {
            // Only allow digits
            const sanitized = text.replace(/[^0-9]/g, '');
            // Limit to 6 digits
            const formatted = sanitized.slice(0, 6);
            onChangeText(formatted);

            // Clear error when typing
            if (localError) {
              setLocalError(undefined);
            }
          }}
          style={styles.input}
          placeholder="Enter 6-digit postal code"
          keyboardType="number-pad"
          maxLength={6}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#000"
            style={styles.actionIcon}
          />
        ) : value ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.actionIcon}
          >
            <MaterialIcons name="cancel" size={20} color="#777" />
          </TouchableOpacity>
        ) : null}
      </View>

      {localError ? (
        <Text style={styles.errorText}>{localError}</Text>
      ) : (
        <Text style={styles.helperText}>6-digit Singapore postal code</Text>
      )}

      <View style={styles.quickAccessContainer}>
        <Text style={styles.quickAccessLabel}>Popular areas:</Text>

        <FlatList
          horizontal
          data={popularPostalCodes}
          keyExtractor={item => item.code}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => handleQuickSelect(item.code)}
            >
              <Text style={styles.quickAccessText}>{item.label}</Text>
              <Text style={styles.quickAccessSubtext}>{item.code}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.quickAccessList}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          !value || loading ? styles.submitButtonDisabled : {},
        ]}
        onPress={handleSubmit}
        disabled={!value || loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Searching...' : 'Search'}
        </Text>
        {!loading && (
          <MaterialIcons
            name="search"
            size={20}
            color="#fff"
            style={styles.submitIcon}
          />
        )}
      </TouchableOpacity>
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
  inputContainerFocused: {
    borderColor: '#000',
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: '#d32f2f',
  },
  icon: {
    marginRight: 8,
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
  actionIcon: {
    padding: 4,
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
  quickAccessContainer: {
    marginTop: 24,
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickAccessList: {
    paddingVertical: 4,
  },
  quickAccessItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  quickAccessSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.inactive,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
  },
  submitIcon: {
    marginLeft: 8,
  },
});

export default PostalCodeInput;
