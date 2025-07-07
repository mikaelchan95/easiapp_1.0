import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRewards } from '../../context/RewardsContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import AnimatedButton from '../UI/AnimatedButton';

interface VoucherSectionProps {
  subtotal: number;
  onApplyVoucher: (voucherId: string, value: number) => void;
  appliedVoucherId?: string | null;
}

export default function VoucherSection({ 
  subtotal, 
  onApplyVoucher, 
  appliedVoucherId 
}: VoucherSectionProps) {
  const { state, dispatch } = useRewards();
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(appliedVoucherId || null);
  
  const availableVouchers = state.userRewards.availableVouchers.filter(v => !v.used);
  const selectedVoucher = availableVouchers.find(v => v.id === selectedVoucherId);
  
  const handleSelectVoucher = (voucherId: string, value: number) => {
    setSelectedVoucherId(voucherId);
    onApplyVoucher(voucherId, value);
    setShowVoucherModal(false);
  };
  
  const handleRemoveVoucher = () => {
    setSelectedVoucherId(null);
    onApplyVoucher('', 0);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.text} />
            <Text style={styles.title}>Rewards Voucher</Text>
          </View>
          {selectedVoucher && (
            <TouchableOpacity onPress={handleRemoveVoucher}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {selectedVoucher ? (
          <View style={styles.appliedVoucher}>
            <View style={styles.voucherInfo}>
              <Text style={styles.voucherValue}>-S${selectedVoucher.value}</Text>
              <Text style={styles.voucherExpiry}>
                Expires {formatDate(selectedVoucher.expiryDate)}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addVoucherButton}
            onPress={() => setShowVoucherModal(true)}
          >
            <Text style={styles.addVoucherText}>
              {availableVouchers.length > 0 
                ? `${availableVouchers.length} voucher${availableVouchers.length > 1 ? 's' : ''} available`
                : 'No vouchers available'
              }
            </Text>
            {availableVouchers.length > 0 && (
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Voucher</Text>
            <TouchableOpacity 
              onPress={() => setShowVoucherModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {availableVouchers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No vouchers available</Text>
                <Text style={styles.emptySubtext}>
                  Earn more rewards points to redeem vouchers
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableVouchers}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const canUse = subtotal >= item.value;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.voucherCard,
                        !canUse && styles.voucherCardDisabled
                      ]}
                      onPress={() => canUse && handleSelectVoucher(item.id, item.value)}
                      disabled={!canUse}
                    >
                      <View style={styles.voucherCardContent}>
                        <View style={styles.voucherValueContainer}>
                          <Text style={[
                            styles.voucherCardValue,
                            !canUse && styles.textDisabled
                          ]}>
                            S${item.value}
                          </Text>
                          <Text style={[
                            styles.voucherCardLabel,
                            !canUse && styles.textDisabled
                          ]}>
                            OFF
                          </Text>
                        </View>
                        <View style={styles.voucherDetails}>
                          <Text style={[
                            styles.voucherCardTitle,
                            !canUse && styles.textDisabled
                          ]}>
                            Rewards Voucher
                          </Text>
                          <Text style={[
                            styles.voucherCardExpiry,
                            !canUse && styles.textDisabled
                          ]}>
                            Valid till {formatDate(item.expiryDate)}
                          </Text>
                          {!canUse && (
                            <Text style={styles.voucherMinimum}>
                              Min. order S${item.value} required
                            </Text>
                          )}
                        </View>
                      </View>
                      {canUse && (
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={COLORS.textSecondary} 
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <AnimatedButton
              label="Close"
              onPress={() => setShowVoucherModal(false)}
              type="secondary"
              fullWidth
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h4,
    marginLeft: SPACING.sm,
  },
  removeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontSize: 14,
  },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.success,
  },
  voucherExpiry: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  addVoucherButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  addVoucherText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  modalFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  
  // Voucher Card
  voucherCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  voucherCardDisabled: {
    opacity: 0.6,
  },
  voucherCardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  voucherValueContainer: {
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  voucherCardValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  voucherCardLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  voucherDetails: {
    flex: 1,
  },
  voucherCardTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.xs,
  },
  voucherCardExpiry: {
    ...TYPOGRAPHY.caption,
  },
  voucherMinimum: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  textDisabled: {
    color: COLORS.textSecondary,
  },
});