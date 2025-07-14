import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';
import { BillingDashboard } from './BillingDashboard';
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';

export default function BillingDashboardScreen() {
  const navigation = useNavigation();
  const { state } = useContext(AppContext);
  const { user, company, loading } = state;

  const handleNavigateToSettings = () => {
    // Navigate to billing settings - could be implemented later
    // navigation.navigate('BillingSettings');
  };

  // Show loading if we're still loading user/company data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading billing dashboard...</Text>
      </View>
    );
  }

  // Check if user exists and is a company user
  if (!user || !isCompanyUser(user)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Access denied. Company account required to view billing dashboard.
        </Text>
      </View>
    );
  }

  // Check if company data is available
  if (!company || !company.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Company data not available. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <BillingDashboard
      companyId={company.id}
      companyName={company.name}
      onNavigateToSettings={handleNavigateToSettings}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
