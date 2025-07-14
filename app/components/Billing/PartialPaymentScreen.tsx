import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  realTimePaymentService,
  PartialPaymentRequest,
} from '../../services/realTimePaymentService';
import { enhancedBillingService } from '../../services/enhancedBillingService';
import { theme } from '../../utils/theme';

interface PaymentAllocationPreview {
  invoice_id: string;
  invoice_number: string;
  original_amount: number;
  allocated_amount: number;
  remaining_amount: number;
}

export default function PartialPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;

  // Validate route parameters
  if (!params || !params.companyId || !params.companyName) {
    console.error(
      '❌ PartialPaymentScreen: Missing required route params:',
      params
    );

    // Return early with error UI instead of crashing
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Missing company information. Please go back and try again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { companyId, companyName } = params;

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [allocationStrategy, setAllocationStrategy] = useState<
    'oldest_first' | 'largest_first' | 'manual'
  >('oldest_first');
  const [notes, setNotes] = useState('');
  const [allocationPreview, setAllocationPreview] = useState<
    PaymentAllocationPreview[]
  >([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [remainingPayment, setRemainingPayment] = useState(0);

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
  ];

  const allocationStrategies = [
    { value: 'oldest_first', label: 'Oldest First' },
    { value: 'largest_first', label: 'Largest First' },
    { value: 'manual', label: 'Manual Allocation' },
  ];

  useEffect(() => {
    if (paymentAmount && parseFloat(paymentAmount) > 0) {
      calculateAllocation();
    } else {
      setAllocationPreview([]);
      setTotalAllocated(0);
      setRemainingPayment(0);
    }
  }, [paymentAmount, allocationStrategy]);

  const calculateAllocation = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;

    setCalculating(true);
    try {
      const result = await realTimePaymentService.calculatePaymentAllocation(
        companyId,
        parseFloat(paymentAmount),
        allocationStrategy
      );

      if (result.error) {
        Alert.alert('Calculation Error', result.error);
        return;
      }

      if (result.data) {
        setAllocationPreview(result.data.allocations);
        setTotalAllocated(result.data.total_allocated);
        setRemainingPayment(result.data.remaining_payment);
      }
    } catch (error) {
      console.error('Error calculating allocation:', error);
      Alert.alert('Error', 'Failed to calculate payment allocation');
    } finally {
      setCalculating(false);
    }
  };

  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    if (!paymentReference.trim()) {
      Alert.alert('Missing Reference', 'Please enter a payment reference');
      return;
    }

    setLoading(true);
    try {
      const paymentData: PartialPaymentRequest = {
        company_id: companyId,
        payment_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        bank_reference: bankReference || undefined,
        allocation_strategy: allocationStrategy,
        notes: notes || undefined,
      };

      const result =
        await enhancedBillingService.processPartialPaymentWithUpdates(
          paymentData,
          progress => {
            if (__DEV__) console.log('Payment progress:', progress);
          }
        );

      if (result.error) {
        Alert.alert('Payment Failed', result.error);
        return;
      }

      Alert.alert(
        'Payment Processed',
        `Payment of ${formatCurrency(parseFloat(paymentAmount))} has been successfully processed and allocated.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Process Partial Payment</Text>
        <Text style={styles.subtitle}>{companyName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Amount *</Text>
          <TextInput
            style={styles.input}
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodSelector}
          >
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodButton,
                  paymentMethod === method.value && styles.methodButtonSelected,
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    paymentMethod === method.value &&
                      styles.methodButtonTextSelected,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Reference *</Text>
          <TextInput
            style={styles.input}
            value={paymentReference}
            onChangeText={setPaymentReference}
            placeholder="Enter payment reference"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Reference</Text>
          <TextInput
            style={styles.input}
            value={bankReference}
            onChangeText={setBankReference}
            placeholder="Enter bank reference (optional)"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allocation Strategy</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strategySelector}
        >
          {allocationStrategies.map(strategy => (
            <TouchableOpacity
              key={strategy.value}
              style={[
                styles.strategyButton,
                allocationStrategy === strategy.value &&
                  styles.strategyButtonSelected,
              ]}
              onPress={() => setAllocationStrategy(strategy.value as any)}
            >
              <Text
                style={[
                  styles.strategyButtonText,
                  allocationStrategy === strategy.value &&
                    styles.strategyButtonTextSelected,
                ]}
              >
                {strategy.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {calculating && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Calculating allocation...</Text>
        </View>
      )}

      {allocationPreview.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Allocation Preview</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payment:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(parseFloat(paymentAmount))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Allocated:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalAllocated)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      remainingPayment > 0
                        ? theme.colors.warning
                        : theme.colors.success,
                  },
                ]}
              >
                {formatCurrency(remainingPayment)}
              </Text>
            </View>
          </View>

          {allocationPreview.map((allocation, index) => (
            <View key={allocation.invoice_id} style={styles.allocationCard}>
              <View style={styles.allocationHeader}>
                <Text style={styles.invoiceNumber}>
                  {allocation.invoice_number}
                </Text>
                <Text style={styles.allocatedAmount}>
                  {formatCurrency(allocation.allocated_amount)}
                </Text>
              </View>
              <View style={styles.allocationDetails}>
                <Text style={styles.allocationDetail}>
                  Original: {formatCurrency(allocation.original_amount)}
                </Text>
                <Text style={styles.allocationDetail}>
                  Remaining: {formatCurrency(allocation.remaining_amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes (optional)"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.processButton,
            (loading || !paymentAmount || !paymentReference) &&
              styles.buttonDisabled,
          ]}
          onPress={processPayment}
          disabled={loading || !paymentAmount || !paymentReference}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.processButtonText}>Process Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  methodSelector: {
    flexDirection: 'row',
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.background,
  },
  methodButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  methodButtonText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  methodButtonTextSelected: {
    color: 'white',
  },
  strategySelector: {
    flexDirection: 'row',
  },
  strategyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: theme.colors.background,
  },
  strategyButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  strategyButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  strategyButtonTextSelected: {
    color: 'white',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    ...theme.shadows.light,
  },
  loadingText: {
    marginLeft: 8,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  allocationCard: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  allocatedAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  allocationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allocationDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  processButton: {
    backgroundColor: theme.colors.primary,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error || theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
