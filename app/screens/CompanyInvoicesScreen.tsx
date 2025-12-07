import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import companyBillingService, {
  CompanyInvoice,
} from '../services/companyBillingService';

export default function CompanyInvoicesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<CompanyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'pending' | 'paid' | 'overdue'
  >('all');

  useEffect(() => {
    if (user?.company_id) {
      loadInvoices();
    }
  }, [user?.company_id, activeFilter]);

  const loadInvoices = async () => {
    if (!user?.company_id) return;

    try {
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const { data, error } = await companyBillingService.getCompanyInvoices(
        user.company_id,
        { status }
      );

      if (error) {
        console.error('Error loading invoices:', error);
      } else {
        setInvoices(data || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return theme.colors.success;
      case 'overdue':
        return theme.colors.error;
      case 'pending':
      case 'outstanding':
        return theme.colors.warning;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'overdue':
        return 'alert-circle';
      case 'pending':
      case 'outstanding':
        return 'time';
      default:
        return 'document';
    }
  };

  const renderInvoice = ({ item }: { item: CompanyInvoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() =>
        navigation.navigate(
          'InvoiceDetail' as never,
          { invoiceId: item.id } as never
        )
      }
    >
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceNumberContainer}>
          <Ionicons
            name="document-text"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Invoice Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.invoice_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.payment_due_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Terms:</Text>
          <Text style={styles.detailValue}>{item.payment_terms}</Text>
        </View>
      </View>

      <View style={styles.invoiceFooter}>
        <View>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            ${item.billing_amount.toFixed(2)}
          </Text>
        </View>
        {item.outstanding_amount && item.outstanding_amount > 0 && (
          <View style={styles.outstandingContainer}>
            <Text style={styles.outstandingLabel}>Outstanding</Text>
            <Text style={styles.outstandingValue}>
              ${item.outstanding_amount.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    filter: 'all' | 'pending' | 'paid' | 'overdue',
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!user?.company_id) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoices</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="business-outline"
            size={64}
            color={theme.colors.text.tertiary}
          />
          <Text style={styles.emptyText}>
            Invoice access is only available for company accounts
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoices</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Statements</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('paid', 'Paid')}
        {renderFilterButton('overdue', 'Overdue')}
      </View>

      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtext}>
              Monthly statements will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginTop: 8,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  outstandingContainer: {
    alignItems: 'flex-end',
  },
  outstandingLabel: {
    fontSize: 12,
    color: theme.colors.warning,
    marginBottom: 4,
  },
  outstandingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
  },
});
