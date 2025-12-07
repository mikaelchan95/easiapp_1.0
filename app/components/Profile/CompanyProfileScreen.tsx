import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Linking,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';
import { formatStatCurrency, formatPercentage } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';

export default function CompanyProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'approvals',
  ]);

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
      if (canOpen) Linking.openURL(emailUrl);
    } else if (type === 'phone') {
      const phoneUrl = `tel:${value}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) Linking.openURL(phoneUrl);
    } else if (type === 'address') {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(value)}`;
      const canOpen = await Linking.canOpenURL(mapsUrl);
      if (canOpen) Linking.openURL(mapsUrl);
    }
  };

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Profile</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="business-outline" size={48} color={COLORS.inactive} />
          <Text style={styles.noDataText}>
            No company information available
          </Text>
        </View>
      </View>
    );
  }

  // Credit Calculations
  const creditLimit = company.creditLimit || 0;
  const usedCredit = company.currentCredit || 0; // currentCredit represents the used amount
  const availableCredit = Math.max(0, creditLimit - usedCredit);

  const creditUtilization =
    creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;

  // Determine credit health status
  const getCreditStatus = (utilization: number) => {
    if (utilization > 90) return { label: 'Critical', color: '#FF3B30' };
    if (utilization > 75) return { label: 'High Usage', color: '#FF9500' };
    if (utilization > 50) return { label: 'Moderate', color: '#FFCC00' };
    return { label: 'Healthy', color: '#34C759' };
  };

  const creditStatus = getCreditStatus(creditUtilization);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Profile</Text>
          {user.permissions?.canEditCompanyInfo ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditCompanyInfo')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Identity Section */}
        <View style={styles.companyIdentity}>
          <View style={styles.logoContainer}>
            {company.logo ? (
              // If you have an Image component, use it here. For now using placeholder icon
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>
                  {company.name.substring(0, 1)}
                </Text>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons
                  name="business"
                  size={32}
                  color={COLORS.textSecondary}
                />
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.card} />
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#34C759"
                style={styles.verifiedIconInner}
              />
            </View>
          </View>

          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.legalName}>{company.companyName}</Text>
            <View style={styles.metaTags}>
              <View style={styles.metaTag}>
                <Text style={styles.metaTagText}>UEN: {company.uen}</Text>
              </View>
              <View
                style={[
                  styles.metaTag,
                  {
                    backgroundColor:
                      company.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metaTagText,
                    {
                      color:
                        company.status === 'active' ? '#2E7D32' : '#C62828',
                    },
                  ]}
                >
                  {company.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Credit Overview Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Credit Overview</Text>
          <View style={styles.creditCard}>
            <View style={styles.creditHeader}>
              <View>
                <Text style={styles.creditLabel}>Available Credit</Text>
                <Text style={styles.creditAmount}>
                  {formatStatCurrency(availableCredit)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: creditStatus.color + '20' },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: creditStatus.color }]}
                >
                  {creditStatus.label}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(creditUtilization, 100)}%`,
                      backgroundColor: creditStatus.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  Used: {formatStatCurrency(usedCredit)}
                </Text>
                <Text style={styles.progressLabel}>
                  Limit: {formatStatCurrency(creditLimit)}
                </Text>
              </View>
            </View>

            <View style={styles.creditDivider} />

            <View style={styles.creditFooter}>
              <Text style={styles.termsText}>
                Payment Terms:{' '}
                <Text style={styles.termsValue}>
                  {company.paymentTerms || 'N/A'}
                </Text>
              </Text>

              {user.permissions?.canManageBilling && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PaymentHistory')}
                  style={styles.historyLink}
                >
                  <Text style={styles.historyLinkText}>View History</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          {user.permissions?.canManageUsers && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('TeamManagement')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="people" size={24} color="#1565C0" />
              </View>
              <Text style={styles.actionLabel}>Team</Text>
            </TouchableOpacity>
          )}

          {user.permissions?.canViewReports && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CompanyReports')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="bar-chart" size={24} color="#7B1FA2" />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
          )}

          {user.permissions?.canManageBilling && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('BillingDashboard')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="receipt" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.actionLabel}>Invoices</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleContactPress('email', 'support@easiapp.com')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="headset" size={24} color="#EF6C00" />
            </View>
            <Text style={styles.actionLabel}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Contact Information</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => handleContactPress('address', company.address)}
            >
              <View style={styles.infoIconBox}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={COLORS.text}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{company.address}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.inactive}
              />
            </TouchableOpacity>

            <View style={styles.separator} />

            {company.phone && (
              <>
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleContactPress('phone', company.phone!)}
                >
                  <View style={styles.infoIconBox}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={COLORS.text}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{company.phone}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.inactive}
                  />
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            {company.email && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleContactPress('email', company.email!)}
              >
                <View style={styles.infoIconBox}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.text} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{company.email}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.inactive}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings & Configuration */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Order Settings</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => toggleSection('approvals')}
              activeOpacity={0.7}
            >
              <View
                style={[styles.infoIconBox, { backgroundColor: '#FAFAFA' }]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={COLORS.text}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Approval Required</Text>
                <Text style={styles.infoValue}>
                  {company.approvalSettings.requireApproval
                    ? 'Enabled'
                    : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={company.approvalSettings.requireApproval}
                onValueChange={() =>
                  Alert.alert(
                    'Permission Required',
                    'Please contact your administrator to change approval settings.'
                  )
                }
                trackColor={{ false: COLORS.inactive, true: COLORS.primary }}
                thumbColor={'#FFFFFF'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </TouchableOpacity>

            {expandedSections.includes('approvals') &&
              company.approvalSettings.requireApproval && (
                <View style={styles.expandedContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Threshold Amount</Text>
                    <Text style={styles.detailValue}>
                      {formatStatCurrency(
                        company.approvalSettings.approvalThreshold || 0
                      )}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Auto-Approve Below</Text>
                    <Text style={styles.detailValue}>
                      {formatStatCurrency(
                        company.approvalSettings.autoApproveBelow || 0
                      )}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Multi-Level Approval</Text>
                    <Text style={styles.detailValue}>
                      {company.approvalSettings.multiLevelApproval
                        ? 'Yes'
                        : 'No'}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  // Header
  headerContainer: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Scroll Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },

  // Company Identity
  companyIdentity: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIconInner: {
    position: 'absolute',
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  legalName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  metaTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  metaTag: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaTagText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Section Styling
  sectionContainer: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },

  // Credit Card
  creditCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  creditLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  creditAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  creditDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  creditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termsText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  termsValue: {
    fontWeight: '600',
    color: COLORS.text,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyLinkText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Info Cards (Contact & Settings)
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md + 36 + SPACING.md, // Align with text
  },

  // Expanded Content
  expandedContent: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40', // Very light border
  },
  detailLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.text,
  },
});
