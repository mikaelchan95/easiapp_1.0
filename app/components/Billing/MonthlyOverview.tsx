import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  orders: number;
  avgOrderValue: number;
  creditUsed: number;
  paymentsReceived: number;
}

interface MonthlyOverviewProps {
  companyId: string;
  showHeader?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48; // Account for padding

// Mock data for demonstration
const mockMonthlyData: MonthlyData[] = [
  {
    month: 'Jan',
    revenue: 85000,
    expenses: 12000,
    orders: 156,
    avgOrderValue: 545,
    creditUsed: 15000,
    paymentsReceived: 70000,
  },
  {
    month: 'Feb',
    revenue: 92000,
    expenses: 11500,
    orders: 168,
    avgOrderValue: 548,
    creditUsed: 18000,
    paymentsReceived: 85000,
  },
  {
    month: 'Mar',
    revenue: 78000,
    expenses: 13200,
    orders: 142,
    avgOrderValue: 549,
    creditUsed: 22000,
    paymentsReceived: 65000,
  },
  {
    month: 'Apr',
    revenue: 105000,
    expenses: 14800,
    orders: 195,
    avgOrderValue: 538,
    creditUsed: 28000,
    paymentsReceived: 90000,
  },
  {
    month: 'May',
    revenue: 118000,
    expenses: 16200,
    orders: 218,
    avgOrderValue: 541,
    creditUsed: 25000,
    paymentsReceived: 105000,
  },
  {
    month: 'Jun',
    revenue: 95000,
    expenses: 15100,
    orders: 175,
    avgOrderValue: 543,
    creditUsed: 30000,
    paymentsReceived: 88000,
  },
];

export default function MonthlyOverview({
  companyId,
  showHeader = true,
}: MonthlyOverviewProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<
    'revenue' | 'orders' | 'credit'
  >('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'ytd'>(
    '6m'
  );

  useEffect(() => {
    loadMonthlyData();
  }, [companyId, selectedPeriod]);

  const loadMonthlyData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter data based on selected period
      let filteredData = mockMonthlyData;
      if (selectedPeriod === '6m') {
        filteredData = mockMonthlyData.slice(-6);
      } else if (selectedPeriod === 'ytd') {
        filteredData = mockMonthlyData; // Assuming current year data
      }

      setData(filteredData);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (item: MonthlyData, metric: string) => {
    switch (metric) {
      case 'revenue':
        return item.revenue;
      case 'orders':
        return item.orders;
      case 'credit':
        return item.creditUsed;
      default:
        return item.revenue;
    }
  };

  const getMaxValue = (metric: string) => {
    return Math.max(...data.map(item => getMetricValue(item, metric)));
  };

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'revenue':
      case 'credit':
        return `$${(value / 1000).toFixed(0)}k`;
      case 'orders':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.chartLoadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    const maxValue = getMaxValue(selectedMetric);
    const chartHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisLabel}>
              {formatValue(maxValue, selectedMetric)}
            </Text>
            <Text style={styles.axisLabel}>
              {formatValue(maxValue * 0.75, selectedMetric)}
            </Text>
            <Text style={styles.axisLabel}>
              {formatValue(maxValue * 0.5, selectedMetric)}
            </Text>
            <Text style={styles.axisLabel}>
              {formatValue(maxValue * 0.25, selectedMetric)}
            </Text>
            <Text style={styles.axisLabel}>0</Text>
          </View>

          {/* Chart bars */}
          <View style={styles.barsContainer}>
            <View style={styles.bars}>
              {data.map((item, index) => {
                const value = getMetricValue(item, selectedMetric);
                const height = (value / maxValue) * chartHeight;

                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.monthLabel}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (loading || data.length === 0) return null;

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
    const totalCreditUsed = data.reduce(
      (sum, item) => sum + item.creditUsed,
      0
    );
    const avgOrderValue = totalRevenue / totalOrders;

    return (
      <View style={styles.summaryStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${(totalRevenue / 1000).toFixed(0)}k
          </Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <View style={styles.statTrend}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={[styles.trendText, { color: '#10B981' }]}>+12.5%</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{String(totalOrders)}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
          <View style={styles.statTrend}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={[styles.trendText, { color: '#10B981' }]}>+8.3%</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${String(avgOrderValue.toFixed(0))}
          </Text>
          <Text style={styles.statLabel}>Avg Order Value</Text>
          <View style={styles.statTrend}>
            <Ionicons name="trending-down" size={16} color="#EF4444" />
            <Text style={[styles.trendText, { color: '#EF4444' }]}>-2.1%</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${(totalCreditUsed / 1000).toFixed(0)}k
          </Text>
          <Text style={styles.statLabel}>Credit Used</Text>
          <View style={styles.statTrend}>
            <Ionicons name="trending-up" size={16} color="#F59E0B" />
            <Text style={[styles.trendText, { color: '#F59E0B' }]}>+15.2%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Overview</Text>
          <Text style={styles.subtitle}>Financial performance analytics</Text>
        </View>
      )}

      {/* Period Selection */}
      <View style={styles.periodSelector}>
        {(['6m', '12m', 'ytd'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.activePeriodButtonText,
              ]}
            >
              {period === '6m'
                ? '6 Months'
                : period === '12m'
                  ? '12 Months'
                  : 'Year to Date'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric Selection */}
      <View style={styles.metricSelector}>
        {(['revenue', 'orders', 'credit'] as const).map(metric => (
          <TouchableOpacity
            key={metric}
            style={[
              styles.metricButton,
              selectedMetric === metric && styles.activeMetricButton,
            ]}
            onPress={() => setSelectedMetric(metric)}
          >
            <Text
              style={[
                styles.metricButtonText,
                selectedMetric === metric && styles.activeMetricButtonText,
              ]}
            >
              {metric === 'revenue'
                ? 'Revenue'
                : metric === 'orders'
                  ? 'Orders'
                  : 'Credit Used'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Summary Statistics */}
      {renderSummaryStats()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 16,
    padding: 24,
    ...theme.shadows.medium,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: theme.colors.frame,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: theme.colors.canvas,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activePeriodButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  metricSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.frame,
  },
  activeMetricButton: {
    backgroundColor: theme.colors.text.primary,
  },
  metricButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeMetricButtonText: {
    color: theme.colors.canvas,
    fontWeight: '600',
  },
  chartLoadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  chartContainer: {
    height: 250,
    marginBottom: 20,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    marginLeft: 8,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    backgroundColor: theme.colors.text.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 8,
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.frame,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
