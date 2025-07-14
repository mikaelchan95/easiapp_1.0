import { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { pointsService, CompanyPointsSummary } from '../services/pointsService';
import { auditService, PointsAuditEntry } from '../services/auditService';

// Additional interfaces for compatibility with CompanyPointsSection
export interface UserPoints {
  points_balance: number;
  points_rank: number;
  lifetime_points: number;
}

export interface CompanySummary {
  company_total_points: number;
}

export interface CompanyPointsData {
  summary: CompanyPointsSummary | null;
  history: PointsAuditEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface CompanyPointsActions {
  refreshData: () => Promise<void>;
  loadHistory: (limit?: number) => Promise<void>;
  redeemPoints: (points: number, description?: string) => Promise<boolean>;
}

// Overloaded function for different use cases
export function useCompanyPoints(): CompanyPointsData & CompanyPointsActions;
export function useCompanyPoints(
  userId: string,
  companyId: string
): {
  userPoints: UserPoints | null;
  companySummary: CompanySummary | null;
  loading: boolean;
  error: string | null;
};

export function useCompanyPoints(userId?: string, companyId?: string) {
  const { state } = useContext(AppContext);
  const { user, company } = state;

  // Determine if we're using parameters or context
  const targetUser = userId ? { id: userId } : user;
  const targetCompany = companyId ? { id: companyId } : company;

  const [summary, setSummary] = useState<CompanyPointsSummary | null>(null);
  const [history, setHistory] = useState<PointsAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Additional state for compatibility mode
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [companySummary, setCompanySummary] = useState<CompanySummary | null>(
    null
  );

  const refreshData = useCallback(async () => {
    if (
      !targetUser ||
      !targetCompany ||
      (user && user.accountType !== 'company')
    ) {
      setError('Company points are only available for company users');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching company points summary for:', {
        userId: targetUser.id,
        companyId: targetCompany.id,
      });

      const summaryData = await pointsService.getCompanyPointsSummary(
        targetUser.id,
        targetCompany.id
      );

      if (summaryData) {
        setSummary(summaryData);

        // Set compatibility data
        setUserPoints({
          points_balance: summaryData.currentBalance,
          points_rank: 1, // Mock rank for now
          lifetime_points: summaryData.lifetimePointsEarned,
        });

        setCompanySummary({
          company_total_points: summaryData.totalPointsEarned,
        });

        console.log('✅ Company points summary loaded:', summaryData);
      } else {
        // If no summary exists, create a default one
        const defaultSummary: CompanyPointsSummary = {
          companyId: targetCompany.id,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          currentBalance: 0,
          tierLevel: 'Bronze',
          lifetimePointsEarned: 0,
        };
        setSummary(defaultSummary);

        setUserPoints({
          points_balance: 0,
          points_rank: 1,
          lifetime_points: 0,
        });

        setCompanySummary({
          company_total_points: 0,
        });

        console.log('📋 Using default company points summary');
      }

      // Load recent history only if not in compatibility mode
      if (!userId && !companyId) {
        await loadHistory(10);
      }
    } catch (err) {
      console.error('❌ Error fetching company points:', err);
      setError('Failed to load company points data');
    } finally {
      setIsLoading(false);
    }
  }, [targetUser, targetCompany, userId, companyId]);

  const loadHistory = useCallback(
    async (limit: number = 50) => {
      if (!targetUser || !targetCompany) return;

      try {
        console.log('📜 Loading company points history:', {
          userId: targetUser.id,
          companyId: targetCompany.id,
          limit,
        });

        const historyData = await auditService.getPointsAuditHistory(
          targetUser.id,
          targetCompany.id,
          limit
        );
        setHistory(historyData);

        console.log(`✅ Loaded ${historyData.length} points history entries`);
      } catch (err) {
        console.error('❌ Error loading points history:', err);
        setError('Failed to load points history');
      }
    },
    [targetUser, targetCompany]
  );

  const redeemPoints = useCallback(
    async (points: number, description?: string): Promise<boolean> => {
      if (!user || !company) {
        setError('User or company information not available');
        return false;
      }

      if (!summary || summary.currentBalance < points) {
        setError('Insufficient points for redemption');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('💸 Redeeming company points:', {
          userId: user.id,
          companyId: company.id,
          points,
        });

        const success = await pointsService.redeemPoints(
          user.id,
          company.id,
          points,
          description || 'Points redeemed'
        );

        if (success) {
          // Log the redemption in audit trail
          await auditService.logPointsTransaction(
            user.id,
            company.id,
            'redeemed_voucher',
            -points, // Negative for redemption
            summary.currentBalance,
            summary.currentBalance - points,
            undefined,
            description || 'Points redeemed'
          );

          // Refresh data to reflect changes
          await refreshData();

          console.log('✅ Points redeemed successfully');
          return true;
        } else {
          setError('Failed to redeem points');
          return false;
        }
      } catch (err) {
        console.error('❌ Error redeeming points:', err);
        setError('Failed to redeem points');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, company, summary, refreshData]
  );

  // Load data on mount and when user/company changes
  useEffect(() => {
    if (
      targetUser &&
      targetCompany &&
      (!user || user.accountType === 'company')
    ) {
      refreshData();
    } else {
      setSummary(null);
      setHistory([]);
      setUserPoints(null);
      setCompanySummary(null);
      setError(null);
    }
  }, [targetUser, targetCompany, refreshData]);

  // Helper functions for component use
  const getTierProgress = useCallback(() => {
    if (!summary)
      return { current: 0, next: 50000, percentage: 0, nextTier: 'Silver' };

    const { lifetimePointsEarned, tierLevel } = summary;

    switch (tierLevel) {
      case 'Bronze':
        return {
          current: lifetimePointsEarned,
          next: 50000,
          percentage: (lifetimePointsEarned / 50000) * 100,
          nextTier: 'Silver',
        };
      case 'Silver':
        return {
          current: lifetimePointsEarned,
          next: 200000,
          percentage: ((lifetimePointsEarned - 50000) / (200000 - 50000)) * 100,
          nextTier: 'Gold',
        };
      case 'Gold':
        return {
          current: lifetimePointsEarned,
          next: lifetimePointsEarned, // No next tier
          percentage: 100,
          nextTier: null,
        };
      default:
        return { current: 0, next: 50000, percentage: 0, nextTier: 'Silver' };
    }
  }, [summary]);

  const getPointsUntilNextTier = useCallback(() => {
    if (!summary) return 50000;

    const { lifetimePointsEarned, tierLevel } = summary;

    switch (tierLevel) {
      case 'Bronze':
        return Math.max(0, 50000 - lifetimePointsEarned);
      case 'Silver':
        return Math.max(0, 200000 - lifetimePointsEarned);
      case 'Gold':
        return 0; // Already at highest tier
      default:
        return 50000;
    }
  }, [summary]);

  const formatPointsHistory = useCallback((entry: PointsAuditEntry) => {
    const isEarned = entry.points > 0;
    const isRedemption = entry.transactionType.includes('redeemed');

    return {
      ...entry,
      isEarned,
      isRedemption,
      formattedPoints: isEarned ? `+${entry.points}` : `${entry.points}`,
      formattedDate: new Date(entry.createdAt || '').toLocaleDateString(),
      icon: isEarned ? 'add-circle' : 'remove-circle',
      color: isEarned ? '#10B981' : '#EF4444',
    };
  }, []);

  // Return compatibility interface if userId and companyId are provided
  if (userId && companyId) {
    return {
      userPoints,
      companySummary,
      loading: isLoading,
      error,
    };
  }

  // Return full interface for hook usage
  return {
    // Data
    summary,
    history,
    isLoading,
    error,

    // Actions
    refreshData,
    loadHistory,
    redeemPoints,

    // Helper methods
    getTierProgress,
    getPointsUntilNextTier,
    formatPointsHistory,
  };
}
