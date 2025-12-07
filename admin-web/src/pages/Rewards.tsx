import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Gift, Ticket, AlertTriangle } from 'lucide-react';
import { RewardList } from '../components/Rewards/RewardList';
import { RewardForm } from '../components/Rewards/RewardForm';
import { RewardVouchers } from '../components/Rewards/RewardVouchers';
import { MissingPointsReports } from '../components/Rewards/MissingPointsReports';
import type { RewardCatalogItem } from '../types/reward';
import { useToast } from '../components/ui/Toast';

type Tab = 'catalog' | 'vouchers' | 'reports';

export default function Rewards() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardCatalogItem | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'catalog') {
        const { data, error } = await supabase
          .from('reward_catalog')
          .select('*')
          .order('points_required', { ascending: true });
        if (error) throw error;
        setRewards(data || []);
      } else if (activeTab === 'vouchers') {
        const { data, error } = await supabase
          .from('user_vouchers')
          .select(
            '*, user:users(id, name, email), redemption:reward_redemptions(reward:reward_catalog(title))'
          )
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setVouchers(data || []);
      } else if (activeTab === 'reports') {
        // Fetch audit logs for missing points
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .eq('action', 'missing_points_reported')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform audit logs to reports
        // Need to fetch user details associated with these logs
        const enrichedReports = await Promise.all(
          (data || []).map(async log => {
            const { data: user } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', log.user_id)
              .single();
            return {
              id: log.id,
              user_id: log.user_id,
              user_name: user?.name,
              user_email: user?.email,
              created_at: log.created_at,
              metadata: log.metadata,
            };
          })
        );

        setReports(enrichedReports);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReward = async (data: Partial<RewardCatalogItem>) => {
    let error;
    // Sanitize data: remove id, created_at, updated_at from payload
    const { id, created_at, updated_at, ...payload } = data;

    console.log('Saving reward payload:', payload);

    if (editingReward) {
      const { error: updateError } = await supabase
        .from('reward_catalog')
        .update(payload)
        .eq('id', editingReward.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('reward_catalog')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving reward:', error);
      toast('Failed to save reward: ' + error.message, 'error');
      throw error;
    }

    toast(
      editingReward
        ? 'Reward updated successfully'
        : 'Reward created successfully',
      'success'
    );
    fetchData(); // Refresh
  };

  const handleDeleteReward = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      await supabase.from('reward_catalog').delete().eq('id', id);
      fetchData();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('reward_catalog')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchData();
  };

  const handleResolveReport = async (report: any, approved: boolean) => {
    try {
      if (approved) {
        // 1. Credit points
        const { data: user } = await supabase
          .from('users')
          .select('points')
          .eq('id', report.user_id)
          .single();
        const currentPoints = user?.points || 0;
        const pointsToAdd = report.metadata.expected_points;

        const { error: updateError } = await supabase
          .from('users')
          .update({ points: currentPoints + pointsToAdd })
          .eq('id', report.user_id);

        if (updateError) throw updateError;

        // 2. Log credit audit
        await supabase.from('points_audit_log').insert({
          user_id: report.user_id,
          transaction_type: 'adjustment',
          points_change: pointsToAdd,
          points_before: currentPoints,
          points_after: currentPoints + pointsToAdd,
          description: `Missing points approved: ${report.metadata.order_id}`,
        });
      }

      // 3. Update the original audit log metadata to show status
      // Note: Updating audit log isn't ideal but we are using it as storage here.
      // Ideally we would move to a real table. For now, we update the metadata.
      const newMetadata = {
        ...report.metadata,
        report_status: approved ? 'resolved' : 'rejected',
      };

      await supabase
        .from('audit_log')
        .update({ metadata: newMetadata })
        .eq('id', report.id);

      alert(
        approved ? 'Points credited and report resolved.' : 'Report rejected.'
      );
      fetchData();
    } catch (error) {
      console.error('Error resolving report', error);
      alert('Failed to resolve report');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Loyalty & Rewards
        </h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base">
          Manage reward catalog, vouchers, and user requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 sm:gap-4 border-b border-[var(--border-primary)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 flex items-center gap-2 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'catalog'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift size={18} />
          <span>Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 flex items-center gap-2 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'vouchers'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Ticket size={18} />
          <span className="hidden sm:inline">Issued Vouchers</span>
          <span className="sm:hidden">Vouchers</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation ${
            activeTab === 'reports'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <AlertTriangle size={18} />
          <span className="hidden sm:inline">Missing Points</span>
          <span className="sm:hidden">Reports</span>
          {reports.filter(r => r.metadata?.report_status === 'reported')
            .length > 0 && (
            <span className="bg-red-500 dark:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {
                reports.filter(r => r.metadata?.report_status === 'reported')
                  .length
              }
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'catalog' && (
          <RewardList
            rewards={rewards}
            isLoading={loading}
            onEdit={(r: RewardCatalogItem) => {
              setEditingReward(r);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteReward}
            onCreate={() => {
              setEditingReward(null);
              setIsFormOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab === 'vouchers' && (
          <RewardVouchers vouchers={vouchers} isLoading={loading} />
        )}

        {activeTab === 'reports' && (
          <MissingPointsReports
            reports={reports}
            isLoading={loading}
            onResolve={handleResolveReport}
          />
        )}
      </div>

      <RewardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveReward}
        reward={editingReward}
      />
    </div>
  );
}
