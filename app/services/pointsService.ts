import { supabase } from '../../utils/supabase';
import { auditService } from './auditService';

export interface PointsTransaction {
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

export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string;
  points_required: number;
  reward_type: 'voucher' | 'bundle' | 'swag' | 'experience';
  reward_value?: number;
  validity_days?: number;
  stock_quantity?: number;
  is_active: boolean;
  image_url?: string;
  logo_url?: string;
  terms_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  company_id?: string;
  reward_id: string;
  points_used: number;
  redemption_status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  confirmation_code?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  reward?: RewardCatalogItem;
}

export interface UserVoucher {
  id: string;
  user_id: string;
  company_id?: string;
  redemption_id: string;
  voucher_code: string;
  voucher_value: number;
  voucher_status: 'active' | 'used' | 'expired' | 'cancelled';
  issued_at: string;
  expires_at: string;
  used_at?: string;
  used_in_order_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  redemption?: RewardRedemption;
}

export interface CompanyPointsSummary {
  companyId: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  tierLevel: 'Bronze' | 'Silver' | 'Gold';
  lifetimePointsEarned: number;
}

export const pointsService = {
  /**
   * Update user company points in the database
   */
  async updateUserCompanyPoints(
    userId: string,
    companyId: string,
    pointsEarned: number,
    transactionType: string = 'earned_purchase'
  ): Promise<boolean> {
    try {
      console.log('💰 Updating user company points:', {
        userId,
        companyId,
        pointsEarned,
      });

      // First, get current company points
      const { data: currentData, error: fetchError } = await supabase
        .from('user_company_points')
        .select('points_earned, points_redeemed, lifetime_points_earned')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        console.error('Error fetching current points:', fetchError);
        return false;
      }

      const currentPointsEarned = currentData?.points_earned || 0;
      const currentPointsRedeemed = currentData?.points_redeemed || 0;
      const currentLifetimeEarned = currentData?.lifetime_points_earned || 0;

      const newPointsEarned = currentPointsEarned + pointsEarned;
      const newLifetimeEarned = currentLifetimeEarned + pointsEarned;

      // Calculate tier based on lifetime points earned
      let tierLevel = 'Bronze';
      if (newLifetimeEarned >= 200000) {
        tierLevel = 'Gold';
      } else if (newLifetimeEarned >= 50000) {
        tierLevel = 'Silver';
      }

      // Upsert the points record
      const { error: upsertError } = await supabase
        .from('user_company_points')
        .upsert(
          {
            user_id: userId,
            company_id: companyId,
            points_earned: newPointsEarned,
            points_redeemed: currentPointsRedeemed,
            lifetime_points_earned: newLifetimeEarned,
            current_balance: newPointsEarned - currentPointsRedeemed,
            tier_level: tierLevel,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,company_id',
          }
        );

      if (upsertError) {
        console.error('Error upserting user company points:', upsertError);
        return false;
      }

      console.log('✅ User company points updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateUserCompanyPoints:', error);
      return false;
    }
  },

  /**
   * Get company points summary for a user
   */
  async getCompanyPointsSummary(
    userId: string,
    companyId: string
  ): Promise<CompanyPointsSummary | null> {
    try {
      const { data, error } = await supabase
        .from('user_company_points')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (error) {
        console.error('Error fetching company points summary:', error);
        return null;
      }

      return {
        companyId: data.company_id,
        totalPointsEarned: data.points_earned || 0,
        totalPointsRedeemed: data.points_redeemed || 0,
        currentBalance: data.current_balance || 0,
        tierLevel: data.tier_level || 'Bronze',
        lifetimePointsEarned: data.lifetime_points_earned || 0,
      };
    } catch (error) {
      console.error('Error in getCompanyPointsSummary:', error);
      return null;
    }
  },

  /**
   * Redeem points for a user
   */
  async redeemPoints(
    userId: string,
    companyId: string | null,
    pointsToRedeem: number,
    description: string = 'Points redeemed'
  ): Promise<boolean> {
    try {
      let previousBalance = 0;
      let newBalance = 0;

      if (companyId) {
        // Company user - update company points
        const { data: currentData, error: fetchError } = await supabase
          .from('user_company_points')
          .select('points_earned, points_redeemed')
          .eq('user_id', userId)
          .eq('company_id', companyId)
          .single();

        if (fetchError) {
          console.error(
            'Error fetching current company points for redemption:',
            fetchError
          );
          return false;
        }

        const currentBalance =
          (currentData.points_earned || 0) - (currentData.points_redeemed || 0);
        previousBalance = currentBalance;

        if (currentBalance < pointsToRedeem) {
          console.error('Insufficient points for redemption');
          return false;
        }

        const newPointsRedeemed =
          (currentData.points_redeemed || 0) + pointsToRedeem;
        newBalance = (currentData.points_earned || 0) - newPointsRedeemed;

        const { error: updateError } = await supabase
          .from('user_company_points')
          .update({
            points_redeemed: newPointsRedeemed,
            current_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('company_id', companyId);

        if (updateError) {
          console.error(
            'Error updating company points for redemption:',
            updateError
          );
          return false;
        }
      } else {
        // Individual user - update user points
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error(
            'Error fetching user points for redemption:',
            userError
          );
          return false;
        }

        const currentPoints = userData.points || 0;
        previousBalance = currentPoints;

        if (currentPoints < pointsToRedeem) {
          console.error('Insufficient points for redemption');
          return false;
        }

        newBalance = currentPoints - pointsToRedeem;

        const { error: updateError } = await supabase
          .from('users')
          .update({ points: newBalance })
          .eq('id', userId);

        if (updateError) {
          console.error(
            'Error updating user points for redemption:',
            updateError
          );
          return false;
        }
      }

      // Log points redemption audit trail
      await auditService.logPointsTransaction(
        userId,
        companyId,
        'redeemed_voucher',
        -pointsToRedeem,
        previousBalance,
        newBalance,
        undefined,
        description,
        {
          redemption_type: 'voucher',
          account_type: companyId ? 'company' : 'individual',
        }
      );

      console.log('✅ Points redeemed successfully');
      return true;
    } catch (error) {
      console.error('Error in redeemPoints:', error);
      return false;
    }
  },

  /**
   * Get points transaction history
   */
  async getPointsHistory(
    userId: string,
    companyId?: string,
    limit: number = 50
  ): Promise<PointsTransaction[]> {
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
        console.error('Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPointsHistory:', error);
      return [];
    }
  },

  /**
   * Get user company points transactions (compatible with modal)
   */
  async getUserCompanyPointsTransactions(
    userId: string,
    companyId: string
  ): Promise<import('../types/user').PointsTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_audit_log')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error(
          'Error fetching user company points transactions:',
          error
        );
        return [];
      }

      // Transform to match the modal's expected format
      return (data || []).map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        companyId: transaction.company_id,
        transactionType: transaction.transaction_type,
        pointsAmount: transaction.points_change,
        pointsBalanceBefore: transaction.points_before,
        pointsBalanceAfter: transaction.points_after,
        metadata: transaction.metadata || {},
        createdAt: transaction.created_at,
      }));
    } catch (error) {
      console.error('Error in getUserCompanyPointsTransactions:', error);
      return [];
    }
  },

  /**
   * Get reward catalog items
   */
  async getRewardCatalog(): Promise<RewardCatalogItem[]> {
    try {
      const { data, error } = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching reward catalog:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRewardCatalog:', error);
      return [];
    }
  },

  /**
   * Redeem a reward and create voucher if applicable
   */
  async redeemReward(
    userId: string,
    companyId: string | null,
    rewardId: string
  ): Promise<{ success: boolean; redemption?: RewardRedemption; voucher?: UserVoucher; error?: string }> {
    try {
      // Start transaction
      const { data: reward, error: rewardError } = await supabase
        .from('reward_catalog')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) {
        return { success: false, error: 'Reward not found or inactive' };
      }

      // Check if user has enough points
      let currentPoints = 0;
      if (companyId) {
        const { data: companyData, error: companyError } = await supabase
          .from('user_company_points')
          .select('current_balance')
          .eq('user_id', userId)
          .eq('company_id', companyId)
          .single();

        if (companyError) {
          return { success: false, error: 'Failed to check company points' };
        }

        currentPoints = companyData?.current_balance || 0;
      } else {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', userId)
          .single();

        if (userError) {
          return { success: false, error: 'Failed to check user points' };
        }

        currentPoints = userData?.points || 0;
      }

      if (currentPoints < reward.points_required) {
        return { success: false, error: 'Insufficient points' };
      }

      // Generate confirmation code
      const confirmationCode = `REDEEM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: userId,
          company_id: companyId,
          reward_id: rewardId,
          points_used: reward.points_required,
          redemption_status: 'pending',
          confirmation_code: confirmationCode,
          metadata: { reward_type: reward.reward_type },
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Error creating redemption:', redemptionError);
        return { success: false, error: 'Failed to create redemption' };
      }

      // Create voucher for voucher-type rewards
      let voucher: UserVoucher | undefined;
      if (reward.reward_type === 'voucher' && reward.reward_value) {
        const { data: voucherData, error: voucherError } = await supabase
          .from('user_vouchers')
          .insert({
            user_id: userId,
            company_id: companyId,
            redemption_id: redemption.id,
            voucher_value: reward.reward_value,
            voucher_status: 'active',
            metadata: { reward_title: reward.title },
          })
          .select()
          .single();

        if (voucherError) {
          console.error('Error creating voucher:', voucherError);
          // Rollback redemption if voucher creation fails
          await supabase
            .from('reward_redemptions')
            .update({ redemption_status: 'failed' })
            .eq('id', redemption.id);
          return { success: false, error: 'Failed to create voucher' };
        }

        voucher = voucherData;
      }

      // Deduct points using existing method
      const pointsRedeemed = await this.redeemPoints(
        userId,
        companyId,
        reward.points_required,
        `Redeemed: ${reward.title}`
      );

      if (!pointsRedeemed) {
        // Rollback redemption if points deduction fails
        await supabase
          .from('reward_redemptions')
          .update({ redemption_status: 'failed' })
          .eq('id', redemption.id);
        return { success: false, error: 'Failed to deduct points' };
      }

      // Update redemption status to confirmed
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({ redemption_status: 'confirmed' })
        .eq('id', redemption.id);

      if (updateError) {
        console.error('Error updating redemption status:', updateError);
      }

      // Log redemption audit trail
      await auditService.logAuditEntry(
        userId,
        'reward_redeemed',
        'voucher',
        voucher?.id || redemption.id,
        undefined,
        {
          redemption_id: redemption.id,
          reward_id: rewardId,
          reward_title: reward.title,
          points_used: reward.points_required,
          reward_type: reward.reward_type,
          reward_value: reward.reward_value,
          voucher_code: voucher?.voucher_code,
          confirmation_code: confirmationCode,
        },
        companyId,
        {
          redemption_status: 'confirmed',
          reward_type: reward.reward_type,
          points_deducted: reward.points_required,
        }
      );

      console.log('✅ Reward redeemed successfully');
      
      return { success: true, redemption: { ...redemption, redemption_status: 'confirmed' }, voucher };
    } catch (error) {
      console.error('Error in redeemReward:', error);
      return { success: false, error: 'Redemption failed' };
    }
  },

  /**
   * Get user vouchers
   */
  async getUserVouchers(
    userId: string,
    companyId?: string,
    status?: 'active' | 'used' | 'expired' | 'cancelled'
  ): Promise<UserVoucher[]> {
    try {
      let query = supabase
        .from('user_vouchers')
        .select(`
          *,
          redemption:reward_redemptions(
            *,
            reward:reward_catalog(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (status) {
        query = query.eq('voucher_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user vouchers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserVouchers:', error);
      return [];
    }
  },

  /**
   * Get user redemptions
   */
  async getUserRedemptions(
    userId: string,
    companyId?: string,
    status?: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  ): Promise<RewardRedemption[]> {
    try {
      let query = supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:reward_catalog(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (status) {
        query = query.eq('redemption_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user redemptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRedemptions:', error);
      return [];
    }
  },

  /**
   * Get voucher redemption history with user attribution
   */
  async getVoucherHistory(
    userId: string,
    companyId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('user_vouchers')
        .select(`
          *,
          redemption:reward_redemptions(
            *,
            reward:reward_catalog(*),
            redeemed_by:users!reward_redemptions_user_id_fkey(id, name, email)
          ),
          used_by:users!user_vouchers_user_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching voucher history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVoucherHistory:', error);
      return [];
    }
  },

  /**
   * Use a voucher in an order
   */
  async useVoucher(
    voucherId: string,
    orderId: string,
    userId: string
  ): Promise<{ success: boolean; voucher?: UserVoucher; error?: string }> {
    try {
      // First check if voucher exists and is active
      const { data: voucher, error: voucherError } = await supabase
        .from('user_vouchers')
        .select('*')
        .eq('id', voucherId)
        .eq('user_id', userId)
        .eq('voucher_status', 'active')
        .single();

      if (voucherError || !voucher) {
        return { success: false, error: 'Voucher not found or already used' };
      }

      // Check if voucher is expired
      if (new Date(voucher.expires_at) < new Date()) {
        await supabase
          .from('user_vouchers')
          .update({ voucher_status: 'expired' })
          .eq('id', voucherId);
        return { success: false, error: 'Voucher has expired' };
      }

      // Mark voucher as used
      const { data: updatedVoucher, error: updateError } = await supabase
        .from('user_vouchers')
        .update({
          voucher_status: 'used',
          used_at: new Date().toISOString(),
          used_in_order_id: orderId,
        })
        .eq('id', voucherId)
        .select()
        .single();

      if (updateError) {
        console.error('Error marking voucher as used:', updateError);
        return { success: false, error: 'Failed to use voucher' };
      }

      // Log voucher usage audit trail
      await auditService.logAuditEntry(
        userId,
        'voucher_used',
        'voucher',
        voucherId,
        { voucher_status: 'active' },
        {
          voucher_status: 'used',
          used_at: new Date().toISOString(),
          used_in_order_id: orderId,
        },
        voucher.company_id,
        {
          voucher_code: voucher.voucher_code,
          voucher_value: voucher.voucher_value,
          order_id: orderId,
          used_date: new Date().toISOString(),
        }
      );

      console.log('✅ Voucher used successfully');
      return { success: true, voucher: updatedVoucher };
    } catch (error) {
      console.error('Error in useVoucher:', error);
      return { success: false, error: 'Failed to use voucher' };
    }
  },

  /**
   * Get voucher by code
   */
  async getVoucherByCode(
    voucherCode: string,
    userId: string
  ): Promise<{ success: boolean; voucher?: UserVoucher; error?: string }> {
    try {
      const { data: voucher, error } = await supabase
        .from('user_vouchers')
        .select(`
          *,
          redemption:reward_redemptions(
            *,
            reward:reward_catalog(*)
          )
        `)
        .eq('voucher_code', voucherCode)
        .eq('user_id', userId)
        .single();

      if (error || !voucher) {
        return { success: false, error: 'Voucher not found' };
      }

      return { success: true, voucher };
    } catch (error) {
      console.error('Error in getVoucherByCode:', error);
      return { success: false, error: 'Failed to get voucher' };
    }
  },

  /**
   * Cancel a voucher
   */
  async cancelVoucher(
    voucherId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_vouchers')
        .update({
          voucher_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', voucherId)
        .eq('user_id', userId)
        .eq('voucher_status', 'active');

      if (error) {
        console.error('Error cancelling voucher:', error);
        return { success: false, error: 'Failed to cancel voucher' };
      }

      // Log voucher cancellation audit trail
      await auditService.logAuditEntry(
        userId,
        'voucher_cancelled',
        'voucher',
        voucherId,
        { voucher_status: 'active' },
        {
          voucher_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        },
        undefined,
        {
          cancellation_reason: 'user_requested',
          cancelled_date: new Date().toISOString(),
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error in cancelVoucher:', error);
      return { success: false, error: 'Failed to cancel voucher' };
    }
  },

  /**
   * Voucher Lifecycle Management Methods
   */

  /**
   * Check and update expired vouchers
   */
  async processExpiredVouchers(): Promise<{ success: boolean; expiredCount: number; error?: string }> {
    try {
      // Get all active vouchers that have expired
      const { data: expiredVouchers, error: selectError } = await supabase
        .from('user_vouchers')
        .select('id, user_id, voucher_code, voucher_value')
        .eq('voucher_status', 'active')
        .lt('expires_at', new Date().toISOString());

      if (selectError) {
        console.error('Error fetching expired vouchers:', selectError);
        return { success: false, expiredCount: 0, error: 'Failed to fetch expired vouchers' };
      }

      if (!expiredVouchers || expiredVouchers.length === 0) {
        return { success: true, expiredCount: 0 };
      }

      // Update expired vouchers
      const { error: updateError } = await supabase
        .from('user_vouchers')
        .update({
          voucher_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('voucher_status', 'active')
        .lt('expires_at', new Date().toISOString());

      if (updateError) {
        console.error('Error updating expired vouchers:', updateError);
        return { success: false, expiredCount: 0, error: 'Failed to update expired vouchers' };
      }

      // Log batch voucher expiry audit trail
      for (const expiredVoucher of expiredVouchers) {
        await auditService.logAuditEntry(
          expiredVoucher.user_id,
          'voucher_expired',
          'voucher',
          expiredVoucher.id,
          { voucher_status: 'active' },
          {
            voucher_status: 'expired',
            expired_at: new Date().toISOString(),
          },
          undefined,
          {
            voucher_code: expiredVoucher.voucher_code,
            voucher_value: expiredVoucher.voucher_value,
            expiry_reason: 'automatic_expiry',
            expired_date: new Date().toISOString(),
          }
        );
      }

      console.log(`✅ Updated ${expiredVouchers.length} expired vouchers`);
      return { success: true, expiredCount: expiredVouchers.length };
    } catch (error) {
      console.error('Error in processExpiredVouchers:', error);
      return { success: false, expiredCount: 0, error: 'Failed to process expired vouchers' };
    }
  },

  /**
   * Get voucher status summary for a user
   */
  async getVoucherStatusSummary(
    userId: string,
    companyId?: string
  ): Promise<{ success: boolean; summary?: { active: number; used: number; expired: number; cancelled: number }; error?: string }> {
    try {
      let query = supabase
        .from('user_vouchers')
        .select('voucher_status')
        .eq('user_id', userId);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching voucher status summary:', error);
        return { success: false, error: 'Failed to fetch voucher status summary' };
      }

      const summary = {
        active: 0,
        used: 0,
        expired: 0,
        cancelled: 0,
      };

      data?.forEach(voucher => {
        summary[voucher.voucher_status as keyof typeof summary]++;
      });

      return { success: true, summary };
    } catch (error) {
      console.error('Error in getVoucherStatusSummary:', error);
      return { success: false, error: 'Failed to get voucher status summary' };
    }
  },

  /**
   * Get vouchers expiring soon
   */
  async getVouchersExpiringSoon(
    userId: string,
    daysAhead: number = 7,
    companyId?: string
  ): Promise<{ success: boolean; vouchers?: UserVoucher[]; error?: string }> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      let query = supabase
        .from('user_vouchers')
        .select(`
          *,
          redemption:reward_redemptions(
            *,
            reward:reward_catalog(*)
          )
        `)
        .eq('user_id', userId)
        .eq('voucher_status', 'active')
        .gt('expires_at', new Date().toISOString())
        .lte('expires_at', futureDate.toISOString())
        .order('expires_at', { ascending: true });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vouchers expiring soon:', error);
        return { success: false, error: 'Failed to fetch vouchers expiring soon' };
      }

      return { success: true, vouchers: data || [] };
    } catch (error) {
      console.error('Error in getVouchersExpiringSoon:', error);
      return { success: false, error: 'Failed to get vouchers expiring soon' };
    }
  },

  /**
   * Validate voucher for checkout
   */
  async validateVoucherForCheckout(
    voucherId: string,
    userId: string,
    orderTotal: number
  ): Promise<{ success: boolean; voucher?: UserVoucher; canUse: boolean; reason?: string; error?: string }> {
    try {
      const { data: voucher, error: voucherError } = await supabase
        .from('user_vouchers')
        .select(`
          *,
          redemption:reward_redemptions(
            *,
            reward:reward_catalog(*)
          )
        `)
        .eq('id', voucherId)
        .single();

      if (voucherError || !voucher) {
        return { success: false, canUse: false, error: 'Voucher not found' };
      }

      // Check if voucher is active
      if (voucher.voucher_status !== 'active') {
        return { 
          success: true, 
          voucher, 
          canUse: false, 
          reason: `Voucher is ${voucher.voucher_status}` 
        };
      }

      // Check if voucher has expired
      if (new Date(voucher.expires_at) < new Date()) {
        // Auto-expire the voucher
        await supabase
          .from('user_vouchers')
          .update({ voucher_status: 'expired' })
          .eq('id', voucherId);

        return { 
          success: true, 
          voucher: { ...voucher, voucher_status: 'expired' }, 
          canUse: false, 
          reason: 'Voucher has expired' 
        };
      }

      // Check if order total meets minimum requirement (voucher value is the minimum)
      // For example: $500 voucher requires minimum $500 order
      if (orderTotal < voucher.voucher_value) {
        return { 
          success: true, 
          voucher, 
          canUse: false, 
          reason: `Minimum order of S$${voucher.voucher_value} required` 
        };
      }

      return { success: true, voucher, canUse: true };
    } catch (error) {
      console.error('Error in validateVoucherForCheckout:', error);
      return { success: false, canUse: false, error: 'Failed to validate voucher' };
    }
  },

  /**
   * Reactivate a cancelled voucher (if within reactivation period)
   */
  async reactivateVoucher(
    voucherId: string,
    userId: string
  ): Promise<{ success: boolean; voucher?: UserVoucher; error?: string }> {
    try {
      const { data: voucher, error: voucherError } = await supabase
        .from('user_vouchers')
        .select('*')
        .eq('id', voucherId)
        .eq('user_id', userId)
        .eq('voucher_status', 'cancelled')
        .single();

      if (voucherError || !voucher) {
        return { success: false, error: 'Voucher not found or not cancelled' };
      }

      // Check if voucher hasn't expired
      if (new Date(voucher.expires_at) < new Date()) {
        return { success: false, error: 'Voucher has already expired' };
      }

      // Reactivate the voucher
      const { data: reactivatedVoucher, error: updateError } = await supabase
        .from('user_vouchers')
        .update({
          voucher_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', voucherId)
        .select()
        .single();

      if (updateError) {
        console.error('Error reactivating voucher:', updateError);
        return { success: false, error: 'Failed to reactivate voucher' };
      }

      // Log voucher reactivation audit trail
      await auditService.logAuditEntry(
        userId,
        'voucher_reactivated',
        'voucher',
        voucherId,
        { voucher_status: 'cancelled' },
        {
          voucher_status: 'active',
          reactivated_at: new Date().toISOString(),
        },
        voucher.company_id,
        {
          voucher_code: voucher.voucher_code,
          voucher_value: voucher.voucher_value,
          reactivation_reason: 'user_requested',
          reactivated_date: new Date().toISOString(),
        }
      );

      console.log('✅ Voucher reactivated successfully');
      return { success: true, voucher: reactivatedVoucher };
    } catch (error) {
      console.error('Error in reactivateVoucher:', error);
      return { success: false, error: 'Failed to reactivate voucher' };
    }
  },

  /**
   * Get voucher usage statistics
   */
  async getVoucherUsageStats(
    userId: string,
    companyId?: string
  ): Promise<{ success: boolean; stats?: { totalRedeemed: number; totalValue: number; usageRate: number }; error?: string }> {
    try {
      let query = supabase
        .from('user_vouchers')
        .select('voucher_status, voucher_value')
        .eq('user_id', userId);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching voucher usage stats:', error);
        return { success: false, error: 'Failed to fetch voucher usage stats' };
      }

      const totalVouchers = data?.length || 0;
      const usedVouchers = data?.filter(v => v.voucher_status === 'used').length || 0;
      const totalValue = data?.reduce((sum, v) => sum + (v.voucher_value || 0), 0) || 0;
      const usageRate = totalVouchers > 0 ? (usedVouchers / totalVouchers) * 100 : 0;

      return {
        success: true,
        stats: {
          totalRedeemed: totalVouchers,
          totalValue,
          usageRate: Math.round(usageRate * 100) / 100,
        }
      };
    } catch (error) {
      console.error('Error in getVoucherUsageStats:', error);
      return { success: false, error: 'Failed to get voucher usage stats' };
    }
  },
};

export default pointsService;
