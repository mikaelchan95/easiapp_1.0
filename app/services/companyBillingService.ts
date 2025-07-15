import supabaseService from './supabaseService';
import { synchronousBalanceService } from './synchronousBalanceService';

const { supabase } = supabaseService;

// ===== TypeScript Interfaces =====

export interface CompanyBillingStatus {
  id: string;
  company_id: string;
  company_name: string;
  credit_limit: number;
  credit_used: number;
  current_credit: number;
  credit_utilization: number;
  billing_status: 'good_standing' | 'warning' | 'critical' | 'overlimit';
  payment_terms: string;
  latest_invoice?: CompanyInvoice;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_date: string;
  payment_due_date: string;
  billing_amount: number;
  outstanding_amount?: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: string;
  invoice_items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CompanyPayment {
  id: string;
  company_id: string;
  invoice_id?: string;
  payment_amount: number;
  payment_method:
    | 'bank_transfer'
    | 'credit_card'
    | 'debit_card'
    | 'paypal'
    | 'cheque'
    | 'cash';
  payment_date: string;
  payment_reference?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingSettings {
  id: string;
  company_id: string;
  billing_frequency: string;
  billing_day_of_month: number;
  auto_billing_enabled: boolean;
  billing_email?: string;
  cc_emails?: string[];
  send_reminders: boolean;
  reminder_days_before: number[];
  late_fee_enabled: boolean;
  late_fee_type: 'percentage' | 'fixed';
  late_fee_amount: number;
  grace_period_days: number;
  created_at: string;
  updated_at: string;
}

export interface CreditAlert {
  id: string;
  company_id: string;
  category:
    | 'credit_limit'
    | 'payment_overdue'
    | 'invoice_generated'
    | 'payment_failed';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_required: boolean;
  acknowledged: boolean;
  created_at: string;
}

export interface BillingAnalytics {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  average_payment_time: number;
  monthly_trends: {
    month: string;
    invoiced: number;
    paid: number;
  }[];
}

// ===== Query Options Interfaces =====

interface InvoiceQueryOptions {
  limit?: number;
  offset?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface PaymentQueryOptions {
  limit?: number;
  offset?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// ===== Service Response Types =====

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

// ===== Company Billing Service =====

class CompanyBillingService {
  // ===== Company Credit Management =====

  async getCompanyBillingStatus(
    companyId: string
  ): Promise<ServiceResponse<CompanyBillingStatus>> {
    try {
      if (!companyId || typeof companyId !== 'string') {
        return { data: null, error: 'Invalid company ID provided' };
      }

      // Use synchronous service for consistent balance data
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_company_balance_summary', {
        p_company_id: companyId
      });

      if (summaryError || !summaryData) {
        return { data: null, error: 'Company not found or access denied' };
      }

      // Get latest invoice
      const { data: latestInvoice } = await supabase
        .from('company_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const result: CompanyBillingStatus = {
        id: companyId,
        company_id: companyId,
        company_name: summaryData.company_name,
        credit_limit: summaryData.credit_limit,
        credit_used: summaryData.credit_used,
        current_credit: summaryData.available_credit,
        credit_utilization: summaryData.credit_utilization,
        billing_status: summaryData.status,
        payment_terms: 'NET30',
        latest_invoice: latestInvoice || undefined,
        created_at: new Date().toISOString(),
        updated_at: summaryData.last_updated,
      };

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch billing status' };
    }
  }

  async updateCompanyCredit(
    companyId: string,
    creditUsed: number
  ): Promise<ServiceResponse<CompanyBillingStatus>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ credit_used: creditUsed })
        .eq('id', companyId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Return updated billing status
      return this.getCompanyBillingStatus(companyId);
    } catch (error) {
      console.error('Error updating company credit:', error);
      return { data: null, error: 'Failed to update company credit' };
    }
  }

  // ===== Invoice Operations =====

  async getCompanyInvoices(
    companyId: string,
    options: InvoiceQueryOptions = {}
  ): Promise<ServiceResponse<CompanyInvoice[]>> {
    try {
      let query = supabase
        .from('company_invoices')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.startDate) {
        query = query.gte('invoice_date', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('invoice_date', options.endDate);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 20) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message, count: 0 };
      }

      return { data: data || [], error: null, count: count || 0 };
    } catch (error) {
      console.error('Error fetching company invoices:', error);
      return { data: null, error: 'Failed to fetch invoices', count: 0 };
    }
  }

  async generateMonthlyInvoice(
    companyId: string,
    month: number,
    year: number
  ): Promise<ServiceResponse<CompanyInvoice>> {
    try {
      // Get company orders for the month
      const startDate = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('company_id', companyId)
        .eq('status', 'delivered')
        .gte('delivered_at', startDate)
        .lte('delivered_at', endDate);

      if (ordersError) {
        return { data: null, error: ordersError.message };
      }

      if (!orders || orders.length === 0) {
        return {
          data: null,
          error: 'No completed orders found for this period',
        };
      }

      // Calculate total amount
      const totalAmount = orders.reduce(
        (sum, order) => sum + order.final_total,
        0
      );

      // Generate invoice number
      const invoiceNumber = `INV-${year}-${month.toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('company_invoices')
        .insert({
          company_id: companyId,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          payment_due_date: this.calculateDueDate('NET30'),
          billing_amount: totalAmount,
          outstanding_amount: totalAmount,
          status: 'pending',
          payment_terms: 'NET30',
        })
        .select()
        .single();

      if (invoiceError) {
        return { data: null, error: invoiceError.message };
      }

      return { data: invoice, error: null };
    } catch (error) {
      console.error('Error generating monthly invoice:', error);
      return { data: null, error: 'Failed to generate invoice' };
    }
  }

  // ===== Payment Processing =====

  async getCompanyPayments(
    companyId: string,
    options: PaymentQueryOptions = {}
  ): Promise<ServiceResponse<CompanyPayment[]>> {
    try {
      let query = supabase
        .from('company_payments')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('payment_date', { ascending: false });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.startDate) {
        query = query.gte('payment_date', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('payment_date', options.endDate);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 20) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message, count: 0 };
      }

      return { data: data || [], error: null, count: count || 0 };
    } catch (error) {
      console.error('Error fetching company payments:', error);
      return { data: null, error: 'Failed to fetch payments', count: 0 };
    }
  }

  async recordPayment(
    companyId: string,
    paymentData: {
      amount: number;
      method: CompanyPayment['payment_method'];
      reference?: string;
      invoiceId?: string;
      notes?: string;
    }
  ): Promise<ServiceResponse<CompanyPayment>> {
    try {
      // First record the payment
      const { data: payment, error } = await supabase
        .from('company_payments')
        .insert({
          company_id: companyId,
          invoice_id: paymentData.invoiceId,
          payment_amount: paymentData.amount,
          payment_method: paymentData.method,
          payment_date: new Date().toISOString().split('T')[0],
          payment_reference: paymentData.reference,
          status: 'confirmed',
          notes: paymentData.notes,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Apply payment to balance atomically
      const balanceResult = await synchronousBalanceService.applyPaymentToCompany(
        companyId,
        payment.id,
        paymentData.amount,
        paymentData.notes || `Payment via ${paymentData.method}`
      );

      if (!balanceResult.success) {
        // Rollback payment if balance update fails
        await supabase
          .from('company_payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);
        
        return { data: null, error: balanceResult.error };
      }

      return { data: payment, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to record payment' };
    }
  }

  // ===== Billing Settings =====

  async getBillingSettings(
    companyId: string
  ): Promise<ServiceResponse<BillingSettings>> {
    try {
      const { data, error } = await supabase
        .from('company_billing_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, return default settings
        const defaultSettings: BillingSettings = {
          id: '',
          company_id: companyId,
          billing_frequency: 'monthly',
          billing_day_of_month: 1,
          auto_billing_enabled: false,
          send_reminders: true,
          reminder_days_before: [7, 3, 1],
          late_fee_enabled: false,
          late_fee_type: 'percentage',
          late_fee_amount: 5,
          grace_period_days: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { data: defaultSettings, error: null };
      }

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      return { data: null, error: 'Failed to fetch billing settings' };
    }
  }

  async updateBillingSettings(
    companyId: string,
    settings: Partial<BillingSettings>
  ): Promise<ServiceResponse<BillingSettings>> {
    try {
      const { data, error } = await supabase
        .from('company_billing_settings')
        .upsert({
          company_id: companyId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating billing settings:', error);
      return { data: null, error: 'Failed to update billing settings' };
    }
  }

  // ===== Credit Alerts =====

  async getCreditAlerts(
    companyId: string
  ): Promise<ServiceResponse<CreditAlert[]>> {
    try {
      const { data, error } = await supabase
        .from('company_credit_alerts')
        .select('*')
        .eq('company_id', companyId)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching credit alerts:', error);
      return { data: null, error: 'Failed to fetch credit alerts' };
    }
  }

  async acknowledgeAlert(alertId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('company_credit_alerts')
        .update({ acknowledged: true })
        .eq('id', alertId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { data: null, error: 'Failed to acknowledge alert' };
    }
  }

  // ===== Analytics =====

  async getBillingAnalytics(
    companyId: string
  ): Promise<ServiceResponse<BillingAnalytics>> {
    try {
      // Get invoice totals
      const { data: invoiceData } = await supabase
        .from('company_invoices')
        .select(
          'billing_amount, outstanding_amount, status, payment_due_date, invoice_date'
        )
        .eq('company_id', companyId);

      // Get payment totals
      const { data: paymentData } = await supabase
        .from('company_payments')
        .select('payment_amount, payment_date, status')
        .eq('company_id', companyId)
        .eq('status', 'confirmed');

      const totalInvoiced =
        invoiceData?.reduce((sum, inv) => sum + inv.billing_amount, 0) || 0;
      const totalPaid =
        paymentData?.reduce((sum, pay) => sum + pay.payment_amount, 0) || 0;
      const totalOutstanding =
        invoiceData?.reduce(
          (sum, inv) => sum + (inv.outstanding_amount || 0),
          0
        ) || 0;

      // Calculate average payment time (simplified)
      const averagePaymentTime = 15; // Default to 15 days

      // Generate monthly trends (last 6 months)
      const monthlyTrends = this.generateMonthlyTrends(
        invoiceData || [],
        paymentData || []
      );

      const analytics: BillingAnalytics = {
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        total_outstanding: totalOutstanding,
        average_payment_time: averagePaymentTime,
        monthly_trends: monthlyTrends,
      };

      return { data: analytics, error: null };
    } catch (error) {
      console.error('Error fetching billing analytics:', error);
      return { data: null, error: 'Failed to fetch analytics' };
    }
  }

  // ===== Utility Methods =====

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  }

  isInvoiceOverdue(dueDateString: string): boolean {
    if (!dueDateString) return false;
    try {
      const dueDate = new Date(dueDateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    } catch {
      return false;
    }
  }

  getDaysUntilDue(dueDateString: string): number {
    if (!dueDateString) return 0;
    try {
      const dueDate = new Date(dueDateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Amber
      case 'overdue':
      case 'failed':
        return '#EF4444'; // Red
      case 'cancelled':
        return '#6B7280'; // Gray
      default:
        return '#3B82F6'; // Blue
    }
  }

  private calculateDueDate(paymentTerms: string): string {
    const today = new Date();
    let daysToAdd = 30; // Default NET30

    switch (paymentTerms) {
      case 'NET7':
        daysToAdd = 7;
        break;
      case 'NET15':
        daysToAdd = 15;
        break;
      case 'NET30':
        daysToAdd = 30;
        break;
      case 'NET60':
        daysToAdd = 60;
        break;
      case 'NET90':
        daysToAdd = 90;
        break;
      default:
        daysToAdd = 30;
    }

    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysToAdd);
    return dueDate.toISOString().split('T')[0];
  }

  private generateMonthlyTrends(
    invoices: any[],
    payments: any[]
  ): BillingAnalytics['monthly_trends'] {
    const trends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM

      const monthInvoiced = invoices
        .filter(inv => inv.invoice_date?.startsWith(monthKey))
        .reduce((sum, inv) => sum + inv.billing_amount, 0);

      const monthPaid = payments
        .filter(pay => pay.payment_date?.startsWith(monthKey))
        .reduce((sum, pay) => sum + pay.payment_amount, 0);

      trends.push({
        month: date.toLocaleDateString('en-SG', {
          year: 'numeric',
          month: 'short',
        }),
        invoiced: monthInvoiced,
        paid: monthPaid,
      });
    }

    return trends;
  }
}

// Export singleton instance
const companyBillingService = new CompanyBillingService();
export default companyBillingService;
