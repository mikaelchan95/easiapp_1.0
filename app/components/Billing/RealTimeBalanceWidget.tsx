import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  realTimePaymentService,
  BalanceUpdate,
} from '../../services/realTimePaymentService';
import { enhancedBillingService } from '../../services/enhancedBillingService';
import { theme } from '../../utils/theme';

interface RealTimeBalanceWidgetProps {
  companyId: string;
  companyName: string;
  onBalancePress?: () => void;
}

interface BalanceData {
  credit_limit: number;
  credit_used: number;
  available_credit: number;
  utilization_percentage: number;
  status: 'good' | 'warning' | 'critical';
  last_updated: string;
}

export default function RealTimeBalanceWidget({
  companyId,
  companyName,
  onBalancePress,
}: RealTimeBalanceWidgetProps) {
  // Validate required props
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    console.error(
      '❌ RealTimeBalanceWidget: Invalid companyId provided:',
      companyId
    );
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Invalid company ID for balance widget
        </Text>
      </View>
    );
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<BalanceUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  useFocusEffect(
    useCallback(() => {
      loadBalanceData();
      setupRealTimeMonitoring();

      return () => {
        enhancedBillingService.stopRealTimeMonitoring(companyId);
      };
    }, [companyId])
  );

  const loadBalanceData = async () => {
    try {
      const result = await enhancedBillingService.getLiveDashboard(companyId);
      if (result.data) {
        setBalanceData({
          credit_limit: result.data.metrics.creditSummary.credit_limit,
          credit_used: result.data.metrics.creditSummary.credit_used,
          available_credit: result.data.metrics.creditSummary.available_credit,
          utilization_percentage:
            result.data.metrics.creditSummary.utilization_percentage,
          status: result.data.metrics.creditSummary.status,
          last_updated: new Date().toISOString(),
        });
        setIsLive(result.data.is_live);
        setRecentUpdates(result.data.recent_updates || []);
      }
    } catch (error) {
      console.error('Error loading balance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealTimeMonitoring = async () => {
    setConnectionStatus('connecting');

    const success = await enhancedBillingService.startRealTimeMonitoring(
      companyId,
      (update: BalanceUpdate) => {
        handleBalanceUpdate(update);
      },
      error => {
        console.error('Real-time monitoring error:', error);
        setConnectionStatus('disconnected');
      }
    );

    if (success) {
      setConnectionStatus('connected');
      setIsLive(true);
    } else {
      setConnectionStatus('disconnected');
    }
  };

  const handleBalanceUpdate = (update: BalanceUpdate) => {
    if (__DEV__) console.log('Received balance update:', update);

    // Update balance data
    setBalanceData(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        available_credit: update.new_balance,
        credit_used: prev.credit_limit - update.new_balance,
        utilization_percentage:
          ((prev.credit_limit - update.new_balance) / prev.credit_limit) * 100,
        status: getBalanceStatus(
          ((prev.credit_limit - update.new_balance) / prev.credit_limit) * 100
        ),
        last_updated: update.timestamp,
      };
    });

    // Add to recent updates
    setRecentUpdates(prev => [update, ...prev.slice(0, 4)]);
  };

  const getBalanceStatus = (
    utilization: number
  ): 'good' | 'warning' | 'critical' => {
    if (utilization >= 90) return 'critical';
    if (utilization >= 75) return 'warning';
    return 'good';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBalanceData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'critical':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getConnectionStatusColor = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return theme.colors.success;
      case 'connecting':
        return theme.colors.warning;
      case 'disconnected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getConnectionStatusText = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading balance data...</Text>
      </View>
    );
  }

  if (!balanceData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load balance data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBalanceData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TouchableOpacity style={styles.balanceCard} onPress={onBalancePress}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.cardTitle}>Credit Balance</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getConnectionStatusColor() },
              ]}
            />
            <Text
              style={[styles.statusText, { color: getConnectionStatusColor() }]}
            >
              {getConnectionStatusText()}
            </Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Credit</Text>
            <Text
              style={[
                styles.balanceAmount,
                { color: getStatusColor(balanceData.status) },
              ]}
            >
              {formatCurrency(balanceData.available_credit)}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(balanceData.utilization_percentage, 100)}%`,
                    backgroundColor: getStatusColor(balanceData.status),
                  },
                ]}
              />
            </View>
            <Text style={styles.utilizationText}>
              {balanceData.utilization_percentage.toFixed(1)}% utilized
            </Text>
          </View>

          <View style={styles.creditDetails}>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Credit Limit:</Text>
              <Text style={styles.creditValue}>
                {formatCurrency(balanceData.credit_limit)}
              </Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Credit Used:</Text>
              <Text style={styles.creditValue}>
                {formatCurrency(balanceData.credit_used)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.lastUpdated}>
            Last updated: {formatTime(balanceData.last_updated)}
          </Text>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Real-time</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {recentUpdates.length > 0 && (
        <View style={styles.updatesCard}>
          <Text style={styles.updatesTitle}>Recent Activity</Text>
          {recentUpdates.slice(0, 3).map((update, index) => (
            <View key={index} style={styles.updateItem}>
              <View style={styles.updateContent}>
                <Text style={styles.updateType}>
                  {update.update_type.replace('_', ' ')}
                </Text>
                <Text style={styles.updateAmount}>
                  {update.amount > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(update.amount))}
                </Text>
              </View>
              <Text style={styles.updateTime}>
                {formatTime(update.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 32,
    ...theme.shadows.medium,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 32,
    ...theme.shadows.medium,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    margin: 16,
    padding: 20,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  creditDetails: {
    gap: 8,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  creditValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  updatesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    ...theme.shadows.light,
  },
  updatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  updateItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  updateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  updateType: {
    fontSize: 14,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  updateAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  updateTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
