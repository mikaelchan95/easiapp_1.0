import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import companyBillingService, {
  BillingSettings,
} from '../../services/companyBillingService';

interface BillingSettingsProps {
  companyId: string;
  companyName: string;
  onSave?: (settings: BillingSettings) => void;
  onBack?: () => void;
}

export const BillingSettingsScreen: React.FC<BillingSettingsProps> = ({
  companyId,
  companyName,
  onSave,
  onBack,
}) => {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [billingFrequency, setBillingFrequency] = useState('monthly');
  const [billingDayOfMonth, setBillingDayOfMonth] = useState('1');
  const [autoBillingEnabled, setAutoBillingEnabled] = useState(false);
  const [billingEmail, setBillingEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [sendReminders, setSendReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState('7,3,1');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeType, setLateFeeType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [lateFeeAmount, setLateFeeAmount] = useState('5');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } =
      await companyBillingService.getBillingSettings(companyId);

    if (fetchError) {
      setError(fetchError);
    } else if (data) {
      setSettings(data);
      populateForm(data);
    }

    setLoading(false);
  };

  const populateForm = (data: BillingSettings) => {
    setBillingFrequency(data.billing_frequency);
    setBillingDayOfMonth(data.billing_day_of_month.toString());
    setAutoBillingEnabled(data.auto_billing_enabled);
    setBillingEmail(data.billing_email || '');
    setCcEmails(data.cc_emails ? data.cc_emails.join(', ') : '');
    setSendReminders(data.send_reminders);
    setReminderDays(data.reminder_days_before.join(','));
    setLateFeeEnabled(data.late_fee_enabled);
    setLateFeeType(data.late_fee_type);
    setLateFeeAmount(data.late_fee_amount.toString());
    setGracePeriodDays(data.grace_period_days.toString());
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Validate form
      const dayOfMonth = parseInt(billingDayOfMonth);
      if (dayOfMonth < 1 || dayOfMonth > 28) {
        Alert.alert('Validation Error', 'Billing day must be between 1 and 28');
        setSaving(false);
        return;
      }

      const gracePeriod = parseInt(gracePeriodDays);
      if (gracePeriod < 0 || gracePeriod > 30) {
        Alert.alert(
          'Validation Error',
          'Grace period must be between 0 and 30 days'
        );
        setSaving(false);
        return;
      }

      const feeAmount = parseFloat(lateFeeAmount);
      if (feeAmount < 0) {
        Alert.alert('Validation Error', 'Late fee amount must be positive');
        setSaving(false);
        return;
      }

      // Parse reminder days
      const reminderDaysArray = reminderDays
        .split(',')
        .map(d => parseInt(d.trim()))
        .filter(d => !isNaN(d) && d > 0);

      // Parse CC emails
      const ccEmailsArray = ccEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const updatedSettings: Partial<BillingSettings> = {
        billing_frequency: billingFrequency,
        billing_day_of_month: dayOfMonth,
        auto_billing_enabled: autoBillingEnabled,
        billing_email: billingEmail || undefined,
        cc_emails: ccEmailsArray.length > 0 ? ccEmailsArray : undefined,
        send_reminders: sendReminders,
        reminder_days_before: reminderDaysArray,
        late_fee_enabled: lateFeeEnabled,
        late_fee_type: lateFeeType,
        late_fee_amount: feeAmount,
        grace_period_days: gracePeriod,
      };

      const { data, error: saveError } =
        await companyBillingService.updateBillingSettings(
          companyId,
          updatedSettings
        );

      if (saveError) {
        setError(saveError);
      } else {
        setSettings(data || null);
        setHasChanges(false);
        onSave?.(data!);
        Alert.alert('Success', 'Billing settings updated successfully');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      populateForm(settings);
      setHasChanges(false);
    }
  };

  const markChanged = () => {
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderToggle = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && (
          <Text style={styles.toggleDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={val => {
          onValueChange(val);
          markChanged();
        }}
        trackColor={{
          false: theme.colors.frame,
          true: theme.colors.text.primary,
        }}
        thumbColor={value ? theme.colors.canvas : '#f4f3f4'}
      />
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: 'default' | 'numeric' | 'email-address',
    multiline?: boolean
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={text => {
          onChangeText(text);
          markChanged();
        }}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={theme.colors.text.secondary}
      />
    </View>
  );

  const renderPicker = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onValueChange: (value: string) => void
  ) => (
    <View style={styles.pickerGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              value === option.value && styles.selectedPickerOption,
            ]}
            onPress={() => {
              onValueChange(option.value);
              markChanged();
            }}
          >
            <Text
              style={[
                styles.pickerOptionText,
                value === option.value && styles.selectedPickerOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading billing settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.text.secondary}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Billing Settings</Text>
          <Text style={styles.headerSubtitle}>{companyName}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        {renderSection(
          'General Settings',
          <>
            {renderPicker(
              'Billing Frequency',
              billingFrequency,
              [
                { label: 'Monthly', value: 'monthly' },
                { label: 'Quarterly', value: 'quarterly' },
                { label: 'Annual', value: 'annual' },
              ],
              setBillingFrequency
            )}

            {renderInput(
              'Billing Day of Month',
              billingDayOfMonth,
              setBillingDayOfMonth,
              'Day of month (1-28)',
              'numeric'
            )}

            {renderToggle(
              'Automatic Billing',
              autoBillingEnabled,
              setAutoBillingEnabled,
              'Automatically generate and send invoices'
            )}
          </>
        )}

        {/* Email Settings */}
        {renderSection(
          'Email Settings',
          <>
            {renderInput(
              'Primary Billing Email',
              billingEmail,
              setBillingEmail,
              'billing@company.com',
              'email-address'
            )}

            {renderInput(
              'CC Email Addresses',
              ccEmails,
              setCcEmails,
              'finance@company.com, manager@company.com',
              'email-address',
              true
            )}

            {renderToggle(
              'Send Payment Reminders',
              sendReminders,
              setSendReminders,
              'Automatically send reminder emails before due dates'
            )}

            {sendReminders &&
              renderInput(
                'Reminder Days',
                reminderDays,
                setReminderDays,
                'Days before due date (e.g., 7,3,1)',
                'numeric'
              )}
          </>
        )}

        {/* Late Fee Settings */}
        {renderSection(
          'Late Fee Settings',
          <>
            {renderToggle(
              'Enable Late Fees',
              lateFeeEnabled,
              setLateFeeEnabled,
              'Automatically apply late fees to overdue invoices'
            )}

            {lateFeeEnabled && (
              <>
                {renderPicker(
                  'Late Fee Type',
                  lateFeeType,
                  [
                    { label: 'Percentage', value: 'percentage' },
                    { label: 'Fixed Amount', value: 'fixed' },
                  ],
                  setLateFeeType
                )}

                {renderInput(
                  lateFeeType === 'percentage'
                    ? 'Late Fee Percentage'
                    : 'Late Fee Amount (SGD)',
                  lateFeeAmount,
                  setLateFeeAmount,
                  lateFeeType === 'percentage' ? '5' : '50.00',
                  'numeric'
                )}

                {renderInput(
                  'Grace Period (Days)',
                  gracePeriodDays,
                  setGracePeriodDays,
                  'Days after due date before late fee applies',
                  'numeric'
                )}
              </>
            )}
          </>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Contact support for assistance with billing configuration or if you
            need custom billing terms.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={theme.colors.text.primary}
            />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {hasChanges && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={saving}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.savingButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.canvas} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.frame,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.light,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.frame,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.canvas,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerGroup: {
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.frame,
    alignItems: 'center',
  },
  selectedPickerOption: {
    backgroundColor: theme.colors.text.primary,
    borderColor: theme.colors.text.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  selectedPickerOptionText: {
    color: theme.colors.canvas,
  },
  helpSection: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    ...theme.shadows.light,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: theme.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.frame,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.text.primary,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
});
