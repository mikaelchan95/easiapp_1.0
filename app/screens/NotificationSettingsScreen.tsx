import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useNotifications();
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  if (!settings) return null;

  const toggleSwitch = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleTimeChange = (
    event: any,
    selectedDate?: Date,
    type?: 'start' | 'end'
  ) => {
    if (type === 'start') setShowStartTime(false);
    else setShowEndTime(false);

    if (selectedDate && type) {
      const timeString = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      updateSettings({
        [type === 'start' ? 'quietHoursStart' : 'quietHoursEnd']: timeString,
      });
    }
  };

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSwitchItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: () => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3A3A3C', true: '#34C759' }}
        thumbColor={'#FFFFFF'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderSectionHeader('Channels')}
        <View style={styles.section}>
          {renderSwitchItem(
            'Push Notifications',
            'Receive alerts on your device',
            settings.pushEnabled,
            () => toggleSwitch('pushEnabled')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Email Notifications',
            'Receive updates via email',
            settings.emailEnabled,
            () => toggleSwitch('emailEnabled')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'SMS Notifications',
            'Receive urgent alerts via SMS',
            settings.smsEnabled,
            () => toggleSwitch('smsEnabled')
          )}
        </View>

        {renderSectionHeader('Notification Types')}
        <View style={styles.section}>
          {renderSwitchItem(
            'Order Updates',
            'Status changes, delivery updates',
            settings.orderUpdates,
            () => toggleSwitch('orderUpdates')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Payment Alerts',
            'Payment confirmations, refunds',
            settings.paymentAlerts,
            () => toggleSwitch('paymentAlerts')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Approvals',
            'Order approval requests',
            settings.approvalRequests,
            () => toggleSwitch('approvalRequests')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Credit Warnings',
            'Low balance and limit alerts',
            settings.creditWarnings,
            () => toggleSwitch('creditWarnings')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Billing',
            'Invoices and due dates',
            settings.billingReminders,
            () => toggleSwitch('billingReminders')
          )}
          <View style={styles.separator} />
          {renderSwitchItem(
            'Marketing',
            'Promotions and offers',
            settings.marketingNotifications,
            () => toggleSwitch('marketingNotifications')
          )}
        </View>

        {renderSectionHeader('Quiet Hours')}
        <View style={styles.section}>
          {renderSwitchItem(
            'Enabled',
            'Pause notifications during specific times',
            settings.quietHoursEnabled,
            () => toggleSwitch('quietHoursEnabled')
          )}

          {settings.quietHoursEnabled && (
            <>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.timeItem}
                onPress={() => setShowStartTime(true)}
              >
                <Text style={styles.settingTitle}>Start Time</Text>
                <Text style={styles.timeValue}>{settings.quietHoursStart}</Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.timeItem}
                onPress={() => setShowEndTime(true)}
              >
                <Text style={styles.settingTitle}>End Time</Text>
                <Text style={styles.timeValue}>{settings.quietHoursEnd}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {(showStartTime || showEndTime) && (
          <DateTimePicker
            value={parseTime(
              showStartTime ? settings.quietHoursStart : settings.quietHoursEnd
            )}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, date) =>
              handleTimeChange(e, date, showStartTime ? 'start' : 'end')
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  separator: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginLeft: 16,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  timeValue: {
    fontSize: 16,
    color: '#0A84FF',
  },
});

export default NotificationSettingsScreen;
