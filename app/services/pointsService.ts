import { supabase } from '../../utils/supabase';

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

        if (currentBalance < pointsToRedeem) {
          console.error('Insufficient points for redemption');
          return false;
        }

        const newPointsRedeemed =
          (currentData.points_redeemed || 0) + pointsToRedeem;
        const newBalance = (currentData.points_earned || 0) - newPointsRedeemed;

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

        if (currentPoints < pointsToRedeem) {
          console.error('Insufficient points for redemption');
          return false;
        }

        const newPoints = currentPoints - pointsToRedeem;

        const { error: updateError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', userId);

        if (updateError) {
          console.error(
            'Error updating user points for redemption:',
            updateError
          );
          return false;
        }
      }

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
};

export default pointsService;
