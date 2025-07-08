import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';
import { isCompanyUser } from '../../types/user';
import { formatStatCurrency, formatPercentage } from '../../utils/formatting';

export default function CompanyProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, updateCompanyProfile } = useContext(AppContext);
  
  const { user, company } = state;

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.headerContainer}>
          <MobileHeader 
            title="Company Profile" 
            showBackButton={true} 
            showSearch={false}
            showCartButton={false}
          />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.noDataText}>No company information available</Text>
        </View>
      </View>
    );
  }

  // currentCredit is what's AVAILABLE, not used
  const availableCredit = company.currentCredit || 0;
  const usedCredit = (company.creditLimit || 0) - availableCredit;
  const creditUtilization = company.creditLimit ? 
    (usedCredit / company.creditLimit) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      
      <View style={styles.headerContainer}>
        <MobileHeader 
          title="Company Profile" 
          showBackButton={true} 
          showSearch={false}
          showCartButton={false}
        />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.companyIconContainer}>
            <Ionicons name="business" size={24} color={COLORS.text} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyLegal}>{company.companyName}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verificationText}>Verified</Text>
              <Text style={styles.uenText}>UEN: {company.uen}</Text>
            </View>
          </View>
        </View>

        {/* Credit Overview - Modern Widget */}
        <View style={styles.creditWidget}>
          <Text style={styles.widgetTitle}>Credit Overview</Text>
          
          <View style={styles.creditStatsRow}>
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>${Math.round(availableCredit / 1000)}k</Text>
              <Text style={styles.creditLabel}>Available</Text>
            </View>
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>${Math.round((company.creditLimit || 0) / 1000)}k</Text>
              <Text style={styles.creditLabel}>Limit</Text>
            </View>
            <View style={styles.creditStat}>
              <Text style={styles.creditAmount}>{company.paymentTerms}</Text>
              <Text style={styles.creditLabel}>Terms</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${creditUtilization}%`,
                    backgroundColor: creditUtilization > 80 ? '#FF6B6B' : 
                                   creditUtilization > 60 ? '#FFA500' : '#4CAF50'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {formatPercentage(creditUtilization)} credit utilization
            </Text>
          </View>
        </View>

        {/* Contact Information Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactGrid}>
            <View style={styles.contactItem}>
              <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>{company.address}</Text>
              </View>
            </View>
            
            {company.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={20} color={COLORS.textSecondary} />
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{company.phone}</Text>
                </View>
              </View>
            )}
            
            {company.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{company.email}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Approval Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Approval Settings</Text>
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
                onValueChange={() => Alert.alert('Info', 'Contact support to change this setting')}
                trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {company.approvalSettings.requireApproval && (
              <View style={styles.approvalDetails}>
                <View style={styles.approvalItem}>
                  <Text style={styles.approvalLabel}>Approval Threshold</Text>
                  <Text style={styles.approvalValue}>
                    {formatStatCurrency(company.approvalSettings.approvalThreshold || 0)}
                  </Text>
                </View>
                <View style={styles.approvalItem}>
                  <Text style={styles.approvalLabel}>Auto-Approve Below</Text>
                  <Text style={styles.approvalValue}>
                    {formatStatCurrency(company.approvalSettings.autoApproveBelow || 0)}
                  </Text>
                </View>
                <View style={styles.approvalItem}>
                  <Text style={styles.approvalLabel}>Multi-Level Approval</Text>
                  <Text style={styles.approvalValue}>
                    {company.approvalSettings.multiLevelApproval ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        {user.permissions?.canEditCompanyInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => Alert.alert('Edit Company', 'Feature coming soon')}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={24} color={COLORS.text} />
                <Text style={styles.actionText}>Edit Info</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => Alert.alert('Team Management', 'Feature coming soon')}
                activeOpacity={0.7}
              >
                <Ionicons name="people-outline" size={24} color={COLORS.text} />
                <Text style={styles.actionText}>Manage Team</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => Alert.alert('Reports', 'Feature coming soon')}
                activeOpacity={0.7}
              >
                <Ionicons name="bar-chart-outline" size={24} color={COLORS.text} />
                <Text style={styles.actionText}>View Reports</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  statusBarSpacer: {
    backgroundColor: COLORS.card,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  companyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyLegal: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    ...TYPOGRAPHY.small,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    marginRight: SPACING.sm,
  },
  uenText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },

  // Credit Widget
  creditWidget: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  widgetTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    marginBottom: SPACING.md,
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
    fontWeight: '700',
    marginBottom: 4,
  },
  creditLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
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

  // Contact Grid
  contactGrid: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  contactText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  contactLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.light,
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
  approvalLabel: {
    ...TYPOGRAPHY.body,
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
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...SHADOWS.light,
  },
  actionText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  bottomPadding: {
    height: 100,
  },
});