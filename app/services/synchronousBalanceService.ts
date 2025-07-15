import supabaseService from './supabaseService';

const { supabase } = supabaseService;

export interface BalanceTransaction {
  id: string;
  company_id: string;
  previous_balance: number;
  new_balance: number;
  amount_changed: number;
  transaction_type: 'credit_increase' | 'credit_decrease' | 'payment_applied' | 'order_charge' | 'adjustment' | 'refund';
  description?: string;
  order_id?: string;
  payment_id?: string;
  created_by?: string;
  created_at: string;
}

export interface BalanceUpdateResult {
  success: boolean;
  transaction?: BalanceTransaction;
  new_balance: number;
  error?: string;
}

class SynchronousBalanceService {
  /**
   * Atomically update company balance with ACID compliance
   * Uses database transactions to ensure consistency
   */
  async updateCompanyBalance(
    companyId: string,
    amountChange: number,
    transactionType: BalanceTransaction['transaction_type'],
    description?: string,
    orderId?: string,
    paymentId?: string,
    createdBy?: string
  ): Promise<BalanceUpdateResult> {
    try {
      // Use RPC function for atomic balance update
      const { data, error } = await supabase.rpc('update_company_balance_atomic', {
        p_company_id: companyId,
        p_amount_change: amountChange,
        p_transaction_type: transactionType,
        p_description: description || '',
        p_order_id: orderId || null,
        p_payment_id: paymentId || null,
        p_created_by: createdBy || null
      });

      if (error) {
        return {
          success: false,
          new_balance: 0,
          error: error.message
        };
      }

      return {
        success: true,
        transaction: data.transaction,
        new_balance: data.new_balance
      };
    } catch (error) {
      return {
        success: false,
        new_balance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current balance with lock for consistency
   */
  async getCompanyBalanceWithLock(companyId: string): Promise<{ balance: number; credit_limit: number } | null> {
    try {
      const { data, error } = await supabase.rpc('get_company_balance_locked', {
        p_company_id: companyId
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Process order charge with atomic balance update
   */
  async chargeOrderToCompany(
    companyId: string,
    orderId: string,
    amount: number,
    description?: string
  ): Promise<BalanceUpdateResult> {
    return this.updateCompanyBalance(
      companyId,
      -Math.abs(amount), // Negative for charges
      'order_charge',
      description || `Order charge for ${orderId}`,
      orderId
    );
  }

  /**
   * Process payment application with atomic balance update
   */
  async applyPaymentToCompany(
    companyId: string,
    paymentId: string,
    amount: number,
    description?: string
  ): Promise<BalanceUpdateResult> {
    return this.updateCompanyBalance(
      companyId,
      Math.abs(amount), // Positive for payments
      'payment_applied',
      description || `Payment applied: ${paymentId}`,
      undefined,
      paymentId
    );
  }

  /**
   * Process credit adjustment with atomic balance update
   */
  async adjustCompanyCredit(
    companyId: string,
    amount: number,
    description: string,
    createdBy?: string
  ): Promise<BalanceUpdateResult> {
    const transactionType = amount > 0 ? 'credit_increase' : 'credit_decrease';
    return this.updateCompanyBalance(
      companyId,
      amount,
      transactionType,
      description,
      undefined,
      undefined,
      createdBy
    );
  }

  /**
   * Get balance transaction history
   */
  async getBalanceHistory(
    companyId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BalanceTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('balance_updates')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Subscribe to real-time balance changes
   */
  subscribeToBalanceChanges(
    companyId: string,
    onUpdate: (transaction: BalanceTransaction) => void
  ): () => void {
    const subscription = supabase
      .channel(`balance_changes_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balance_updates',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          onUpdate(payload.new as BalanceTransaction);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const synchronousBalanceService = new SynchronousBalanceService();
export default synchronousBalanceService;