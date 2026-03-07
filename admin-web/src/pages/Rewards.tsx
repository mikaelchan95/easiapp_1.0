import { useState, useEffect } from 'react';
import { Gift, Ticket, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
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
        const { data, error } = await supabase
          .from('audit_log')
          .select('*')
          .eq('action', 'missing_points_reported')
          .order('created_at', { ascending: false });
        if (error) throw error;

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
    const { id, created_at, updated_at, ...payload } = data;

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

    toast(editingReward ? 'Reward updated' : 'Reward created', 'success');
    fetchData();
  };

  const handleDeleteReward = async (id: string) => {
    if (window.confirm('Delete this reward?')) {
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

        await supabase.from('points_audit_log').insert({
          user_id: report.user_id,
          transaction_type: 'adjustment',
          points_change: pointsToAdd,
          points_before: currentPoints,
          points_after: currentPoints + pointsToAdd,
          description: `Missing points approved: ${report.metadata.order_id}`,
        });
      }

      const newMetadata = {
        ...report.metadata,
        report_status: approved ? 'resolved' : 'rejected',
      };

      await supabase
        .from('audit_log')
        .update({ metadata: newMetadata })
        .eq('id', report.id);

      toast(
        approved ? 'Points credited and report resolved' : 'Report rejected',
        'success'
      );
      fetchData();
    } catch (error) {
      console.error('Error resolving report', error);
      toast('Could not resolve report. Try again.', 'error');
    }
  };

  const pendingCount = reports.filter(
    r => r.metadata?.report_status === 'reported'
  ).length;

  const tabs = [
    { label: 'Catalog', value: 'catalog', icon: <Gift size={16} /> },
    { label: 'Vouchers', value: 'vouchers', icon: <Ticket size={16} /> },
    {
      label: 'Reports',
      value: 'reports',
      icon: <AlertTriangle size={16} />,
      badge:
        pendingCount > 0 ? (
          <span className="ml-1 bg-black text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
            {pendingCount}
          </span>
        ) : undefined,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Rewards"
        description="Rewards catalog, vouchers, and point requests"
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={v => setActiveTab(v as Tab)}
      />

      <div className="min-h-[400px]">
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
