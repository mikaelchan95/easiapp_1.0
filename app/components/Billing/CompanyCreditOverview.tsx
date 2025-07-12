import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import companyBillingService, { CompanyBillingStatus } from '../../services/companyBillingService';

interface CompanyCreditOverviewProps {
  companyId: string;
  onPress?: () => void;
  onRefresh?: () => void;
  showHeader?: boolean;
}

export const CompanyCreditOverview: React.FC<CompanyCreditOverviewProps> = ({
  companyId,
  onPress,
  onRefresh,
  showHeader = true,
}) => {
  const [billingStatus, setBillingStatus] = useState<CompanyBillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingStatus();
  }, [companyId]);

  const loadBillingStatus = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await companyBillingService.getCompanyBillingStatus(companyId);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setBillingStatus(data || null);
    }
    
    setLoading(false);
  };

  const handleRefresh = () => {
    loadBillingStatus();
    onRefresh?.();
  };

  const getCreditStatusColor = (utilization: number, status: string) => {
    if (status === 'overlimit') return '#EF4444'; // Red
    if (utilization >= 90) return '#F59E0B'; // Amber
    if (utilization >= 75) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  };

  const getCreditStatusText = (utilization: number, status: string) => {
    if (status === 'overlimit') return 'Over Limit';
    if (utilization >= 90) return 'Critical';
    if (utilization >= 75) return 'High Usage';
    return 'Good Standing';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]} testID="credit-overview-loading">
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading credit information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]} testID="credit-overview-error">
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.secondary} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!billingStatus) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>No billing data available</Text>
      </View>
    );
  }

  const creditStatusColor = getCreditStatusColor(billingStatus.credit_utilization, billingStatus.billing_status);
  const creditStatusText = getCreditStatusText(billingStatus.credit_utilization, billingStatus.billing_status);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      testID="credit-overview"
    >
      {showHeader && (
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Company Credit</Text>
            <Text style={styles.subtitle}>{billingStatus.company_name}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusBadge, { backgroundColor: creditStatusColor }]}>
              <Text style={styles.statusText}>{creditStatusText}</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefresh}
              testID="refresh-button"
            >
              <Ionicons name="refresh-outline" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Credit Utilization Progress */}
      <View style={styles.utilizationSection}>
        <View style={styles.utilizationHeader}>
          <Text style={styles.utilizationTitle}>Credit Utilization</Text>
          <Text style={styles.utilizationPercentage}>
            {String(billingStatus.credit_utilization.toFixed(0))}%
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(billingStatus.credit_utilization, 100)}%`,
                  backgroundColor: creditStatusColor
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Credit Details Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {companyBillingService.formatCurrency(billingStatus.current_credit)}
          </Text>
          <Text style={styles.metricLabel}>Available Credit</Text>
          <View style={styles.metricSubtext}>
            <Ionicons 
              name={billingStatus.current_credit >= 0 ? "trending-up" : "trending-down"} 
              size={12} 
              color={billingStatus.current_credit >= 0 ? '#10B981' : '#EF4444'} 
            />
            <Text style={[
              styles.metricSubtextLabel,
              { color: billingStatus.current_credit >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {billingStatus.current_credit >= 0 ? 'Available' : 'Overlimit'}
            </Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {companyBillingService.formatCurrency(billingStatus.credit_used)}
          </Text>
          <Text style={styles.metricLabel}>Credit Used</Text>
          <Text style={styles.metricSubtextLabel}>
            of {companyBillingService.formatCurrency(billingStatus.credit_limit)}
          </Text>
        </View>
      </View>

      {/* Latest Invoice Info */}
      {billingStatus.latest_invoice && (
        <View style={styles.invoiceSection}>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>Latest Invoice</Text>
            <View style={styles.invoiceStatus}>
              <View style={[
                styles.invoiceStatusDot,
                { backgroundColor: companyBillingService.getPaymentStatusColor(billingStatus.latest_invoice.status) }
              ]} />
              <Text style={styles.invoiceStatusText}>
                {billingStatus.latest_invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetail}>
              <Text style={styles.invoiceDetailLabel}>Invoice #</Text>
              <Text style={styles.invoiceDetailValue}>
                {billingStatus.latest_invoice.invoice_number}
              </Text>
            </View>
            <View style={styles.invoiceDetail}>
              <Text style={styles.invoiceDetailLabel}>Amount</Text>
              <Text style={styles.invoiceDetailValue}>
                {companyBillingService.formatCurrency(billingStatus.latest_invoice.billing_amount)}
              </Text>
            </View>
            <View style={styles.invoiceDetail}>
              <Text style={styles.invoiceDetailLabel}>Due Date</Text>
              <Text style={[
                styles.invoiceDetailValue,
                { 
                  color: companyBillingService.isInvoiceOverdue(billingStatus.latest_invoice.payment_due_date) 
                    ? '#EF4444' 
                    : theme.colors.text.primary 
                }
              ]}>
                {companyBillingService.formatDate(billingStatus.latest_invoice.payment_due_date)}
              </Text>
            </View>
          </View>

          {companyBillingService.isInvoiceOverdue(billingStatus.latest_invoice.payment_due_date) && (
            <View style={styles.overdueWarning}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={styles.overdueText}>
                Overdue by {String(Math.abs(companyBillingService.getDaysUntilDue(billingStatus.latest_invoice.payment_due_date)))} days
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Payment Terms */}
      <View style={styles.paymentTermsSection}>
        <Text style={styles.paymentTermsLabel}>Payment Terms</Text>
        <Text style={styles.paymentTermsValue}>{billingStatus.payment_terms}</Text>
      </View>

      {onPress && (
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Full Billing Dashboard</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 20,
    padding: 24,
    ...theme.shadows.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.frame,
  },
  utilizationSection: {
    marginBottom: 24,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  utilizationPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: theme.colors.frame,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  metricSubtext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricSubtextLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  invoiceSection: {
    backgroundColor: theme.colors.frame,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  invoiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  invoiceDetails: {
    gap: 8,
  },
  invoiceDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDetailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  invoiceDetailValue: {
    fontSize: 12,
    fontWeight: '600',
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
  paymentTermsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTermsLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  paymentTermsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 12,
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