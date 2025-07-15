import { supabase } from '../../utils/supabase';

// Types and Interfaces
export interface BalanceUpdate {
  update_type:
    | 'payment_received'
    | 'payment_allocated'
    | 'credit_adjustment'
    | 'invoice_created';
  amount: number;
  new_balance: number;
  timestamp: string;
  transaction_id?: string;
  invoice_id?: string;
  reference?: string;
  description?: string;
}

export interface PaymentAllocation {
  invoice_id: string;
  invoice_number: string;
  original_amount: number;
  allocated_amount: number;
  remaining_amount: number;
}

export interface PaymentAllocationResult {
  allocations: PaymentAllocation[];
  total_allocated: number;
  remaining_payment: number;
  strategy_used: 'oldest_first' | 'largest_first' | 'manual';
}

export interface PartialPaymentRequest {
  company_id: string;
  payment_amount: number;
  payment_method: string;
  payment_reference: string;
  bank_reference?: string;
  allocation_strategy: 'oldest_first' | 'largest_first' | 'manual';
  notes?: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  transaction_id?: string;
  allocated_invoices?: number;
  total_allocated?: number;
  remaining_balance?: number;
  error?: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  available_credit?: number;
  current_balance?: number;
}

export interface RealTimeSubscription {
  subscription_id: string;
  company_id: string;
  status: 'connected' | 'disconnected' | 'error';
  last_heartbeat: string;
  connection_count: number;
}

export interface ServiceResult<T> {
  data?: T;
  error?: string;
  timestamp?: string;
}

class RealTimePaymentService {
  private subscriptions: Map<string, any> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  /**
   * Calculate payment allocation based on strategy
   */
  async calculatePaymentAllocation(
    companyId: string,
    paymentAmount: number,
    strategy: 'oldest_first' | 'largest_first' | 'manual'
  ): Promise<ServiceResult<PaymentAllocationResult>> {
    try {
      if (!companyId || paymentAmount <= 0) {
        return { error: 'Invalid company ID or payment amount' };
      }

      // Get outstanding invoices for the company
      const { data: invoices, error: invoicesError } = await supabase
        .from('company_invoices')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'outstanding')
        .order('created_at', { ascending: true });

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        return { error: 'Failed to fetch outstanding invoices' };
      }

      if (!invoices || invoices.length === 0) {
        return {
          data: {
            allocations: [],
            total_allocated: 0,
            remaining_payment: paymentAmount,
            strategy_used: strategy,
          },
        };
      }

      // Apply allocation strategy
      const allocations = this.applyAllocationStrategy(
        invoices,
        paymentAmount,
        strategy
      );
      const totalAllocated = allocations.reduce(
        (sum, allocation) => sum + allocation.allocated_amount,
        0
      );

      return {
        data: {
          allocations,
          total_allocated: totalAllocated,
          remaining_payment: paymentAmount - totalAllocated,
          strategy_used: strategy,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating payment allocation:', error);
      return { error: 'Failed to calculate payment allocation' };
    }
  }

  /**
   * Validate payment before processing
   */
  async validatePayment(
    companyId: string,
    paymentAmount: number,
    paymentMethod: string
  ): Promise<ServiceResult<PaymentValidationResult>> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!companyId || typeof companyId !== 'string') {
        errors.push('Invalid company ID');
      }

      if (!paymentAmount || paymentAmount <= 0) {
        errors.push('Payment amount must be greater than zero');
      }

      if (!paymentMethod || typeof paymentMethod !== 'string') {
        errors.push('Payment method is required');
      }

      // Get company credit information
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('credit_limit, credit_used, status')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        errors.push('Company not found or inactive');
        return {
          data: {
            valid: false,
            errors,
            warnings,
          },
        };
      }

      const availableCredit = company.credit_limit - company.credit_used;
      const currentBalance = company.credit_used;

      // Check company status
      if (company.status !== 'active') {
        errors.push('Company account is not active');
      }

      // Warnings for large payments
      if (paymentAmount > availableCredit * 0.8) {
        warnings.push('Payment amount is close to available credit limit');
      }

      if (paymentAmount > 50000) {
        warnings.push(
          'Large payment amount - additional verification may be required'
        );
      }

      return {
        data: {
          valid: errors.length === 0,
          errors,
          warnings,
          available_credit: availableCredit,
          current_balance: currentBalance,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error validating payment:', error);
      return { error: 'Failed to validate payment' };
    }
  }

  /**
   * Process payment with real-time balance updates
   */
  async processPaymentWithUpdates(
    paymentRequest: PartialPaymentRequest,
    onProgress?: (update: BalanceUpdate) => void
  ): Promise<ServiceResult<PaymentResult>> {
    try {
      // Validate payment first
      const validation = await this.validatePayment(
        paymentRequest.company_id,
        paymentRequest.payment_amount,
        paymentRequest.payment_method
      );

      if (validation.error || !validation.data?.valid) {
        return {
          error:
            validation.error ||
            validation.data?.errors.join(', ') ||
            'Payment validation failed',
        };
      }

      // Calculate allocation if not provided
      let allocations = paymentRequest.allocations;
      if (!allocations) {
        const allocationResult = await this.calculatePaymentAllocation(
          paymentRequest.company_id,
          paymentRequest.payment_amount,
          paymentRequest.allocation_strategy
        );

        if (allocationResult.error || !allocationResult.data) {
          return { error: 'Failed to calculate payment allocation' };
        }

        allocations = allocationResult.data.allocations;
      }

      // Start transaction
      const { data: payment, error: paymentError } = await supabase
        .from('company_payments')
        .insert({
          company_id: paymentRequest.company_id,
          amount: paymentRequest.payment_amount,
          payment_method: paymentRequest.payment_method,
          reference: paymentRequest.payment_reference,
          bank_reference: paymentRequest.bank_reference,
          status: 'processing',
          notes: paymentRequest.notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error('Error creating payment record:', paymentError);
        return { error: 'Failed to create payment record' };
      }

      // Send initial progress update
      const initialUpdate: BalanceUpdate = {
        update_type: 'payment_received',
        amount: paymentRequest.payment_amount,
        new_balance: validation.data.current_balance || 0,
        timestamp: new Date().toISOString(),
        transaction_id: payment.id,
        reference: paymentRequest.payment_reference,
        description: `Payment received: ${paymentRequest.payment_reference}`,
      };

      onProgress?.(initialUpdate);

      // Process allocations
      let totalAllocated = 0;
      let allocatedInvoices = 0;

      for (const allocation of allocations) {
        if (allocation.allocated_amount > 0) {
          // Update invoice
          const { error: invoiceError } = await supabase
            .from('company_invoices')
            .update({
              paid_amount: allocation.allocated_amount,
              remaining_amount: allocation.remaining_amount,
              status:
                allocation.remaining_amount <= 0 ? 'paid' : 'partial_paid',
              updated_at: new Date().toISOString(),
            })
            .eq('id', allocation.invoice_id);

          if (!invoiceError) {
            // Create payment allocation record
            await supabase.from('payment_allocations').insert({
              payment_id: payment.id,
              invoice_id: allocation.invoice_id,
              allocated_amount: allocation.allocated_amount,
              created_at: new Date().toISOString(),
            });

            totalAllocated += allocation.allocated_amount;
            allocatedInvoices++;

            // Send allocation progress update
            const allocationUpdate: BalanceUpdate = {
              update_type: 'payment_allocated',
              amount: allocation.allocated_amount,
              new_balance: validation.data.current_balance! - totalAllocated,
              timestamp: new Date().toISOString(),
              transaction_id: payment.id,
              invoice_id: allocation.invoice_id,
              description: `Payment allocated to ${allocation.invoice_number}`,
            };

            onProgress?.(allocationUpdate);
          }
        }
      }

      // Update company credit
      const { error: creditError } = await supabase
        .from('companies')
        .update({
          credit_used: validation.data.current_balance! - totalAllocated,
        })
        .eq('id', paymentRequest.company_id);

      if (creditError) {
        console.error('Error updating company credit:', creditError);
      }

      // Mark payment as completed
      await supabase
        .from('company_payments')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      // Broadcast balance update to subscribers
      await this.broadcastBalanceUpdate(paymentRequest.company_id, {
        update_type: 'payment_received',
        amount: paymentRequest.payment_amount,
        new_balance: validation.data.current_balance! - totalAllocated,
        timestamp: new Date().toISOString(),
        transaction_id: payment.id,
        reference: paymentRequest.payment_reference,
      });

      return {
        data: {
          success: true,
          payment_id: payment.id,
          transaction_id: payment.id,
          allocated_invoices: allocatedInvoices,
          total_allocated: totalAllocated,
          remaining_balance: validation.data.current_balance! - totalAllocated,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { error: 'Failed to process payment' };
    }
  }

  /**
   * Start real-time monitoring for balance updates
   */
  async startRealTimeMonitoring(
    companyId: string,
    onUpdate: (update: BalanceUpdate) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      // Stop existing subscription if any
      await this.stopRealTimeMonitoring(companyId);

      // Create Supabase real-time subscription
      const subscription = supabase
        .channel(`balance_updates_${companyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'company_payments',
            filter: `company_id=eq.${companyId}`,
          },
          payload => {
            this.handlePaymentUpdate(payload, onUpdate);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'companies',
            filter: `id=eq.${companyId}`,
          },
          payload => {
            this.handleCompanyUpdate(payload, onUpdate);
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
          } else if (status === 'CLOSED') {
            this.handleReconnection(companyId, onUpdate, onError);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(
              '❌ Real-time subscription error for company:',
              companyId
            );
            onError?.('Real-time connection error');
          }
        });

      this.subscriptions.set(companyId, subscription);

      // Start heartbeat
      this.startHeartbeat(companyId);

      return true;
    } catch (error) {
      console.error('Error starting real-time monitoring:', error);
      onError?.('Failed to start real-time monitoring');
      return false;
    }
  }

  /**
   * Stop real-time monitoring
   */
  async stopRealTimeMonitoring(companyId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(companyId);
      if (subscription) {
        await subscription.unsubscribe();
        this.subscriptions.delete(companyId);
      }

      // Stop heartbeat
      const heartbeatInterval = this.heartbeatIntervals.get(companyId);
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        this.heartbeatIntervals.delete(companyId);
      }

      // Reset reconnection attempts
      this.reconnectAttempts.delete(companyId);

    } catch (error) {
      console.error('Error stopping real-time monitoring:', error);
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(companyId: string): RealTimeSubscription | null {
    const subscription = this.subscriptions.get(companyId);
    if (!subscription) return null;

    return {
      subscription_id: subscription.uuid || 'unknown',
      company_id: companyId,
      status: subscription.state === 'joined' ? 'connected' : 'disconnected',
      last_heartbeat: new Date().toISOString(),
      connection_count: this.subscriptions.size,
    };
  }

  /**
   * Broadcast balance update to all subscribers
   */
  private async broadcastBalanceUpdate(
    companyId: string,
    update: BalanceUpdate
  ): Promise<void> {
    try {
      // Store the update in the database for persistence
      await supabase.from('balance_updates').insert({
        company_id: companyId,
        update_type: update.update_type,
        amount: update.amount,
        new_balance: update.new_balance,
        transaction_id: update.transaction_id,
        invoice_id: update.invoice_id,
        reference: update.reference,
        description: update.description,
        timestamp: update.timestamp,
      });

      // Send real-time broadcast
      const channel = supabase.channel(`balance_updates_${companyId}`);
      await channel.send({
        type: 'broadcast',
        event: 'balance_update',
        payload: update,
      });
    } catch (error) {
      console.error('Error broadcasting balance update:', error);
    }
  }

  /**
   * Apply allocation strategy to invoices
   */
  private applyAllocationStrategy(
    invoices: any[],
    paymentAmount: number,
    strategy: 'oldest_first' | 'largest_first' | 'manual'
  ): PaymentAllocation[] {
    let remainingAmount = paymentAmount;
    const allocations: PaymentAllocation[] = [];

    // Sort invoices based on strategy
    let sortedInvoices = [...invoices];
    switch (strategy) {
      case 'oldest_first':
        sortedInvoices.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'largest_first':
        sortedInvoices.sort((a, b) => b.total_amount - a.total_amount);
        break;
      case 'manual':
        // For manual, we'll return zero allocations and let the UI handle it
        sortedInvoices.forEach(invoice => {
          allocations.push({
            invoice_id: invoice.id,
            invoice_number:
              invoice.invoice_number || `INV-${invoice.id.slice(-6)}`,
            original_amount: invoice.total_amount,
            allocated_amount: 0,
            remaining_amount: invoice.total_amount,
          });
        });
        return allocations;
    }

    // Allocate payment to invoices
    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;

      const invoiceAmount = invoice.total_amount;
      const allocatedAmount = Math.min(remainingAmount, invoiceAmount);

      allocations.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number || `INV-${invoice.id.slice(-6)}`,
        original_amount: invoiceAmount,
        allocated_amount: allocatedAmount,
        remaining_amount: invoiceAmount - allocatedAmount,
      });

      remainingAmount -= allocatedAmount;
    }

    return allocations;
  }

  /**
   * Handle payment table updates
   */
  private handlePaymentUpdate(
    payload: any,
    onUpdate: (update: BalanceUpdate) => void
  ): void {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' && newRecord) {
        const update: BalanceUpdate = {
          update_type: 'payment_received',
          amount: newRecord.amount,
          new_balance: 0, // Will be calculated by the component
          timestamp: newRecord.created_at || new Date().toISOString(),
          transaction_id: newRecord.id,
          reference: newRecord.reference,
          description: `Payment received: ${newRecord.reference || newRecord.id}`,
        };
        onUpdate(update);
      }
    } catch (error) {
      console.error('Error handling payment update:', error);
    }
  }

  /**
   * Handle company table updates (credit changes)
   */
  private handleCompanyUpdate(
    payload: any,
    onUpdate: (update: BalanceUpdate) => void
  ): void {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'UPDATE' && newRecord && oldRecord) {
        const creditChange =
          (oldRecord.credit_used || 0) - (newRecord.credit_used || 0);
        if (Math.abs(creditChange) > 0.01) {
          // Avoid floating point issues
          const update: BalanceUpdate = {
            update_type: 'credit_adjustment',
            amount: creditChange,
            new_balance:
              (newRecord.credit_limit || 0) - (newRecord.credit_used || 0),
            timestamp: new Date().toISOString(),
            description: creditChange > 0 ? 'Credit increased' : 'Credit used',
          };
          onUpdate(update);
        }
      }
    } catch (error) {
      console.error('Error handling company update:', error);
    }
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(companyId: string): void {
    const interval = setInterval(() => {
      const subscription = this.subscriptions.get(companyId);
      if (subscription) {
        // Send a heartbeat ping
        subscription.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: new Date().toISOString() },
        });
      }
    }, this.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(companyId, interval);
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(
    companyId: string,
    onUpdate: (update: BalanceUpdate) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(companyId) || 0;

    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      onError?.('Maximum reconnection attempts exceeded');
      return;
    }

    this.reconnectAttempts.set(companyId, attempts + 1);

    setTimeout(
      async () => {
        const success = await this.startRealTimeMonitoring(
          companyId,
          onUpdate,
          onError
        );
        if (success) {
          this.reconnectAttempts.delete(companyId);
        }
      },
      this.RECONNECT_DELAY * (attempts + 1)
    ); // Exponential backoff
  }

  /**
   * Get recent balance updates for a company
   */
  async getRecentBalanceUpdates(
    companyId: string,
    limit: number = 10
  ): Promise<ServiceResult<BalanceUpdate[]>> {
    try {
      const { data, error } = await supabase
        .from('balance_updates')
        .select('*')
        .eq('company_id', companyId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent updates:', error);
        return { error: 'Failed to fetch recent updates' };
      }

      return {
        data: data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting recent balance updates:', error);
      return { error: 'Failed to get recent balance updates' };
    }
  }

  /**
   * Cleanup all subscriptions (call on app shutdown)
   */
  async cleanup(): Promise<void> {
    const companyIds = Array.from(this.subscriptions.keys());
    for (const companyId of companyIds) {
      await this.stopRealTimeMonitoring(companyId);
    }
  }
}

// Export singleton instance
export const realTimePaymentService = new RealTimePaymentService();

// Export class for testing
export { RealTimePaymentService };
