import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import companyBillingService, {
  CompanyPayment,
} from '../../services/companyBillingService';

interface PaymentHistoryProps {
  companyId: string;
  onPaymentPress?: (payment: CompanyPayment) => void;
  limit?: number;
  showFilters?: boolean;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'failed' | 'cancelled';

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  companyId,
  onPaymentPress,
  limit,
  showFilters = true,
}) => {
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const pageSize = limit || 20;

  useEffect(() => {
    loadPayments(true);
  }, [companyId, activeFilter]);

  const loadPayments = useCallback(
    async (reset = false) => {
      const isInitialLoad = reset || currentPage === 0;

      if (isInitialLoad) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const offset = isInitialLoad ? 0 : currentPage * pageSize;
        const status = activeFilter === 'all' ? undefined : activeFilter;

        const {
          data,
          error: fetchError,
          count,
        } = await companyBillingService.getCompanyPayments(companyId, {
          limit: pageSize,
          offset,
          status,
        });

        if (fetchError) {
          setError(fetchError);
          return;
        }

        const newPayments = data || [];

        if (isInitialLoad) {
          setPayments(newPayments);
          setCurrentPage(1);
        } else {
          setPayments(prev => [...prev, ...newPayments]);
          setCurrentPage(prev => prev + 1);
        }

        // Check if there are more items
        const totalLoaded = isInitialLoad
          ? newPayments.length
          : payments.length + newPayments.length;
        setHasMore(
          count ? totalLoaded < count : newPayments.length === pageSize
        );
      } catch (err) {
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [companyId, currentPage, pageSize, activeFilter, payments.length]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    loadPayments(true);
  }, [loadPayments]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPayments(false);
    }
  }, [loadPayments, loadingMore, hasMore]);

  const handleFilterPress = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  };

  const getPaymentStatusColor = (status: string) => {
    return companyBillingService.getPaymentStatusColor(status);
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'card';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank_transfer':
        return 'business';
      case 'credit_card':
        return 'card';
      case 'debit_card':
        return 'card-outline';
      case 'paypal':
        return 'logo-paypal';
      case 'cheque':
        return 'document-text';
      case 'cash':
        return 'cash';
      default:
        return 'card';
    }
  };

  const handlePaymentPress = (payment: CompanyPayment) => {
    if (onPaymentPress) {
      onPaymentPress(payment);
    } else {
      // Default action - show payment details
      Alert.alert(
        'Payment Details',
        `Amount: ${companyBillingService.formatCurrency(payment.payment_amount)}\n` +
          `Method: ${payment.payment_method.replace('_', ' ').toUpperCase()}\n` +
          `Status: ${payment.status.toUpperCase()}\n` +
          `Date: ${companyBillingService.formatDate(payment.payment_date)}\n` +
          `Reference: ${payment.payment_reference || 'N/A'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderPaymentItem = ({ item }: { item: CompanyPayment }) => {
    const paymentDate = new Date(item.payment_date);
    const isRecent =
      Date.now() - paymentDate.getTime() < 7 * 24 * 60 * 60 * 1000; // Last 7 days

    return (
      <TouchableOpacity
        style={styles.paymentItem}
        onPress={() => handlePaymentPress(item)}
        testID={`payment-item-${item.id}`}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIconSection}>
            <View
              style={[
                styles.paymentIcon,
                { backgroundColor: getPaymentStatusColor(item.status) + '20' },
              ]}
            >
              <Ionicons
                name={getPaymentMethodIcon(item.payment_method)}
                size={20}
                color={getPaymentStatusColor(item.status)}
              />
            </View>
            {isRecent && (
              <View style={styles.recentBadge}>
                <Text style={styles.recentBadgeText}>NEW</Text>
              </View>
            )}
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.paymentMainInfo}>
              <Text style={styles.paymentAmount}>
                {companyBillingService.formatCurrency(item.payment_amount)}
              </Text>
              <View style={styles.statusContainer}>
                <Ionicons
                  name={getPaymentStatusIcon(item.status)}
                  size={12}
                  color={getPaymentStatusColor(item.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getPaymentStatusColor(item.status) },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.paymentMeta}>
              <Text style={styles.paymentMethod}>
                {item.payment_method.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.paymentDate}>
                {companyBillingService.formatDate(item.payment_date)}
              </Text>
            </View>
          </View>
        </View>

        {item.payment_reference && (
          <View style={styles.referenceSection}>
            <Text style={styles.referenceLabel}>Reference:</Text>
            <Text style={styles.referenceValue}>{item.payment_reference}</Text>
          </View>
        )}

        {item.invoice_id && (
          <View style={styles.invoiceSection}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={theme.colors.text.secondary}
            />
            <Text style={styles.invoiceText}>Applied to invoice</Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.actionIndicator}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => {
    if (!showFilters) return null;

    const filters: { key: FilterStatus; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'pending', label: 'Pending' },
      { key: 'failed', label: 'Failed' },
      { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.key && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterPress(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === item.key && styles.activeFilterButtonText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.text.primary} />
        <Text style={styles.loadingMoreText}>Loading more payments...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="card-outline"
        size={48}
        color={theme.colors.text.secondary}
      />
      <Text style={styles.emptyStateTitle}>No Payments Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {activeFilter === 'all'
          ? 'No payments have been recorded yet'
          : `No ${activeFilter} payments found`}
      </Text>
    </View>
  );

  // Summary stats for payments
  const getSummaryStats = () => {
    const totalAmount = payments.reduce((sum, payment) => {
      return payment.status === 'confirmed'
        ? sum + payment.payment_amount
        : sum;
    }, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthPayments = payments.filter(
      payment =>
        payment.status === 'confirmed' &&
        new Date(payment.payment_date) >= thisMonth
    );
    const thisMonthAmount = thisMonthPayments.reduce(
      (sum, payment) => sum + payment.payment_amount,
      0
    );

    return {
      totalAmount,
      thisMonthAmount,
      thisMonthCount: thisMonthPayments.length,
    };
  };

  const renderSummaryStats = () => {
    const { totalAmount, thisMonthAmount, thisMonthCount } = getSummaryStats();

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {companyBillingService.formatCurrency(totalAmount)}
          </Text>
          <Text style={styles.summaryLabel}>Total Payments</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {companyBillingService.formatCurrency(thisMonthAmount)}
          </Text>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summarySubLabel}>
            {String(thisMonthCount)} payments
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading payment history...</Text>
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
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {payments.length > 0 && renderSummaryStats()}
      {renderFilterButtons()}

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={renderPaymentItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          payments.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.light,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  summarySubLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.text.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeFilterButtonText: {
    color: theme.colors.canvas,
  },
  paymentItem: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.light,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentIconSection: {
    marginRight: 12,
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBadge: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  recentBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  referenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
  },
  referenceLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginRight: 8,
  },
  referenceValue: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  invoiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  invoiceText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  notesSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.frame,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    lineHeight: 16,
  },
  actionIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
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
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
