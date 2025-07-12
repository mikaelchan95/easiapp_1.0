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
import companyBillingService, { CompanyInvoice } from '../../services/companyBillingService';

interface InvoicesListProps {
  companyId: string;
  onInvoicePress?: (invoice: CompanyInvoice) => void;
  limit?: number;
  showFilters?: boolean;
}

type FilterStatus = 'all' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export const InvoicesList: React.FC<InvoicesListProps> = ({
  companyId,
  onInvoicePress,
  limit,
  showFilters = true,
}) => {
  // Guard against invalid companyId
  if (!companyId || typeof companyId !== 'string') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Invalid company ID provided to InvoicesList
        </Text>
      </View>
    );
  }
  const [invoices, setInvoices] = useState<CompanyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const pageSize = limit || 20;

  useEffect(() => {
    loadInvoices(true);
  }, [companyId, activeFilter]);

  const loadInvoices = useCallback(async (reset = false) => {
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

      const { data, error: fetchError, count } = await companyBillingService.getCompanyInvoices(
        companyId,
        {
          limit: pageSize,
          offset,
          status,
        }
      );

      if (fetchError) {
        setError(fetchError);
        return;
      }

      const newInvoices = data || [];
      
      if (isInitialLoad) {
        setInvoices(newInvoices);
        setCurrentPage(1);
      } else {
        setInvoices(prev => [...prev, ...newInvoices]);
        setCurrentPage(prev => prev + 1);
      }

      // Check if there are more items
      const totalLoaded = isInitialLoad ? newInvoices.length : invoices.length + newInvoices.length;
      setHasMore(count ? totalLoaded < count : newInvoices.length === pageSize);

    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [companyId, currentPage, pageSize, activeFilter, invoices.length]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    loadInvoices(true);
  }, [loadInvoices]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadInvoices(false);
    }
  }, [loadInvoices, loadingMore, hasMore]);

  const handleFilterPress = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  };

  const getInvoiceStatusColor = (status: string) => {
    return companyBillingService.getPaymentStatusColor(status);
  };

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'overdue':
        return 'warning';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'document';
    }
  };

  const handleInvoicePress = (invoice: CompanyInvoice) => {
    if (onInvoicePress) {
      onInvoicePress(invoice);
    } else {
      // Default action - show invoice details
      Alert.alert(
        `Invoice ${invoice.invoice_number}`,
        `Amount: ${companyBillingService.formatCurrency(invoice.billing_amount)}\n` +
        `Status: ${invoice.status.toUpperCase()}\n` +
        `Due Date: ${companyBillingService.formatDate(invoice.payment_due_date)}\n` +
        `Payment Terms: ${invoice.payment_terms}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderInvoiceItem = ({ item }: { item: CompanyInvoice }) => {
    const isOverdue = companyBillingService.isInvoiceOverdue(item.payment_due_date || '');
    const daysUntilDue = companyBillingService.getDaysUntilDue(item.payment_due_date || '');
    
    return (
      <TouchableOpacity
        style={styles.invoiceItem}
        onPress={() => handleInvoicePress(item)}
        testID={`invoice-item-${item.id}`}
      >
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceNumberSection}>
            <Text style={styles.invoiceNumber}>{item.invoice_number || 'N/A'}</Text>
            <View style={styles.statusContainer}>
              <Ionicons
                name={getInvoiceStatusIcon(item.status)}
                size={12}
                color={getInvoiceStatusColor(item.status)}
              />
              <Text style={[styles.statusText, { color: getInvoiceStatusColor(item.status) }]}>
                {(item.status || 'UNKNOWN').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.amountSection}>
            <Text style={styles.invoiceAmount}>
              {companyBillingService.formatCurrency(item.billing_amount || 0)}
            </Text>
            {item.outstanding_amount && item.outstanding_amount > 0 && (
              <Text style={styles.outstandingAmount}>
                Outstanding: {companyBillingService.formatCurrency(item.outstanding_amount)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.invoiceDetails}>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Invoice Date</Text>
            <Text style={styles.dateValue}>
              {companyBillingService.formatDate(item.invoice_date || '')}
            </Text>
          </View>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={[
              styles.dateValue,
              { color: isOverdue ? '#EF4444' : theme.colors.text.primary }
            ]}>
              {companyBillingService.formatDate(item.payment_due_date || '')}
            </Text>
          </View>
        </View>

        {isOverdue && (
          <View style={styles.overdueWarning}>
            <Ionicons name="warning" size={14} color="#EF4444" />
            <Text style={styles.overdueText}>
              Overdue by {String(Math.abs(daysUntilDue))} days
            </Text>
          </View>
        )}

        {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && (
          <View style={styles.dueSoonWarning}>
            <Ionicons name="time" size={14} color="#F59E0B" />
            <Text style={styles.dueSoonText}>
              Due in {String(daysUntilDue)} day{daysUntilDue === 1 ? '' : 's'}
            </Text>
          </View>
        )}

        <View style={styles.actionIndicator}>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => {
    if (!showFilters) return null;

    const filters: { key: FilterStatus; label: string; count?: number }[] = [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'paid', label: 'Paid' },
      { key: 'overdue', label: 'Overdue' },
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
                activeFilter === item.key && styles.activeFilterButton
              ]}
              onPress={() => handleFilterPress(item.key)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === item.key && styles.activeFilterButtonText
              ]}>
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
        <Text style={styles.loadingMoreText}>Loading more invoices...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color={theme.colors.text.secondary} />
      <Text style={styles.emptyStateTitle}>No Invoices Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {activeFilter === 'all' 
          ? 'No invoices have been generated yet'
          : `No ${activeFilter} invoices found`
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.secondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterButtons()}
      
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={renderInvoiceItem}
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
        contentContainerStyle={invoices.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  invoiceItem: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.light,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumberSection: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
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
  amountSection: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  outstandingAmount: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateSection: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  dueSoonWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  dueSoonText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
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