import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { enhancedBillingService, CreditAlert } from '../../services/enhancedBillingService';
import { theme } from '../../utils/theme';

interface CreditAlertsNotificationProps {
  companyId: string;
  onAlertPress?: (alert: CreditAlert) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function CreditAlertsNotification({
  companyId,
  onAlertPress,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: CreditAlertsNotificationProps) {
  const [alerts, setAlerts] = useState<CreditAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    loadAlerts();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadAlerts, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [companyId, autoRefresh, refreshInterval]);

  useEffect(() => {
    if (alerts.length > 0) {
      animateIn();
    } else {
      animateOut();
    }
  }, [alerts]);

  const loadAlerts = async () => {
    try {
      const result = await enhancedBillingService.getCreditAlerts(companyId);
      if (result.data) {
        setAlerts(result.data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading credit alerts:', error);
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'critical': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.primary;
    }
  };

  const getAlertBackgroundColor = (type: string): string => {
    switch (type) {
      case 'critical': return theme.colors.errorBackground;
      case 'warning': return theme.colors.warningBackground;
      case 'info': return theme.colors.infoBackground;
      default: return theme.colors.primaryBackground;
    }
  };

  const handleAlertPress = (alert: CreditAlert) => {
    if (onAlertPress) {
      onAlertPress(alert);
    } else {
      // Default action: show alert details
      Alert.alert(
        `${getAlertIcon(alert.type)} ${alert.category.replace('_', ' ').toUpperCase()}`,
        alert.message,
        [
          { text: 'Dismiss', style: 'cancel' },
          ...(alert.action_required ? [{ text: 'Take Action', onPress: () => handleActionRequired(alert) }] : [])
        ]
      );
    }
  };

  const handleActionRequired = (alert: CreditAlert) => {
    // Handle different types of actions based on alert category
    switch (alert.category) {
      case 'credit_limit':
        Alert.alert(
          'Credit Limit Action Required',
          'Your credit utilization is high. Consider making a payment or requesting a credit limit increase.',
          [
            { text: 'Make Payment', onPress: () => { /* Navigate to payment screen */ } },
            { text: 'Request Increase', onPress: () => { /* Navigate to credit request */ } },
            { text: 'Later', style: 'cancel' }
          ]
        );
        break;
      case 'overdue_invoices':
        Alert.alert(
          'Overdue Invoices Action Required',
          'You have overdue invoices that require immediate payment.',
          [
            { text: 'View Invoices', onPress: () => { /* Navigate to invoices */ } },
            { text: 'Make Payment', onPress: () => { /* Navigate to payment screen */ } },
            { text: 'Later', style: 'cancel' }
          ]
        );
        break;
      default:
        Alert.alert('Action Required', alert.message);
    }
  };

  const dismissAlert = (alertIndex: number) => {
    setAlerts(prev => prev.filter((_, index) => index !== alertIndex));
  };

  const showAllAlerts = () => {
    setShowModal(true);
  };

  const hideAllAlerts = () => {
    setShowModal(false);
  };

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');
  const infoAlerts = alerts.filter(alert => alert.type === 'info');

  const getMostImportantAlert = (): CreditAlert | null => {
    if (criticalAlerts.length > 0) return criticalAlerts[0];
    if (warningAlerts.length > 0) return warningAlerts[0];
    if (infoAlerts.length > 0) return infoAlerts[0];
    return null;
  };

  const mostImportantAlert = getMostImportantAlert();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.alertCard,
            { backgroundColor: getAlertBackgroundColor(mostImportantAlert?.type || 'info') }
          ]}
          onPress={() => mostImportantAlert && handleAlertPress(mostImportantAlert)}
        >
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>
                {getAlertIcon(mostImportantAlert?.type || 'info')}
              </Text>
              <View style={styles.alertText}>
                <Text style={[styles.alertCategory, { color: getAlertColor(mostImportantAlert?.type || 'info') }]}>
                  {mostImportantAlert?.category.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.alertMessage} numberOfLines={2}>
                  {mostImportantAlert?.message}
                </Text>
              </View>
              {alerts.length > 1 && (
                <TouchableOpacity style={styles.countBadge} onPress={showAllAlerts}>
                  <Text style={styles.countText}>{alerts.length}</Text>
                </TouchableOpacity>
              )}
            </View>
            {mostImportantAlert?.action_required && (
              <View style={styles.actionIndicator}>
                <Text style={[styles.actionText, { color: getAlertColor(mostImportantAlert.type) }]}>
                  Action Required
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => dismissAlert(0)}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={hideAllAlerts}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Credit Alerts</Text>
            <TouchableOpacity onPress={hideAllAlerts}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {criticalAlerts.length > 0 && (
              <View style={styles.alertSection}>
                <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
                {criticalAlerts.map((alert, index) => (
                  <TouchableOpacity
                    key={`critical-${index}`}
                    style={[styles.modalAlertCard, { backgroundColor: getAlertBackgroundColor('critical') }]}
                    onPress={() => handleAlertPress(alert)}
                  >
                    <Text style={[styles.modalAlertCategory, { color: getAlertColor('critical') }]}>
                      {alert.category.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.modalAlertMessage}>{alert.message}</Text>
                    {alert.action_required && (
                      <Text style={[styles.modalActionRequired, { color: getAlertColor('critical') }]}>
                        Action Required
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {warningAlerts.length > 0 && (
              <View style={styles.alertSection}>
                <Text style={styles.sectionTitle}>⚠️ Warning Alerts</Text>
                {warningAlerts.map((alert, index) => (
                  <TouchableOpacity
                    key={`warning-${index}`}
                    style={[styles.modalAlertCard, { backgroundColor: getAlertBackgroundColor('warning') }]}
                    onPress={() => handleAlertPress(alert)}
                  >
                    <Text style={[styles.modalAlertCategory, { color: getAlertColor('warning') }]}>
                      {alert.category.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.modalAlertMessage}>{alert.message}</Text>
                    {alert.action_required && (
                      <Text style={[styles.modalActionRequired, { color: getAlertColor('warning') }]}>
                        Action Required
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {infoAlerts.length > 0 && (
              <View style={styles.alertSection}>
                <Text style={styles.sectionTitle}>ℹ️ Information Alerts</Text>
                {infoAlerts.map((alert, index) => (
                  <TouchableOpacity
                    key={`info-${index}`}
                    style={[styles.modalAlertCard, { backgroundColor: getAlertBackgroundColor('info') }]}
                    onPress={() => handleAlertPress(alert)}
                  >
                    <Text style={[styles.modalAlertCategory, { color: getAlertColor('info') }]}>
                      {alert.category.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.modalAlertMessage}>{alert.message}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    ...theme.shadows.medium,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  alertText: {
    flex: 1,
  },
  alertCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 18,
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionIndicator: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  dismissText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  alertSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalAlertCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  modalAlertCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalAlertMessage: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  modalActionRequired: {
    fontSize: 12,
    fontWeight: '600',
  },
});