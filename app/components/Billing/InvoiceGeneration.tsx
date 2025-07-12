import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { isCompanyUser } from '../../types/user';

interface InvoiceGenerationProps {
  companyId: string;
  companyName: string;
  onInvoiceGenerated?: (invoiceId: string) => void;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
}

interface InvoicePreview {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
}

export default function InvoiceGeneration({ companyId, companyName, onInvoiceGenerated }: InvoiceGenerationProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  const { user, company } = state;

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'custom'>('current');
  const [invoicePreview, setInvoicePreview] = useState<InvoicePreview | null>(null);

  // Mock data for demonstration
  const mockLineItems: InvoiceLineItem[] = [
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
  ];

  const generateInvoicePreview = async () => {
    setLoading(true);
    try {
      // Simulate API call to generate invoice
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const subtotal = mockLineItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;
      
      const preview: InvoicePreview = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        lineItems: mockLineItems,
        subtotal,
        tax,
        total,
        notes: `Invoice for ${selectedPeriod} period orders. Payment terms: NET 30 days.`
      };
      
      setInvoicePreview(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice preview');
    } finally {
      setLoading(false);
    }
  };

  const confirmInvoiceGeneration = async () => {
    if (!invoicePreview) return;
    
    setLoading(true);
    try {
      // Simulate API call to create actual invoice
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Invoice Generated',
        `Invoice ${invoicePreview.invoiceNumber} has been generated successfully.`,
        [
          {
            text: 'View Invoice',
            onPress: () => {
              setShowPreview(false);
              navigation.navigate('InvoiceViewer' as never, { 
                invoiceId: invoicePreview.invoiceNumber 
              } as never);
            }
          },
          {
            text: 'Done',
            onPress: () => {
              setShowPreview(false);
              if (onInvoiceGenerated) {
                onInvoiceGenerated(invoicePreview.invoiceNumber);
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Billing Period</Text>
      <Text style={styles.sectionDescription}>Select the period for which to generate the invoice</Text>
      
      <View style={styles.periodOptions}>
        <TouchableOpacity
          style={[styles.periodOption, selectedPeriod === 'current' && styles.selectedPeriodOption]}
          onPress={() => setSelectedPeriod('current')}
        >
          <View style={styles.periodOptionContent}>
            <Ionicons 
              name={selectedPeriod === 'current' ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={selectedPeriod === 'current' ? theme.colors.text.primary : theme.colors.text.secondary} 
            />
            <View style={styles.periodOptionText}>
              <Text style={styles.periodOptionTitle}>Current Month</Text>
              <Text style={styles.periodOptionSubtitle}>December 2024 (In Progress)</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodOption, selectedPeriod === 'previous' && styles.selectedPeriodOption]}
          onPress={() => setSelectedPeriod('previous')}
        >
          <View style={styles.periodOptionContent}>
            <Ionicons 
              name={selectedPeriod === 'previous' ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={selectedPeriod === 'previous' ? theme.colors.text.primary : theme.colors.text.secondary} 
            />
            <View style={styles.periodOptionText}>
              <Text style={styles.periodOptionTitle}>Previous Month</Text>
              <Text style={styles.periodOptionSubtitle}>November 2024 (Completed)</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodOption, selectedPeriod === 'custom' && styles.selectedPeriodOption]}
          onPress={() => setSelectedPeriod('custom')}
        >
          <View style={styles.periodOptionContent}>
            <Ionicons 
              name={selectedPeriod === 'custom' ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={selectedPeriod === 'custom' ? theme.colors.text.primary : theme.colors.text.secondary} 
            />
            <View style={styles.periodOptionText}>
              <Text style={styles.periodOptionTitle}>Custom Range</Text>
              <Text style={styles.periodOptionSubtitle}>Select specific date range</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvoicePreviewModal = () => (
    <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" />
        
        {/* Modal Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
          <View style={styles.modalHeaderContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPreview(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invoice Preview</Text>
            <View style={styles.headerRight} />
          </View>
        </View>

        {invoicePreview && (
          <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceHeaderLeft}>
                <Text style={styles.invoiceNumber}>{invoicePreview.invoiceNumber}</Text>
                <Text style={styles.invoiceDate}>Issue Date: {invoicePreview.issueDate}</Text>
                <Text style={styles.invoiceDate}>Due Date: {invoicePreview.dueDate}</Text>
              </View>
              <View style={styles.invoiceHeaderRight}>
                <Text style={styles.companyNameLarge}>{companyName}</Text>
                <Text style={styles.invoiceStatus}>DRAFT</Text>
              </View>
            </View>

            {/* Line Items */}
            <View style={styles.lineItemsSection}>
              <Text style={styles.lineItemsTitle}>Items & Services</Text>
              {invoicePreview.lineItems.map((item) => (
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
                <Text style={styles.totalAmount}>${invoicePreview.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (8%)</Text>
                <Text style={styles.totalAmount}>${invoicePreview.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalAmount}>${invoicePreview.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoicePreview.notes}</Text>
            </View>
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setShowPreview(false)}
          >
            <Text style={styles.previewButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.generateButton}
            onPress={confirmInvoiceGeneration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.canvas} />
            ) : (
              <Text style={styles.generateButtonText}>Generate Invoice</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Company account required.</Text>
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
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Invoice</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.companyCard}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>Company ID: {companyId}</Text>
            <Text style={styles.companyDetails}>Credit Terms: NET 30</Text>
          </View>
        </View>

        {renderPeriodSelector()}

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Items</Text>
              <Text style={styles.summaryValue}>4 orders</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Amount</Text>
              <Text style={styles.summaryValue}>$8,497.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%)</Text>
              <Text style={styles.summaryValue}>$679.76</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalSummaryRow]}>
              <Text style={styles.totalSummaryLabel}>Estimated Total</Text>
              <Text style={styles.totalSummaryValue}>$9,176.76</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.previewInvoiceButton}
            onPress={generateInvoicePreview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.canvas} />
            ) : (
              <>
                <Ionicons name="eye" size={20} color={theme.colors.canvas} />
                <Text style={styles.previewInvoiceButtonText}>Preview Invoice</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.actionNote}>
            Review the invoice details before generating the final invoice
          </Text>
        </View>
      </ScrollView>

      {renderInvoicePreviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.frame,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  companyCard: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  periodOptions: {
    gap: 12,
  },
  periodOption: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPeriodOption: {
    borderColor: theme.colors.text.primary,
  },
  periodOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  periodOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  periodOptionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  totalSummaryRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
    marginTop: 8,
    paddingTop: 16,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  totalSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  actionSection: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  previewInvoiceButton: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewInvoiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
  actionNote: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.frame,
  },
  modalHeader: {
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.frame,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.frame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  
  // Invoice Preview Styles
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  companyNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  invoiceStatus: {
    backgroundColor: theme.colors.text.secondary,
    color: theme.colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemsSection: {
    backgroundColor: theme.colors.canvas,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  lineItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
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
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: theme.colors.canvas,
    borderTopWidth: 1,
    borderTopColor: theme.colors.frame,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.frame,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  generateButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.text.primary,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.canvas,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});