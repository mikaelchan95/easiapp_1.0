import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AddressDetailsFormProps, DeliveryDetails } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

const ICON_OPTIONS = [
  { name: 'home', label: 'Home' },
  { name: 'business', label: 'Work' },
  { name: 'school', label: 'School' },
  { name: 'fitness', label: 'Gym' },
  { name: 'medical', label: 'Hospital' },
  { name: 'storefront', label: 'Shop' },
  { name: 'restaurant', label: 'Food' },
  { name: 'location', label: 'Other' },
];

/**
 * Enhanced address details form with improved UX/UI and collapsible steps
 */
export default function AddressDetailsForm({
  location,
  initialValues = {},
  onSubmit,
  onSave,
  onCancel,
  isSaveMode = false
}: AddressDetailsFormProps) {
  // Form state with better organization
  const [formData, setFormData] = useState({
    // Core delivery info (always required)
    unitNumber: initialValues.unitNumber || '',
    buildingName: initialValues.buildingName || '',
    
    // Optional details
    deliveryInstructions: initialValues.deliveryInstructions || '',
    contactNumber: initialValues.contactNumber || '',
    preferredTimeFrom: initialValues.preferredTime?.from || '',
    preferredTimeTo: initialValues.preferredTime?.to || '',
    
    // Save options (only for save mode)
    saveLabel: '',
    selectedIcon: 'home',
    isDefault: initialValues.isDefault || false,
  });
  
  // UI state for better feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    save: true, // First step always expanded initially
    core: false,
    preferences: false,
  });
  
  // Animation values for micro-interactions
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Track form completion for progress feedback
  useEffect(() => {
    if (isSaveMode) {
      const sections = {
        save: formData.saveLabel.trim().length > 0, // Step 1: Name
        core: formData.unitNumber.trim().length > 0, // Step 2: Details
        preferences: true, // Step 3: Always accessible (optional)
      };
      setCompletedSections(sections);
    } else {
      const sections = {
        core: formData.unitNumber.trim().length > 0, // Step 1: Details
        preferences: true, // Step 2: Always accessible (optional)
      };
      setCompletedSections(sections);
    }
  }, [formData, isSaveMode]);

  // Auto-expand next step when current is completed
  useEffect(() => {
    if (isSaveMode && completedSections.save && !expandedSteps.core) {
      setExpandedSteps(prev => ({ ...prev, core: true }));
    }
    if (completedSections.core && !expandedSteps.preferences) {
      setExpandedSteps(prev => ({ ...prev, preferences: true }));
    }
  }, [completedSections, expandedSteps, isSaveMode]);
  
  // Update form data with validation feedback
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Provide haptic feedback for important fields
    if (field === 'selectedIcon' && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Toggle step expansion with smart auto-expansion
  const toggleStep = (stepKey: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setExpandedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  // Enhanced validation with specific, actionable messages
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Core requirement: Unit number for delivery
    if (!formData.unitNumber.trim()) {
      newErrors.unitNumber = 'We need your unit number to complete delivery';
    }
    
    // Save mode requirement: Memorable name
    if (isSaveMode && !formData.saveLabel.trim()) {
      newErrors.saveLabel = 'Give this location a name you\'ll remember';
    }
    
    // Contact validation with helpful guidance
    if (formData.contactNumber.trim()) {
      const cleanNumber = formData.contactNumber.replace(/\D/g, '');
      if (cleanNumber.length < 8) {
        newErrors.contactNumber = 'Please enter a complete Singapore phone number';
      }
    }
    
    // Time range validation
    const hasFromTime = formData.preferredTimeFrom.trim();
    const hasToTime = formData.preferredTimeTo.trim();
    if ((hasFromTime && !hasToTime) || (!hasFromTime && hasToTime)) {
      newErrors.preferredTime = 'Please set both start and end times for your preferred window';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Enhanced form submission with better feedback
  const handleSubmit = async () => {
    if (!validateForm()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Success haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      const details: DeliveryDetails = {
        location,
        unitNumber: formData.unitNumber.trim(),
        buildingName: formData.buildingName.trim() || undefined,
        deliveryInstructions: formData.deliveryInstructions.trim() || undefined,
        contactNumber: formData.contactNumber.trim() || undefined,
        isDefault: formData.isDefault,
        preferredTime: formData.preferredTimeFrom.trim() && formData.preferredTimeTo.trim() 
          ? { from: formData.preferredTimeFrom.trim(), to: formData.preferredTimeTo.trim() }
          : undefined
      };
      
      if (isSaveMode && onSave) {
        onSave({
          ...details,
          label: formData.saveLabel.trim(),
          icon: formData.selectedIcon,
          color: COLORS.text, // Use consistent black color for all icons
        });
      } else {
        onSubmit(details);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert(
        'Unable to Save', 
        'Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel with confirmation if form has content
  const handleCancel = () => {
    const hasContent = Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim().length > 0 : value === true
    );
    
    if (hasContent) {
      Alert.alert(
        'Discard Changes?',
        'Your address details will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onCancel();
            }
          }
        ]
      );
    } else {
      onCancel();
    }
  };

  // Enhanced progress indicator with sleek design
  const renderProgressIndicator = () => {
    const totalSections = isSaveMode ? 3 : 2;
    const completedCount = Object.values(completedSections).filter(Boolean).length;
    const progress = completedCount / totalSections;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.max(progress * 100, 8)}%`, // Minimum 8% width
                backgroundColor: progress === 1 ? COLORS.success : COLORS.primary 
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress === 1 ? '✨ Ready to save!' : `${completedCount} of ${totalSections} completed`}
        </Text>
      </View>
    );
  };

  // Enhanced location display with better visual hierarchy
  const renderLocationHeader = () => (
    <View style={styles.locationHeader}>
      <View style={styles.locationIconContainer}>
        <Ionicons name="location" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.locationContent}>
        <Text style={styles.locationTitle}>{location.title}</Text>
        <Text style={styles.locationAddress}>
          {location.formattedAddress || location.subtitle || location.address}
        </Text>
      </View>
      <View style={styles.locationBadge}>
        <Text style={styles.locationBadgeText}>Selected</Text>
      </View>
    </View>
  );

  // Step 1: Save details (only in save mode)
  const renderSaveStep = () => {
    if (!isSaveMode) return null;

    return (
      <View style={[styles.stepContainer, completedSections.save && styles.stepContainerCompleted]}>
        <TouchableOpacity 
          style={styles.stepHeader}
          onPress={() => toggleStep('save')}
          activeOpacity={0.7}
        >
          <View style={[
            styles.stepNumber,
            completedSections.save && styles.stepNumberCompleted
          ]}>
            {completedSections.save ? (
              <Ionicons name="checkmark" size={16} color={COLORS.card} />
            ) : (
              <Text style={styles.stepNumberText}>1</Text>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Name This Location</Text>
            <Text style={styles.stepSubtitle}>Choose a name you'll recognize</Text>
          </View>
          <View style={styles.stepActions}>
            <View style={styles.stepStatus}>
              <Text style={[
                styles.stepStatusText,
                completedSections.save && styles.stepStatusCompleted
              ]}>
                {completedSections.save ? 'Complete' : 'Required'}
              </Text>
            </View>
            <Ionicons 
              name={expandedSteps.save ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
        {expandedSteps.save && (
          <Animated.View style={[styles.stepBody, { opacity: fadeAnim }]}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.primaryInput, 
                  errors.saveLabel && styles.inputError,
                  focusedField === 'saveLabel' && styles.inputFocused
                ]}
                placeholder="e.g., Home, Office, Mom's Place"
                placeholderTextColor={COLORS.placeholder}
                value={formData.saveLabel}
                onChangeText={(text) => updateFormData('saveLabel', text)}
                onFocus={() => setFocusedField('saveLabel')}
                onBlur={() => setFocusedField(null)}
                maxLength={30}
                autoCapitalize="words"
              />
              {errors.saveLabel && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.saveLabel}</Text>
                </View>
              )}
            </View>
            
            {/* Enhanced Icon selector */}
            <View style={styles.iconSection}>
              <Text style={styles.iconSectionTitle}>Choose an icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.name}
                    style={[
                      styles.iconOption,
                      formData.selectedIcon === option.name && styles.selectedIconOption
                    ]}
                    onPress={() => updateFormData('selectedIcon', option.name)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${option.label} icon`}
                  >
                    <Ionicons 
                      name={option.name as any} 
                      size={16} 
                      color={formData.selectedIcon === option.name ? COLORS.card : COLORS.text} 
                    />
                    <Text style={[
                      styles.iconLabel,
                      formData.selectedIcon === option.name && styles.selectedIconLabel
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  // Step 2: Core delivery info
  const renderCoreStep = () => {
    const stepNumber = isSaveMode ? 2 : 1;
    
    return (
      <View style={[styles.stepContainer, completedSections.core && styles.stepContainerCompleted]}>
        <TouchableOpacity 
          style={styles.stepHeader}
          onPress={() => toggleStep('core')}
          activeOpacity={0.7}
        >
          <View style={[
            styles.stepNumber,
            completedSections.core && styles.stepNumberCompleted
          ]}>
            {completedSections.core ? (
              <Ionicons name="checkmark" size={16} color={COLORS.card} />
            ) : (
              <Text style={styles.stepNumberText}>{stepNumber}</Text>
            )}
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Delivery Details</Text>
            <Text style={styles.stepSubtitle}>Help our drivers find you</Text>
          </View>
          <View style={styles.stepActions}>
            <View style={styles.stepStatus}>
              <Text style={[
                styles.stepStatusText,
                completedSections.core && styles.stepStatusCompleted
              ]}>
                {completedSections.core ? 'Complete' : 'Required'}
              </Text>
            </View>
            <Ionicons 
              name={expandedSteps.core ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
        {expandedSteps.core && (
          <Animated.View style={[styles.stepBody, { opacity: fadeAnim }]}>
            {/* Unit number - required */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Unit Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput, 
                  errors.unitNumber && styles.inputError,
                  focusedField === 'unitNumber' && styles.inputFocused
                ]}
                placeholder="#12-34, Unit 5A, Floor 3"
                placeholderTextColor={COLORS.placeholder}
                value={formData.unitNumber}
                onChangeText={(text) => updateFormData('unitNumber', text)}
                onFocus={() => setFocusedField('unitNumber')}
                onBlur={() => setFocusedField(null)}
                maxLength={20}
                autoCapitalize="characters"
              />
              {errors.unitNumber && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.unitNumber}</Text>
                </View>
              )}
            </View>

            {/* Building name - optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Building Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === 'buildingName' && styles.inputFocused
                ]}
                placeholder="Marina Bay Residences, Block A"
                placeholderTextColor={COLORS.placeholder}
                value={formData.buildingName}
                onChangeText={(text) => updateFormData('buildingName', text)}
                onFocus={() => setFocusedField('buildingName')}
                onBlur={() => setFocusedField(null)}
                maxLength={50}
                autoCapitalize="words"
              />
              <Text style={styles.helperText}>Optional</Text>
            </View>

            {/* Delivery instructions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Instructions</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  styles.textArea,
                  focusedField === 'deliveryInstructions' && styles.inputFocused
                ]}
                placeholder="Leave at door, ring doorbell, call upon arrival..."
                placeholderTextColor={COLORS.placeholder}
                value={formData.deliveryInstructions}
                onChangeText={(text) => updateFormData('deliveryInstructions', text)}
                onFocus={() => setFocusedField('deliveryInstructions')}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={3}
                maxLength={150}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>Optional • Helps ensure successful delivery</Text>
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  // Step 3: Optional preferences
  const renderPreferencesStep = () => {
    const stepNumber = isSaveMode ? 3 : 2;
    
    return (
      <View style={styles.stepContainer}>
        <TouchableOpacity 
          style={styles.stepHeader}
          onPress={() => toggleStep('preferences')}
          activeOpacity={0.7}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{stepNumber}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Preferences</Text>
            <Text style={styles.stepSubtitle}>Optional delivery preferences</Text>
          </View>
          <View style={styles.stepActions}>
            <View style={styles.stepStatus}>
              <Text style={styles.stepStatusText}>Optional</Text>
            </View>
            <Ionicons 
              name={expandedSteps.preferences ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </View>
        </TouchableOpacity>
        
        {expandedSteps.preferences && (
          <Animated.View style={[styles.stepBody, { opacity: fadeAnim }]}>
            {/* Contact number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.contactNumber && styles.inputError,
                  focusedField === 'contactNumber' && styles.inputFocused
                ]}
                placeholder="+65 9123 4567"
                placeholderTextColor={COLORS.placeholder}
                value={formData.contactNumber}
                onChangeText={(text) => updateFormData('contactNumber', text)}
                onFocus={() => setFocusedField('contactNumber')}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {errors.contactNumber && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.contactNumber}</Text>
                </View>
              )}
              <Text style={styles.helperText}>Alternative contact for delivery updates</Text>
            </View>
            
            {/* Preferred time window */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Delivery Window</Text>
              <View style={styles.timeRangeContainer}>
                <TextInput
                  style={[
                    styles.timeInput,
                    errors.preferredTime && styles.inputError,
                    focusedField === 'preferredTimeFrom' && styles.inputFocused
                  ]}
                  placeholder="9am"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.preferredTimeFrom}
                  onChangeText={(text) => updateFormData('preferredTimeFrom', text)}
                  onFocus={() => setFocusedField('preferredTimeFrom')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={8}
                />
                <Text style={styles.timeRangeSeparator}>to</Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    errors.preferredTime && styles.inputError,
                    focusedField === 'preferredTimeTo' && styles.inputFocused
                  ]}
                  placeholder="6pm"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.preferredTimeTo}
                  onChangeText={(text) => updateFormData('preferredTimeTo', text)}
                  onFocus={() => setFocusedField('preferredTimeTo')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={8}
                />
              </View>
              {errors.preferredTime && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.preferredTime}</Text>
                </View>
              )}
              <Text style={styles.helperText}>When you're usually available</Text>
            </View>

            {/* Default setting for save mode */}
            {isSaveMode && (
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchTitle}>Set as Default</Text>
                    <Text style={styles.switchDescription}>
                      Use this address automatically for new orders
                    </Text>
                  </View>
                  <Switch
                    value={formData.isDefault}
                    onValueChange={(value) => updateFormData('isDefault', value)}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={COLORS.card}
                    accessibilityLabel="Set as default address"
                  />
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Enhanced header with progress */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {isSaveMode ? 'Save Location' : 'Delivery Details'}
              </Text>
              {isSaveMode && renderProgressIndicator()}
            </View>
            <View style={styles.headerSpacer} />
          </View>

        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Location confirmation */}
            {renderLocationHeader()}

            {/* Enhanced Form steps */}
            {renderSaveStep()}
            {renderCoreStep()}
            {renderPreferencesStep()}

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Enhanced footer with clear action */}
          <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmitting && styles.primaryButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isSaveMode ? 'Save location to my addresses' : 'Confirm delivery details'}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.primaryButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSaveMode ? 'Save to My Locations' : 'Confirm Details'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header with progress
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerButton: {
    padding: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Enhanced progress indicator
  progressContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  
  // Animated container
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.md, // Ensure content doesn't get cut off
  },
  
  // Location header
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    ...SHADOWS.light,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationContent: {
    flex: 1,
  },
  locationTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  locationBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 11,
  },

  // Enhanced step containers with better design
  stepContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs, // Add bottom margin for better spacing
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  stepContainerCompleted: {
    borderColor: COLORS.success + '40',
    backgroundColor: COLORS.success + '05',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  stepNumberCompleted: {
    backgroundColor: COLORS.success,
  },
  stepNumberText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepStatus: {
    alignItems: 'flex-end',
  },
  stepStatusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.border + '40',
    borderRadius: 8,
  },
  stepStatusCompleted: {
    color: COLORS.success,
    backgroundColor: COLORS.success + '20',
  },
  stepBody: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
  },

  // Input groups with better spacing
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.h6,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  requiredStar: {
    color: COLORS.error,
  },
  
  // Enhanced input styles with focus states
  primaryInput: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    ...SHADOWS.light,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.sm,
  },
  
  // Error handling with icons
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontWeight: '500',
    flex: 1,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Time range inputs
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  timeRangeSeparator: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
    fontWeight: '500',
  },

  // Enhanced icon selector with compact grid layout
  iconSection: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconSectionTitle: {
    ...TYPOGRAPHY.h6,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  iconOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  selectedIconOption: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
    borderWidth: 2,
    ...SHADOWS.light,
  },
  iconLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
    height: 10,
    lineHeight: 10,
  },
  selectedIconLabel: {
    color: COLORS.card,
    fontWeight: '600',
  },

  // Switch component
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // Footer with enhanced button and safe area
  footerSafeArea: {
    backgroundColor: COLORS.card,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...SHADOWS.medium,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Spacing
  bottomSpacing: {
    height: SPACING.xxl + 20, // Extra space to prevent bottom cut-off
  },
});