import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyAddress: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  paymentTerms: string;
  creditTerms: string;
}

export default function InvoiceViewer() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get invoiceId from route params
  const { invoiceId } = route.params as { invoiceId: string };
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock invoice data
  const mockInvoice: Invoice = {
    id: invoiceId,
    invoiceNumber: invoiceId,
    companyName: 'EASI Solutions Pte Ltd',
    companyAddress: '123 Business Ave, #12-34\nSingapore 123456\nGST: 123456789M',
    issueDate: '2024-12-15',
    dueDate: '2025-01-14',
    status: 'sent',
    paymentTerms: 'NET 30',
    creditTerms: 'Company Credit Account',
    notes: 'Thank you for your business. Payment is due within 30 days of invoice date.',
    lineItems: [
      {
        id: '1',
        description: 'Industrial Equipment Order #ORD-2024-001234',
        quantity: 15,
        unitPrice: 245.00,
        total: 3675.00,
        date: '2024-12-01'
      },
      {
        id: '2',
        description: 'Premium Tools Package #ORD-2024-001235',
        quantity: 8,
        unitPrice: 189.50,
        total: 1516.00,
        date: '2024-12-03'
      },
      {
        id: '3',
        description: 'Safety Equipment Bulk Order #ORD-2024-001236',
        quantity: 25,
        unitPrice: 67.80,
        total: 1695.00,
        date: '2024-12-05'
      },
      {
        id: '4',
        description: 'Maintenance Supplies #ORD-2024-001237',
        quantity: 12,
        unitPrice: 134.25,
        total: 1611.00,
        date: '2024-12-08'
      },
    ],
    subtotal: 8497.00,
    tax: 679.76,
    total: 9176.76,
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInvoice(mockInvoice);
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'sent':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      case 'draft':
        return '#6B7280';
      case 'cancelled':
        return '#8B5CF6';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'PAID';
      case 'sent':
        return 'SENT';
      case 'overdue':
        return 'OVERDUE';
      case 'draft':
        return 'DRAFT';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  const handleShareInvoice = async () => {
    try {
      await Share.share({
        message: `Invoice ${invoice?.invoiceNumber}\nTotal: $${invoice?.total.toFixed(2)}\nDue: ${invoice?.dueDate}`,
        title: `Invoice ${invoice?.invoiceNumber}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handleDownloadPDF = () => {
    Alert.alert(
      'Download PDF',
      'This feature would generate and download a PDF version of the invoice.',
      [{ text: 'OK' }]
    );
  };

  const handleSendReminder = () => {
    Alert.alert(
      'Send Reminder',
      'Send a payment reminder email for this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Alert.alert('Success', 'Payment reminder sent successfully');
          }
        }
      ]
    );
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Mark as Paid',
      'Mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => {
            if (invoice) {
              setInvoice({ ...invoice, status: 'paid' });
              Alert.alert('Success', 'Invoice marked as paid');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={48} color={theme.colors.text.secondary} />
        <Text style={styles.errorText}>Invoice not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
      
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Invoice {invoice.invoiceNumber}</Text>
            <Text style={styles.headerSubtitle}>{invoice.companyName}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareInvoice}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceHeaderLeft}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Issue Date: {invoice.issueDate}</Text>
            <Text style={styles.invoiceDate}>Due Date: {invoice.dueDate}</Text>
          </View>
          <View style={styles.invoiceHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
              <Text style={styles.statusText}>{getStatusText(invoice.status)}</Text>
            </View>
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.companyInfo}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.companyName}>{invoice.companyName}</Text>
          <Text style={styles.companyAddress}>{invoice.companyAddress}</Text>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Terms:</Text>
            <Text style={styles.paymentValue}>{invoice.paymentTerms}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Credit Terms:</Text>
            <Text style={styles.paymentValue}>{invoice.creditTerms}</Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.lineItemsSection}>
          <Text style={styles.sectionTitle}>Items & Services</Text>
          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.lineItemMain}>
                <Text style={styles.lineItemDescription}>{item.description}</Text>
                <Text style={styles.lineItemDate}>{item.date}</Text>
              </View>
              <View style={styles.lineItemAmounts}>
                <Text style={styles.lineItemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.lineItemPrice}>${item.unitPrice.toFixed(2)} ea</Text>
                <Text style={styles.lineItemTotal}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (8%)</Text>
            <Text style={styles.totalAmount}>${invoice.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPDF}>
            <Ionicons name="download-outline" size={20} color={theme.colors.text.primary} />
            <Text style={styles.actionButtonText}>Download PDF</Text>
          </TouchableOpacity>

          {invoice.status !== 'paid' && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleSendReminder}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.text.primary} />
                <Text style={styles.actionButtonText}>Send Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryActionButton} onPress={handleMarkAsPaid}>
                <Ionicons name="checkmark" size={20} color={theme.colors.canvas} />
                <Text style={styles.primaryActionButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.frame,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.frame,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.frame,
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
  headerContainer: {
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  invoiceHeaderLeft: {},
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  invoiceHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
  companyInfo: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  companyAddress: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  paymentInfo: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  lineItemsSection: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  lineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
  },
  lineItemMain: {
    marginBottom: 8,
  },
  lineItemDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lineItemDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  lineItemAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemQuantity: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  lineItemPrice: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    flex: 1,
    textAlign: 'center',
  },
  lineItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
    marginTop: 8,
    paddingTop: 16,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  notesSection: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.frame,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
});