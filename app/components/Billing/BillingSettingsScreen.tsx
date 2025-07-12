import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';
import { BillingSettingsScreen as BillingSettings } from './BillingSettings';
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';

export default function BillingSettingsScreen() {
  const navigation = useNavigation();
  const { state } = useContext(AppContext);
  const { user, company } = state;

  const handleSave = (settings: any) => {
    // Handle settings save - could trigger API call here
    if (__DEV__) console.log('Settings saved:', settings);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Access denied. Company account required to view billing settings.
        </Text>
      </View>
    );
  }

  return (
    <BillingSettings
      companyId={company.id}
      companyName={company.name}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}

const styles = StyleSheet.create({
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