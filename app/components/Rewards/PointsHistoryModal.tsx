import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pointsService } from '../../services/pointsService';
import { PointsTransaction } from '../../types/user';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { formatNumber } from '../../utils/formatting';

interface PointsHistoryModalProps {
  visible: boolean;
  userId: string;
  companyId?: string;
  onClose: () => void;
}

interface GroupedTransaction {
  date: string;
  transactions: PointsTransaction[];
}

export const PointsHistoryModal: React.FC<PointsHistoryModalProps> = ({
  visible,
  userId,
  companyId,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadTransactions();
    }
  }, [visible, userId, companyId]);

  const loadTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      let pointsTransactions: PointsTransaction[] = [];
      
      if (companyId) {
        // Load company user transactions
        const companyTransactions = await pointsService.getUserCompanyPointsTransactions(userId, companyId);
        pointsTransactions = companyTransactions;
      } else {
        // Load individual user transactions - this would need to be implemented
        // For now, we'll use an empty array
        pointsTransactions = [];
      }

      setTransactions(pointsTransactions);
    } catch (err) {
      console.error('Error loading points transactions:', err);
      setError('Failed to load points history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadTransactions(true);
  };

  const groupTransactionsByDate = (transactions: PointsTransaction[]): GroupedTransaction[] => {
    const grouped: { [key: string]: PointsTransaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return Object.entries(grouped)
      .map(([date, transactions]) => ({ date, transactions }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getTransactionIcon = (type: PointsTransaction['transactionType']) => {
    switch (type) {
      case 'earned_purchase':
        return { name: 'card-outline', color: COLORS.success };
      case 'earned_bonus':
        return { name: 'gift-outline', color: COLORS.info };
      case 'redeemed_voucher':
        return { name: 'receipt-outline', color: COLORS.warning };
      case 'points_transfer_in':
        return { name: 'arrow-down-circle-outline', color: COLORS.success };
      case 'points_transfer_out':
        return { name: 'arrow-up-circle-outline', color: COLORS.error };
      case 'expired':
        return { name: 'time-outline', color: COLORS.textSecondary };
      case 'adjusted':
        return { name: 'settings-outline', color: COLORS.primary };
      default:
        return { name: 'ellipse-outline', color: COLORS.textSecondary };
    }
  };

  const getTransactionDescription = (transaction: PointsTransaction) => {
    const metadata = transaction.metadata || {};
    
    switch (transaction.transactionType) {
      case 'earned_purchase':
        return metadata.orderId 
          ? `Purchase reward - Order #${metadata.orderId}`
          : 'Purchase reward';
      case 'earned_bonus':
        return metadata.reason || 'Bonus points';
      case 'redeemed_voucher':
        return metadata.voucherCode 
          ? `Voucher redeemed - ${metadata.voucherCode}`
          : 'Voucher redemption';
      case 'points_transfer_in':
        return metadata.fromUser 
          ? `Transfer from ${metadata.fromUser}`
          : 'Points transfer received';
      case 'points_transfer_out':
        return metadata.toUser 
          ? `Transfer to ${metadata.toUser}`
          : 'Points transfer sent';
      case 'expired':
        return metadata.reason || 'Points expired';
      case 'adjusted':
        return metadata.reason || 'Points adjustment';
      default:
        return 'Points transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-SG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: PointsTransaction }) => {
    const icon = getTransactionIcon(item.transactionType);
    const isPositive = item.pointsAmount > 0;
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        
        <View style={styles.transactionContent}>
          <Text style={styles.transactionDescription}>
            {getTransactionDescription(item)}
          </Text>
          <Text style={styles.transactionTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.pointsAmount,
            { color: isPositive ? COLORS.success : COLORS.error }
          ]}>
            {isPositive ? '+' : ''}{formatNumber(item.pointsAmount)}
          </Text>
          <Text style={styles.balanceAfter}>
            Balance: {formatNumber(item.pointsBalanceAfter)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDateGroup = ({ item }: { item: GroupedTransaction }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{formatDate(item.date)}</Text>
      {item.transactions.map((transaction) => (
        <View key={transaction.id}>
          {renderTransaction({ item: transaction })}
        </View>
      ))}
    </View>
  );

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Points History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading points history...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadTransactions()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : groupedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Points History</Text>
            <Text style={styles.emptyText}>
              Your points transactions will appear here once you start earning or using points.
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedTransactions}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    ...TYPOGRAPHY.h6,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  pointsAmount: {
    ...TYPOGRAPHY.h6,
    fontWeight: '600',
    marginBottom: 2,
  },
  balanceAfter: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.card,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});