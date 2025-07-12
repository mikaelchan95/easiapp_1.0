import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';
import { CompanyCreditOverview } from './CompanyCreditOverview';
import { InvoicesList } from './InvoicesList';
import { PaymentHistory } from './PaymentHistory';
import MonthlyOverview from './MonthlyOverview';
import RealTimeBalanceWidget from './RealTimeBalanceWidget';
import CreditAlertsNotification from './CreditAlertsNotification';
import companyBillingService, { 
  CompanyBillingStatus, 
  CompanyInvoice, 
  CompanyPayment 
} from '../../services/companyBillingService';

interface BillingDashboardProps {
  companyId: string;
  companyName: string;
  onNavigateToSettings?: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  companyId,
  companyName,
  onNavigateToSettings,
}) => {
  // Guard against invalid companyId
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Invalid company ID. Please refresh the page or contact support.
        </Text>
      </View>
    );
  }
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [billingStatus, setBillingStatus] = useState<CompanyBillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick stats for overview tab
  const [quickStats, setQuickStats] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    overdueInvoices: 0,
    recentPayments: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load billing status
      const { data: status, error: statusError } = await companyBillingService.getCompanyBillingStatus(companyId);
      if (statusError) {
        setError(statusError);
        return;
      }
      setBillingStatus(status || null);

      // Load quick stats
      await loadQuickStats();
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuickStats = async () => {
    try {
      // Get invoices count
      const { data: invoices, count: invoicesCount } = await companyBillingService.getCompanyInvoices(
        companyId, 
        { limit: 1 }
      );
      
      // Get payments count
      const { data: payments, count: paymentsCount } = await companyBillingService.getCompanyPayments(
        companyId, 
        { limit: 1 }
      );

      // Get overdue invoices
      const { data: overdueInvoices, count: overdueCount } = await companyBillingService.getCompanyInvoices(
        companyId,
        { status: 'overdue', limit: 1 }
      );

      // Get recent payments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentPayments, count: recentCount } = await companyBillingService.getCompanyPayments(
        companyId,
        { 
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          limit: 1 
        }
      );

      setQuickStats({
        totalInvoices: invoicesCount || 0,
        totalPayments: paymentsCount || 0,
        overdueInvoices: overdueCount || 0,
        recentPayments: recentCount || 0,
      });
    } catch (err) {
      console.warn('Failed to load quick stats:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [companyId]);

  const handleGenerateInvoice = async () => {
    Alert.alert(
      'Generate Invoice',
      'Generate a new invoice for the current month?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            const now = new Date();
            const { data, error } = await companyBillingService.generateMonthlyInvoice(
              companyId,
              now.getMonth() + 1,
              now.getFullYear()
            );
            
            if (error) {
              Alert.alert('Error', error);
            } else {
              Alert.alert('Success', 'Invoice generated successfully');
              onRefresh();
            }
          }
        }
      ]
    );
  };

  const handleRecordPayment = () => {
    Alert.alert(
      'Record Payment',
      'This feature will allow recording manual payments. Implementation depends on your payment process requirements.',
      [{ text: 'OK' }]
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Real-Time Balance Widget */}
      <RealTimeBalanceWidget 
        companyId={companyId}
        companyName={companyName}
        onBalancePress={() => navigation.navigate('CompanyCreditOverview' as never, { companyId } as never)}
      />

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={() => navigation.navigate('PartialPayment' as never, { 
              companyId, 
              companyName 
            } as never)}
          >
            <Ionicons name="cash" size={24} color={theme.colors.text.primary} />
            <Text style={styles.quickActionTitle}>Make Payment</Text>
            <Text style={styles.quickActionSubtitle}>Process partial payment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={() => navigation.navigate('InvoiceGeneration' as never, { 
              companyId, 
              companyName 
            } as never)}
          >
            <Ionicons name="document-text" size={24} color={theme.colors.text.primary} />
            <Text style={styles.quickActionTitle}>Generate Invoice</Text>
            <Text style={styles.quickActionSubtitle}>Create monthly invoice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={handleRecordPayment}>
            <Ionicons name="card" size={24} color={theme.colors.text.primary} />
            <Text style={styles.quickActionTitle}>Record Payment</Text>
            <Text style={styles.quickActionSubtitle}>Manual payment entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('invoices')}>
            <Ionicons name="list" size={24} color={theme.colors.text.primary} />
            <Text style={styles.quickActionTitle}>View Invoices</Text>
            <Text style={styles.quickActionSubtitle}>All invoice history</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={() => navigation.navigate('BillingSettings' as never, { 
              companyId, 
              companyName 
            } as never)}
          >
            <Ionicons name="settings" size={24} color={theme.colors.text.primary} />
            <Text style={styles.quickActionTitle}>Billing Settings</Text>
            <Text style={styles.quickActionSubtitle}>Configure billing</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(quickStats.totalInvoices)}</Text>
            <Text style={styles.statLabel}>Total Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(quickStats.totalPayments)}</Text>
            <Text style={styles.statLabel}>Total Payments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: quickStats.overdueInvoices > 0 ? '#EF4444' : theme.colors.text.primary }]}>
              {String(quickStats.overdueInvoices)}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(quickStats.recentPayments)}</Text>
            <Text style={styles.statLabel}>Recent Payments</Text>
            <Text style={styles.statSubLabel}>Last 30 days</Text>
          </View>
        </View>
      </View>

      {/* Monthly Overview with Charts */}
      <MonthlyOverview 
        companyId={companyId}
        showHeader={false}
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'invoices':
        return (
          <View style={styles.fullHeightTabContent}>
            <InvoicesList 
              companyId={companyId}
              onInvoicePress={(invoice) => {
                // Navigate to invoice detail or handle selection
                Alert.alert(
                  `Invoice ${invoice.invoice_number}`,
                  `Amount: ${companyBillingService.formatCurrency(invoice.billing_amount)}\nStatus: ${invoice.status.toUpperCase()}`
                );
              }}
            />
          </View>
        );
      case 'payments':
        return (
          <View style={styles.fullHeightTabContent}>
            <PaymentHistory companyId={companyId} />
          </View>
        );
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.frame} />
      
      {/* Credit Alerts Notification */}
      <CreditAlertsNotification 
        companyId={companyId}
        onAlertPress={(alert) => {
          Alert.alert(
            alert.category.replace('_', ' ').toUpperCase(),
            alert.message,
            [
              { text: 'Dismiss', style: 'cancel' },
              ...(alert.action_required ? [
                { 
                  text: 'Take Action', 
                  onPress: () => {
                    if (alert.category === 'credit_limit') {
                      navigation.navigate('PartialPayment' as never, { companyId, companyName } as never);
                    }
                  }
                }
              ] : [])
            ]
          );
        }}
      />
      
      {/* Enhanced Header with Navigation */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Billing Dashboard</Text>
            <Text style={styles.headerSubtitle}>{companyName}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('BillingSettings' as never)}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'invoices' && styles.activeTabButton]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'invoices' && styles.activeTabButtonText]}>
            Invoices
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payments' && styles.activeTabButton]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'payments' && styles.activeTabButtonText]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'overview' ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.text.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.frame,
  },
  headerContainer: {
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.frame,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: theme.colors.canvas,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: theme.colors.text.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabButtonText: {
    color: theme.colors.canvas,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
    gap: 24,
  },
  fullHeightTabContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  quickActionsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.light,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  quickStatsSection: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.light,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  chartSection: {
    gap: 16,
  },
  chartPlaceholder: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    ...theme.shadows.light,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.frame,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});