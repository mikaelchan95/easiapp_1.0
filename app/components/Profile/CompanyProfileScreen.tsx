import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';
import { isCompanyUser } from '../../types/user';
import { formatStatCurrency, formatPercentage } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';

export default function CompanyProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, updateCompanyProfile } = useContext(AppContext);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const { user, company } = state;

  const toggleSection = (section: string) => {
    HapticFeedback.light();
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleContactPress = async (
    type: 'email' | 'phone' | 'address',
    value: string
  ) => {
    HapticFeedback.light();

    if (type === 'email') {
      const emailUrl = `mailto:${value}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        Linking.openURL(emailUrl);
      }
    } else if (type === 'phone') {
      const phoneUrl = `tel:${value}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        Linking.openURL(phoneUrl);
      }
    } else if (type === 'address') {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(value)}`;
      const canOpen = await Linking.canOpenURL(mapsUrl);
      if (canOpen) {
        Linking.openURL(mapsUrl);
      }
    }
  };

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Profile</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.noDataText}>
            No company information available
          </Text>
        </View>
      </View>
    );
  }

  // currentCredit is what's AVAILABLE, not used
  const availableCredit = company.currentCredit || 0;
  const usedCredit = (company.creditLimit || 0) - availableCredit;
  const creditUtilization = company.creditLimit
    ? (usedCredit / company.creditLimit) * 100
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Profile</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Company Header Card - Now in header like ProfileScreen */}
        <View style={styles.headerCard}>
          <View style={styles.companyHeader}>
            <View style={styles.companyIconContainer}>
              <Ionicons name="business" size={32} color={COLORS.text} />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyLegal}>{company.companyName}</Text>
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.verificationText}>Verified Company</Text>
              </View>
            </View>
          </View>

          <View style={styles.companyMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>UEN</Text>
                <Text
                  style={styles.metaValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {company.uen}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text
                  style={[styles.metaValue, styles.statusActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {company.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Terms</Text>
                <Text
                  style={styles.metaValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {company.paymentTerms}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Credit Overview */}
        <View style={styles.creditWidget}>
          <View style={styles.creditHeader}>
            <View style={styles.creditTitleContainer}>
              <Ionicons name="card" size={24} color={COLORS.text} />
              <Text style={styles.widgetTitle}>Credit Overview</Text>
            </View>
            <View style={styles.creditStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      creditUtilization > 80
                        ? '#FF6B6B'
                        : creditUtilization > 60
                          ? '#FFA500'
                          : '#4CAF50',
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {creditUtilization > 80
                  ? 'High Usage'
                  : creditUtilization > 60
                    ? 'Moderate'
                    : 'Healthy'}
              </Text>
            </View>
          </View>

          <View style={styles.creditStatsRow}>
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>
                {formatStatCurrency(availableCredit)}
              </Text>
              <Text style={styles.creditLabel}>Available</Text>
            </View>
            <View style={styles.creditStatDivider} />
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>
                {formatStatCurrency(usedCredit)}
              </Text>
              <Text style={styles.creditLabel}>Used</Text>
            </View>
            <View style={styles.creditStatDivider} />
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>
                {formatStatCurrency(company.creditLimit || 0)}
              </Text>
              <Text style={styles.creditLabel}>Total Limit</Text>
            </View>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(creditUtilization, 100)}%`,
                    backgroundColor:
                      creditUtilization > 80
                        ? '#FF6B6B'
                        : creditUtilization > 60
                          ? '#FFA500'
                          : '#4CAF50',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {formatPercentage(creditUtilization)} credit utilization
            </Text>
          </View>

          {/* Credit Payment Actions */}
          {usedCredit > 0 && (
            <View style={styles.creditActions}>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => {
                  HapticFeedback.medium();
                  console.log('Credit payment button pressed');
                  console.log('Company data:', company);
                  console.log('User data:', user);
                  console.log('Navigation:', navigation);
                  try {
                    navigation.navigate('CreditPayment');
                    console.log('Navigation called successfully');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="card" size={20} color={COLORS.accent} />
                <Text style={styles.paymentButtonText}>
                  Pay Credit Balance ({formatStatCurrency(usedCredit)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.billingButton}
                onPress={() => {
                  HapticFeedback.light();
                  navigation.navigate('BillingDashboard');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="receipt"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.billingButtonText}>View Billing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Enhanced Quick Actions - Moved above Contact Information */}
        {user.permissions?.canEditCompanyInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  HapticFeedback.medium();
                  navigation.navigate('EditCompanyInfo');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={COLORS.text}
                  />
                </View>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  HapticFeedback.medium();
                  navigation.navigate('TeamManagement');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={COLORS.text}
                  />
                </View>
                <Text style={styles.actionText}>Team</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  HapticFeedback.medium();
                  navigation.navigate('CompanyReports');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={20}
                    color={COLORS.text}
                  />
                </View>
                <Text style={styles.actionText}>Reports</Text>
              </TouchableOpacity>

              {/* Admin Billing Dashboard - Only for users with billing permissions */}
              {user?.permissions?.canManageBilling && (
                <TouchableOpacity
                  style={[styles.actionCard, styles.adminActionCard]}
                  onPress={() => {
                    HapticFeedback.medium();
                    navigation.navigate('AdminBillingDashboard');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.actionIconContainer, styles.adminActionIcon]}
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={COLORS.accent}
                    />
                  </View>
                  <Text style={[styles.actionText, styles.adminActionText]}>
                    Billing
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Enhanced Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress('address', company.address)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="location" size={20} color={COLORS.text} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>{company.address}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {company.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleContactPress('phone', company.phone)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call" size={20} color={COLORS.text} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{company.phone}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}

            {company.email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleContactPress('email', company.email)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="mail" size={20} color={COLORS.text} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{company.email}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Enhanced Order Approval Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('approvals')}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Order Approval Settings</Text>
            <Ionicons
              name={
                expandedSections.includes('approvals')
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Require Approval</Text>
                <Text style={styles.settingDescription}>
                  Orders need approval before submission
                </Text>
              </View>
              <Switch
                value={company.approvalSettings.requireApproval}
                onValueChange={() =>
                  Alert.alert('Info', 'Contact support to change this setting')
                }
                trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {expandedSections.includes('approvals') &&
              company.approvalSettings.requireApproval && (
                <View style={styles.approvalDetails}>
                  <View style={styles.approvalItem}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalLabel}>
                        Approval Threshold
                      </Text>
                      <Text style={styles.approvalDescription}>
                        Orders above this amount need approval
                      </Text>
                    </View>
                    <Text style={styles.approvalValue}>
                      {formatStatCurrency(
                        company.approvalSettings.approvalThreshold || 0
                      )}
                    </Text>
                  </View>
                  <View style={styles.approvalItem}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalLabel}>
                        Auto-Approve Below
                      </Text>
                      <Text style={styles.approvalDescription}>
                        Orders below this amount are auto-approved
                      </Text>
                    </View>
                    <Text style={styles.approvalValue}>
                      {formatStatCurrency(
                        company.approvalSettings.autoApproveBelow || 0
                      )}
                    </Text>
                  </View>
                  <View style={styles.approvalItem}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalLabel}>
                        Multi-Level Approval
                      </Text>
                      <Text style={styles.approvalDescription}>
                        Requires multiple approvers
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.approvalValue,
                        {
                          color: company.approvalSettings.multiLevelApproval
                            ? '#4CAF50'
                            : COLORS.textSecondary,
                        },
                      ]}
                    >
                      {company.approvalSettings.multiLevelApproval
                        ? 'Enabled'
                        : 'Disabled'}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
    elevation: 4,
    paddingBottom: SPACING.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 44,
    height: 44,
  },

  // Header Card
  headerCard: {
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: 0,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.text,
  },
  companyLegal: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    ...TYPOGRAPHY.small,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
    marginRight: SPACING.sm,
  },
  statusActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  companyMeta: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  metaLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  metaValue: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Credit Widget
  creditWidget: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 6,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  creditTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  widgetTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
  },
  creditStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  creditStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  creditStat: {
    alignItems: 'center',
    flex: 1,
  },
  creditAmount: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    marginBottom: 6,
  },
  creditLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  creditStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  progressText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },

  // Contact Grid
  contactGrid: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOWS.light,
    elevation: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  contactText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  contactLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOWS.light,
    elevation: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  approvalDetails: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  approvalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  approvalInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  approvalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  approvalDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  approvalValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    ...SHADOWS.light,
    elevation: 4,
    minHeight: 70,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.text,
  },
  actionDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },

  // Admin-specific styles
  adminActionCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  adminActionIcon: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  adminActionText: {
    color: COLORS.primary,
  },
  adminActionDescription: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 100,
  },

  // Credit Payment Actions
  creditActions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  paymentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  paymentButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
  },
  billingButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billingButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
