import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { realTimePaymentService } from '../../services/realTimePaymentService';
import { theme } from '../../utils/theme';

interface PaymentAllocation {
  invoice_id: string;
  invoice_number: string;
  original_amount: number;
  allocated_amount: number;
  remaining_amount: number;
}

interface PaymentAllocationPreviewProps {
  companyId: string;
  paymentAmount: number;
  allocationStrategy: 'oldest_first' | 'largest_first' | 'manual';
  onAllocationChange?: (allocations: PaymentAllocation[]) => void;
  editable?: boolean;
}

export default function PaymentAllocationPreview({
  companyId,
  paymentAmount,
  allocationStrategy,
  onAllocationChange,
  editable = false
}: PaymentAllocationPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [remainingPayment, setRemainingPayment] = useState(0);
  const [manualAllocations, setManualAllocations] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (paymentAmount > 0) {
      calculateAllocation();
    } else {
      setAllocations([]);
      setTotalAllocated(0);
      setRemainingPayment(0);
    }
  }, [companyId, paymentAmount, allocationStrategy]);

  const calculateAllocation = async () => {
    setLoading(true);
    try {
      const result = await realTimePaymentService.calculatePaymentAllocation(
        companyId,
        paymentAmount,
        allocationStrategy
      );

      if (result.error) {
        Alert.alert('Calculation Error', result.error);
        return;
      }

      if (result.data) {
        const calculatedAllocations = result.data.allocations;
        setAllocations(calculatedAllocations);
        setTotalAllocated(result.data.total_allocated);
        setRemainingPayment(result.data.remaining_payment);
        
        // Initialize manual allocations for editable mode
        if (editable && allocationStrategy === 'manual') {
          const manualAmounts: { [key: string]: string } = {};
          calculatedAllocations.forEach(allocation => {
            manualAmounts[allocation.invoice_id] = allocation.allocated_amount.toString();
          });
          setManualAllocations(manualAmounts);
        }

        onAllocationChange?.(calculatedAllocations);
      }
    } catch (error) {
      console.error('Error calculating allocation:', error);
      Alert.alert('Error', 'Failed to calculate payment allocation');
    } finally {
      setLoading(false);
    }
  };

  const updateManualAllocation = (invoiceId: string, amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    const invoice = allocations.find(a => a.invoice_id === invoiceId);
    
    if (!invoice) return;

    // Validate amount doesn't exceed original invoice amount
    if (numericAmount > invoice.original_amount) {
      Alert.alert('Invalid Amount', `Amount cannot exceed invoice total of ${formatCurrency(invoice.original_amount)}`);
      return;
    }

    setManualAllocations(prev => ({
      ...prev,
      [invoiceId]: amount
    }));

    // Recalculate totals
    const updatedAllocations = allocations.map(allocation => {
      if (allocation.invoice_id === invoiceId) {
        return {
          ...allocation,
          allocated_amount: numericAmount,
          remaining_amount: allocation.original_amount - numericAmount
        };
      }
      return allocation;
    });

    const newTotalAllocated = updatedAllocations.reduce((sum, a) => sum + a.allocated_amount, 0);
    const newRemainingPayment = paymentAmount - newTotalAllocated;

    setAllocations(updatedAllocations);
    setTotalAllocated(newTotalAllocated);
    setRemainingPayment(newRemainingPayment);
    onAllocationChange?.(updatedAllocations);
  };

  const autoAllocateRemaining = () => {
    let remaining = paymentAmount;
    const updatedAllocations = [...allocations];

    // Sort by original amount (largest first) for auto-allocation
    updatedAllocations.sort((a, b) => b.original_amount - a.original_amount);

    updatedAllocations.forEach(allocation => {
      if (remaining <= 0) {
        allocation.allocated_amount = 0;
      } else if (remaining >= allocation.original_amount) {
        allocation.allocated_amount = allocation.original_amount;
        remaining -= allocation.original_amount;
      } else {
        allocation.allocated_amount = remaining;
        remaining = 0;
      }
      allocation.remaining_amount = allocation.original_amount - allocation.allocated_amount;
    });

    setAllocations(updatedAllocations);
    setTotalAllocated(paymentAmount - remaining);
    setRemainingPayment(remaining);

    // Update manual allocations state
    const newManualAllocations: { [key: string]: string } = {};
    updatedAllocations.forEach(allocation => {
      newManualAllocations[allocation.invoice_id] = allocation.allocated_amount.toString();
    });
    setManualAllocations(newManualAllocations);

    onAllocationChange?.(updatedAllocations);
  };

  const clearAllAllocations = () => {
    const clearedAllocations = allocations.map(allocation => ({
      ...allocation,
      allocated_amount: 0,
      remaining_amount: allocation.original_amount
    }));

    setAllocations(clearedAllocations);
    setTotalAllocated(0);
    setRemainingPayment(paymentAmount);

    // Clear manual allocations
    const clearedManualAllocations: { [key: string]: string } = {};
    allocations.forEach(allocation => {
      clearedManualAllocations[allocation.invoice_id] = '0';
    });
    setManualAllocations(clearedManualAllocations);

    onAllocationChange?.(clearedAllocations);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount);
  };

  const getAllocationStatus = () => {
    if (totalAllocated === paymentAmount) return 'fully_allocated';
    if (totalAllocated < paymentAmount) return 'under_allocated';
    return 'over_allocated';
  };

  const getStatusColor = () => {
    const status = getAllocationStatus();
    switch (status) {
      case 'fully_allocated': return theme.colors.success;
      case 'under_allocated': return theme.colors.warning;
      case 'over_allocated': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Calculating allocation...</Text>
      </View>
    );
  }

  if (allocations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No outstanding invoices to allocate payment to</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Allocation Preview</Text>
        <View style={styles.strategyBadge}>
          <Text style={styles.strategyText}>
            {allocationStrategy.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Amount:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(paymentAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Allocated:</Text>
          <Text style={[styles.summaryValue, { color: getStatusColor() }]}>
            {formatCurrency(totalAllocated)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining:</Text>
          <Text style={[
            styles.summaryValue,
            { color: remainingPayment === 0 ? theme.colors.success : theme.colors.warning }
          ]}>
            {formatCurrency(remainingPayment)}
          </Text>
        </View>
      </View>

      {editable && allocationStrategy === 'manual' && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={autoAllocateRemaining}>
            <Text style={styles.controlButtonText}>Auto Allocate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.clearButton]}
            onPress={clearAllAllocations}
          >
            <Text style={[styles.controlButtonText, styles.clearButtonText]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.allocationsList}>
        {allocations.map((allocation, index) => (
          <View key={allocation.invoice_id} style={styles.allocationCard}>
            <View style={styles.allocationHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>{allocation.invoice_number}</Text>
                <Text style={styles.originalAmount}>
                  Original: {formatCurrency(allocation.original_amount)}
                </Text>
              </View>
              <View style={styles.allocationAmount}>
                {editable && allocationStrategy === 'manual' ? (
                  <TextInput
                    style={styles.amountInput}
                    value={manualAllocations[allocation.invoice_id] || '0'}
                    onChangeText={(text) => updateManualAllocation(allocation.invoice_id, text)}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                ) : (
                  <Text style={styles.allocatedText}>
                    {formatCurrency(allocation.allocated_amount)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.allocationProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((allocation.allocated_amount / allocation.original_amount) * 100, 100)}%`,
                      backgroundColor: allocation.allocated_amount === allocation.original_amount
                        ? theme.colors.success
                        : theme.colors.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.remainingText}>
                Remaining: {formatCurrency(allocation.remaining_amount)}
              </Text>
            </View>

            {allocation.allocated_amount > allocation.original_amount && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ Amount exceeds invoice total
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>
            {getAllocationStatus().replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  strategyBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strategyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    ...theme.shadows.light,
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
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButtonText: {
    color: theme.colors.text,
  },
  allocationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  allocationCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.light,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  originalAmount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  allocationAmount: {
    alignItems: 'flex-end',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'right',
    minWidth: 100,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  allocatedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  allocationProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  warningContainer: {
    backgroundColor: theme.colors.warningBackground,
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});