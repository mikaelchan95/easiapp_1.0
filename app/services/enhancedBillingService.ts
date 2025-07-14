import { supabase } from '../../utils/supabase';
import { realTimePaymentService, BalanceUpdate, PartialPaymentRequest, PaymentResult } from './realTimePaymentService';

// Types and Interfaces
export interface DashboardMetrics {
  creditSummary: {
    credit_limit: number;
    credit_used: number;
    available_credit: number;
    utilization_percentage: number;
    status: 'good' | 'warning' | 'critical';
  };
  paymentSummary: {
    total_payments_this_month: number;
    pending_payments: number;
    overdue_amount: number;
    next_payment_due: string | null;
  };
  invoiceSummary: {
    total_outstanding: number;
    invoice_count: number;
    average_invoice_age: number;
    oldest_invoice_date: string | null;
  };
  trends: {
    payment_velocity: number; // Days to pay on average
    credit_utilization_trend: 'increasing' | 'decreasing' | 'stable';
    monthly_spending_trend: number; // Percentage change
  };
}

export interface PaymentCalendarEvent {
  id: string;
  type: 'payment_due' | 'payment_received' | 'credit_adjustment';
  date: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  invoice_id?: string;
  payment_id?: string;
}

export interface CreditAlert {
  id: string;
  type: 'utilization_high' | 'credit_low' | 'payment_overdue' | 'credit_limit_exceeded';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  amount?: number;
  due_date?: string;
  created_at: string;
  acknowledged: boolean;
  action_required: boolean;
  action_url?: string;
}

export interface BillingPreferences {
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    payment_reminders: boolean;
    credit_alerts: boolean;
  };
  payment_settings: {
    auto_pay_enabled: boolean;
    auto_pay_threshold: number;
    preferred_payment_method: string;
    payment_terms: string;
  };
  report_settings: {
    monthly_statements: boolean;
    payment_confirmations: boolean;
    credit_reports: boolean;
    detailed_invoices: boolean;
  };
}

export interface LiveDashboardData {
  metrics: DashboardMetrics;
  recent_updates: BalanceUpdate[];
  upcoming_events: PaymentCalendarEvent[];
  active_alerts: CreditAlert[];
  is_live: boolean;
  last_updated: string;
}

export interface ServiceResult<T> {
  data?: T;
  error?: string;
  timestamp?: string;
}

class EnhancedBillingService {
  private activeSubscriptions: Map<string, any> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get live dashboard data with real-time metrics
   */
  async getLiveDashboard(companyId: string): Promise<ServiceResult<LiveDashboardData>> {
    try {
      if (!companyId) {
        return { error: 'Company ID is required' };
      }

      // Check cache first
      const cached = this.getFromCache(`dashboard_${companyId}`);
      if (cached) {
        return { data: cached, timestamp: new Date().toISOString() };
      }

      // Get company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return { error: 'Company not found' };
      }

      // Build dashboard metrics
      const metrics = await this.buildDashboardMetrics(companyId, company);
      
      // Get recent updates
      const recentUpdatesResult = await realTimePaymentService.getRecentBalanceUpdates(companyId, 5);
      const recentUpdates = recentUpdatesResult.data || [];

      // Get upcoming events
      const upcomingEvents = await this.getUpcomingEvents(companyId);

      // Get active alerts
      const activeAlerts = await this.getActiveAlerts(companyId);

      const dashboardData: LiveDashboardData = {
        metrics,
        recent_updates: recentUpdates,
        upcoming_events: upcomingEvents,
        active_alerts: activeAlerts,
        is_live: this.activeSubscriptions.has(companyId),
        last_updated: new Date().toISOString()
      };

      // Cache the result
      this.setCache(`dashboard_${companyId}`, dashboardData);

      return {
        data: dashboardData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting live dashboard:', error);
      return { error: 'Failed to load dashboard data' };
    }
  }

  /**
   * Start real-time monitoring for a company
   */
  async startRealTimeMonitoring(
    companyId: string,
    onUpdate: (update: BalanceUpdate) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      // Start the real-time payment service monitoring
      const success = await realTimePaymentService.startRealTimeMonitoring(
        companyId,
        (update: BalanceUpdate) => {
          // Clear cache when updates occur
          this.clearCacheForCompany(companyId);
          onUpdate(update);
        },
        onError
      );

      if (success) {
        this.activeSubscriptions.set(companyId, true);
      }

      return success;
    } catch (error) {
      console.error('Error starting real-time monitoring:', error);
      onError?.('Failed to start real-time monitoring');
      return false;
    }
  }

  /**
   * Stop real-time monitoring for a company
   */
  async stopRealTimeMonitoring(companyId: string): Promise<void> {
    try {
      await realTimePaymentService.stopRealTimeMonitoring(companyId);
      this.activeSubscriptions.delete(companyId);
      this.clearCacheForCompany(companyId);
    } catch (error) {
      console.error('Error stopping real-time monitoring:', error);
    }
  }

  /**
   * Process partial payment with real-time updates
   */
  async processPartialPaymentWithUpdates(
    paymentRequest: PartialPaymentRequest,
    onProgress?: (update: BalanceUpdate) => void
  ): Promise<ServiceResult<PaymentResult>> {
    try {
      // Clear cache for the company
      this.clearCacheForCompany(paymentRequest.company_id);

      // Use the real-time payment service to process the payment
      const result = await realTimePaymentService.processPaymentWithUpdates(
        paymentRequest,
        (update: BalanceUpdate) => {
          // Clear cache when updates occur
          this.clearCacheForCompany(paymentRequest.company_id);
          onProgress?.(update);
        }
      );

      return result;
    } catch (error) {
      console.error('Error processing partial payment:', error);
      return { error: 'Failed to process payment' };
    }
  }

  /**
   * Get credit alerts for a company
   */
  async getCreditAlerts(companyId: string): Promise<ServiceResult<CreditAlert[]>> {
    try {
      if (!companyId) {
        return { error: 'Company ID is required' };
      }

      // Check cache first
      const cached = this.getFromCache(`alerts_${companyId}`);
      if (cached) {
        return { data: cached, timestamp: new Date().toISOString() };
      }

      // Get company data to generate alerts
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return { error: 'Company not found' };
      }

      const alerts: CreditAlert[] = [];
      const availableCredit = company.credit_limit - company.credit_used;
      const utilizationPercentage = (company.credit_used / company.credit_limit) * 100;

      // High utilization alert
      if (utilizationPercentage >= 90) {
        alerts.push({
          id: `utilization_${companyId}_${Date.now()}`,
          type: 'utilization_high',
          severity: 'critical',
          title: 'High Credit Utilization',
          message: `Your credit utilization is at ${utilizationPercentage.toFixed(1)}%. Consider making a payment to avoid hitting your credit limit.`,
          amount: company.credit_used,
          created_at: new Date().toISOString(),
          acknowledged: false,
          action_required: true,
          action_url: '/billing/payments'
        });
      } else if (utilizationPercentage >= 75) {
        alerts.push({
          id: `utilization_${companyId}_${Date.now()}`,
          type: 'utilization_high',
          severity: 'warning',
          title: 'Moderate Credit Utilization',
          message: `Your credit utilization is at ${utilizationPercentage.toFixed(1)}%. Monitor your spending to maintain healthy credit levels.`,
          amount: company.credit_used,
          created_at: new Date().toISOString(),
          acknowledged: false,
          action_required: false
        });
      }

      // Low credit alert
      if (availableCredit < 5000 && availableCredit > 0) {
        alerts.push({
          id: `credit_low_${companyId}_${Date.now()}`,
          type: 'credit_low',
          severity: 'warning',
          title: 'Low Available Credit',
          message: `You have only ${this.formatCurrency(availableCredit)} in available credit remaining.`,
          amount: availableCredit,
          created_at: new Date().toISOString(),
          acknowledged: false,
          action_required: true,
          action_url: '/billing/payments'
        });
      }

      // Credit limit exceeded
      if (availableCredit < 0) {
        alerts.push({
          id: `credit_exceeded_${companyId}_${Date.now()}`,
          type: 'credit_limit_exceeded',
          severity: 'critical',
          title: 'Credit Limit Exceeded',
          message: `Your account is over the credit limit by ${this.formatCurrency(Math.abs(availableCredit))}. Immediate payment is required.`,
          amount: Math.abs(availableCredit),
          created_at: new Date().toISOString(),
          acknowledged: false,
          action_required: true,
          action_url: '/billing/payments'
        });
      }

      // Get overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('company_invoices')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'overdue');

      if (overdueInvoices && overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
        alerts.push({
          id: `overdue_${companyId}_${Date.now()}`,
          type: 'payment_overdue',
          severity: 'critical',
          title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`,
          message: `You have ${overdueInvoices.length} overdue invoice(s) totaling ${this.formatCurrency(totalOverdue)}.`,
          amount: totalOverdue,
          created_at: new Date().toISOString(),
          acknowledged: false,
          action_required: true,
          action_url: '/billing/invoices'
        });
      }

      // Cache the result
      this.setCache(`alerts_${companyId}`, alerts);

      return {
        data: alerts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting credit alerts:', error);
      return { error: 'Failed to load credit alerts' };
    }
  }

  /**
   * Get billing preferences for a company
   */
  async getBillingPreferences(companyId: string): Promise<ServiceResult<BillingPreferences>> {
    try {
      const { data, error } = await supabase
        .from('company_billing_preferences')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error getting billing preferences:', error);
        return { error: 'Failed to load billing preferences' };
      }

      // Return default preferences if none exist
      const defaultPreferences: BillingPreferences = {
        notification_settings: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          payment_reminders: true,
          credit_alerts: true
        },
        payment_settings: {
          auto_pay_enabled: false,
          auto_pay_threshold: 1000,
          preferred_payment_method: 'bank_transfer',
          payment_terms: 'NET30'
        },
        report_settings: {
          monthly_statements: true,
          payment_confirmations: true,
          credit_reports: false,
          detailed_invoices: true
        }
      };

      const preferences = data ? { ...defaultPreferences, ...data.preferences } : defaultPreferences;

      return {
        data: preferences,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting billing preferences:', error);
      return { error: 'Failed to load billing preferences' };
    }
  }

  /**
   * Update billing preferences for a company
   */
  async updateBillingPreferences(
    companyId: string,
    preferences: Partial<BillingPreferences>
  ): Promise<ServiceResult<BillingPreferences>> {
    try {
      const { data, error } = await supabase
        .from('company_billing_preferences')
        .upsert({
          company_id: companyId,
          preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating billing preferences:', error);
        return { error: 'Failed to update billing preferences' };
      }

      return {
        data: data.preferences,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating billing preferences:', error);
      return { error: 'Failed to update billing preferences' };
    }
  }

  /**
   * Build comprehensive dashboard metrics
   */
  private async buildDashboardMetrics(companyId: string, company: any): Promise<DashboardMetrics> {
    try {
      const availableCredit = company.credit_limit - company.credit_used;
      const utilizationPercentage = (company.credit_used / company.credit_limit) * 100;

      // Credit summary
      const creditSummary = {
        credit_limit: company.credit_limit,
        credit_used: company.credit_used,
        available_credit: availableCredit,
        utilization_percentage: utilizationPercentage,
        status: this.getCreditStatus(utilizationPercentage)
      };

      // Payment summary
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyPayments } = await supabase
        .from('company_payments')
        .select('amount')
        .eq('company_id', companyId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .eq('status', 'completed');

      const totalPaymentsThisMonth = monthlyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      const { data: pendingPayments } = await supabase
        .from('company_payments')
        .select('amount')
        .eq('company_id', companyId)
        .eq('status', 'pending');

      const pendingPaymentsCount = pendingPayments?.length || 0;

      const { data: overdueInvoices } = await supabase
        .from('company_invoices')
        .select('total_amount')
        .eq('company_id', companyId)
        .eq('status', 'overdue');

      const overdueAmount = overdueInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;

      const { data: nextDueInvoice } = await supabase
        .from('company_invoices')
        .select('due_date')
        .eq('company_id', companyId)
        .eq('status', 'outstanding')
        .order('due_date', { ascending: true })
        .limit(1);

      const paymentSummary = {
        total_payments_this_month: totalPaymentsThisMonth,
        pending_payments: pendingPaymentsCount,
        overdue_amount: overdueAmount,
        next_payment_due: nextDueInvoice?.[0]?.due_date || null
      };

      // Invoice summary
      const { data: outstandingInvoices } = await supabase
        .from('company_invoices')
        .select('total_amount, created_at')
        .eq('company_id', companyId)
        .in('status', ['outstanding', 'partial_paid']);

      const totalOutstanding = outstandingInvoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
      const invoiceCount = outstandingInvoices?.length || 0;
      
      const averageInvoiceAge = outstandingInvoices?.length > 0 
        ? outstandingInvoices.reduce((sum, invoice) => {
            const daysDiff = Math.floor((Date.now() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / outstandingInvoices.length
        : 0;

      const oldestInvoiceDate = outstandingInvoices?.length > 0
        ? outstandingInvoices.reduce((oldest, invoice) => {
            return new Date(invoice.created_at) < new Date(oldest.created_at) ? invoice : oldest;
          }).created_at
        : null;

      const invoiceSummary = {
        total_outstanding: totalOutstanding,
        invoice_count: invoiceCount,
        average_invoice_age: averageInvoiceAge,
        oldest_invoice_date: oldestInvoiceDate
      };

      // Trends (simplified for now)
      const trends = {
        payment_velocity: averageInvoiceAge, // Simplified
        credit_utilization_trend: this.getCreditTrend(utilizationPercentage),
        monthly_spending_trend: 0 // Simplified - would need historical data
      };

      return {
        creditSummary,
        paymentSummary,
        invoiceSummary,
        trends
      };
    } catch (error) {
      console.error('Error building dashboard metrics:', error);
      // Return default metrics on error
      return {
        creditSummary: {
          credit_limit: company.credit_limit || 0,
          credit_used: company.credit_used || 0,
          available_credit: (company.credit_limit || 0) - (company.credit_used || 0),
          utilization_percentage: 0,
          status: 'good'
        },
        paymentSummary: {
          total_payments_this_month: 0,
          pending_payments: 0,
          overdue_amount: 0,
          next_payment_due: null
        },
        invoiceSummary: {
          total_outstanding: 0,
          invoice_count: 0,
          average_invoice_age: 0,
          oldest_invoice_date: null
        },
        trends: {
          payment_velocity: 0,
          credit_utilization_trend: 'stable',
          monthly_spending_trend: 0
        }
      };
    }
  }

  /**
   * Get upcoming payment events
   */
  private async getUpcomingEvents(companyId: string): Promise<PaymentCalendarEvent[]> {
    try {
      const events: PaymentCalendarEvent[] = [];
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      // Get upcoming invoice due dates
      const { data: upcomingInvoices } = await supabase
        .from('company_invoices')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'outstanding')
        .gte('due_date', now.toISOString())
        .lte('due_date', thirtyDaysFromNow.toISOString())
        .order('due_date', { ascending: true });

      upcomingInvoices?.forEach(invoice => {
        events.push({
          id: `invoice_due_${invoice.id}`,
          type: 'payment_due',
          date: invoice.due_date,
          amount: invoice.total_amount,
          description: `Invoice ${invoice.invoice_number || invoice.id} due`,
          status: 'pending',
          invoice_id: invoice.id
        });
      });

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('company_payments')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      recentPayments?.forEach(payment => {
        events.push({
          id: `payment_${payment.id}`,
          type: 'payment_received',
          date: payment.created_at,
          amount: payment.amount,
          description: `Payment received: ${payment.reference || payment.id}`,
          status: payment.status === 'completed' ? 'completed' : 'pending',
          payment_id: payment.id
        });
      });

      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  /**
   * Get active alerts for the company
   */
  private async getActiveAlerts(companyId: string): Promise<CreditAlert[]> {
    const alertsResult = await this.getCreditAlerts(companyId);
    return alertsResult.data || [];
  }

  /**
   * Get credit status based on utilization percentage
   */
  private getCreditStatus(utilization: number): 'good' | 'warning' | 'critical' {
    if (utilization >= 90) return 'critical';
    if (utilization >= 75) return 'warning';
    return 'good';
  }

  /**
   * Get credit trend based on utilization
   */
  private getCreditTrend(utilization: number): 'increasing' | 'decreasing' | 'stable' {
    // Simplified - in real implementation, would compare with historical data
    return 'stable';
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount);
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCacheForCompany(companyId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(companyId));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    const companyIds = Array.from(this.activeSubscriptions.keys());
    for (const companyId of companyIds) {
      await this.stopRealTimeMonitoring(companyId);
    }
    this.cache.clear();
    console.log('🧹 Enhanced billing service cleanup completed');
  }
}

// Export singleton instance
export const enhancedBillingService = new EnhancedBillingService();

// Export class for testing
export { EnhancedBillingService };