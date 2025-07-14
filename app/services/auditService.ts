import { supabase } from '../../utils/supabase';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  companyId?: string;
  action: string;
  entityType: 'points' | 'order' | 'user' | 'company' | 'voucher' | 'system';
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  createdAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PointsAuditEntry {
  id?: string;
  userId: string;
  companyId?: string;
  transactionType:
    | 'earned_purchase'
    | 'redeemed_voucher'
    | 'bonus'
    | 'expired'
    | 'adjustment';
  points: number;
  previousBalance: number;
  newBalance: number;
  orderId?: string;
  description?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export const auditService = {
  /**
   * Log a points transaction to the audit trail
   */
  async logPointsTransaction(
    userId: string,
    companyId: string | null,
    transactionType: string,
    points: number,
    previousBalance: number,
    newBalance: number,
    orderId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      console.log('📝 Logging points transaction to audit trail:', {
        userId,
        companyId,
        transactionType,
        points,
        previousBalance,
        newBalance,
        orderId,
      });

      const auditEntry: PointsAuditEntry = {
        userId,
        companyId: companyId || undefined,
        transactionType: transactionType as PointsAuditEntry['transactionType'],
        points,
        previousBalance,
        newBalance,
        orderId,
        description:
          description ||
          `${transactionType.replace('_', ' ')} - ${points} points`,
        createdAt: new Date().toISOString(),
        metadata: metadata || {},
      };

      const { error } = await supabase
        .from('points_audit_log')
        .insert(auditEntry);

      if (error) {
        console.error('Error logging points transaction:', error);
        return false;
      }

      console.log('✅ Points transaction logged successfully');
      return true;
    } catch (error) {
      console.error('Error in logPointsTransaction:', error);
      return false;
    }
  },

  /**
   * Log a general audit entry
   */
  async logAuditEntry(
    userId: string,
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId?: string,
    previousValue?: any,
    newValue?: any,
    companyId?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const auditEntry: AuditLogEntry = {
        userId,
        companyId,
        action,
        entityType,
        entityId,
        previousValue,
        newValue,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('audit_log').insert(auditEntry);

      if (error) {
        console.error('Error logging audit entry:', error);
        return false;
      }

      console.log('✅ Audit entry logged successfully');
      return true;
    } catch (error) {
      console.error('Error in logAuditEntry:', error);
      return false;
    }
  },

  /**
   * Get audit history for a user
   */
  async getAuditHistory(
    userId: string,
    entityType?: AuditLogEntry['entityType'],
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuditHistory:', error);
      return [];
    }
  },

  /**
   * Get points audit history for a user
   */
  async getPointsAuditHistory(
    userId: string,
    companyId?: string,
    limit: number = 50
  ): Promise<PointsAuditEntry[]> {
    try {
      let query = supabase
        .from('points_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching points audit history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPointsAuditHistory:', error);
      return [];
    }
  },

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    userId: string,
    action:
      | 'login'
      | 'logout'
      | 'password_change'
      | 'account_locked'
      | 'failed_login',
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEntry(
      userId,
      action,
      'user',
      userId,
      undefined,
      undefined,
      undefined,
      metadata
    );
  },

  /**
   * Log order-related events
   */
  async logOrderEvent(
    userId: string,
    orderId: string,
    action:
      | 'created'
      | 'updated'
      | 'cancelled'
      | 'completed'
      | 'approved'
      | 'rejected',
    previousValue?: any,
    newValue?: any,
    companyId?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEntry(
      userId,
      action,
      'order',
      orderId,
      previousValue,
      newValue,
      companyId,
      metadata
    );
  },

  /**
   * Log voucher redemption events
   */
  async logVoucherEvent(
    userId: string,
    voucherId: string,
    action: 'created' | 'redeemed' | 'expired' | 'cancelled',
    companyId?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.logAuditEntry(
      userId,
      action,
      'voucher',
      voucherId,
      undefined,
      undefined,
      companyId,
      metadata
    );
  },
};

export default auditService;
