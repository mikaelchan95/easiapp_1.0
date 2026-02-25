import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Gift,
  Ticket,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';
import { RewardList } from '../components/Rewards/RewardList';
import { RewardForm } from '../components/Rewards/RewardForm';
import { RewardVouchers } from '../components/Rewards/RewardVouchers';
import { MissingPointsReports } from '../components/Rewards/MissingPointsReports';
import type { RewardCatalogItem } from '../types/reward';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';

type Tab = 'catalog' | 'vouchers' | 'reports';

interface Stats {
  totalRewards: number;
  activeRewards: number;
  totalVouchers: number;
  activeVouchers: number;
  pendingReports: number;
  totalPointsRedeemed: number;
}

export default function Rewards() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRewards: 0,
    activeRewards: 0,
    totalVouchers: 0,
    activeVouchers: 0,
    pendingReports: 0,
    totalPointsRedeemed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardCatalogItem | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    fetchStats();
  }, [rewards, vouchers, reports]);

  const fetchStats = () => {
    setStats({
      totalRewards: rewards.length,
      activeRewards: rewards.filter(r => r.is_active).length,
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter(v => v.voucher_status === 'active')
        .length,
      pendingReports: reports.filter(
        r => r.metadata?.report_status === 'reported'
      ).length,
      totalPointsRedeemed: rewards.reduce(
        (sum, r) => sum + (r.points_required || 0),
        0
      ),
    });
  };

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
          .limit(100);
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

    toast(
      editingReward
        ? 'Reward updated successfully'
        : 'Reward created successfully',
      'success'
    );
    fetchData();
  };

  const handleDeleteReward = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      await supabase.from('reward_catalog').delete().eq('id', id);
      toast('Reward deleted successfully', 'success');
      fetchData();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('reward_catalog')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    toast(
      `Reward ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      'success'
    );
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
        approved ? 'Points credited successfully' : 'Report rejected',
        'success'
      );
      fetchData();
    } catch (error) {
      console.error('Error resolving report', error);
      toast('Failed to resolve report', 'error');
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
  }: {
    icon: any;
    label: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
        <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
          <Icon size={18} className="text-[var(--text-primary)]" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Actions */}
      {activeTab === 'catalog' && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditingReward(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--text-primary)] text-[var(--color-primary-text)] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            <span>New Reward</span>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Gift}
          label="Total Rewards"
          value={stats.totalRewards}
          subtitle="In catalog"
        />
        <StatCard
          icon={TrendingUp}
          label="Active"
          value={stats.activeRewards}
          subtitle="Currently available"
        />
        <StatCard
          icon={Ticket}
          label="Vouchers"
          value={stats.totalVouchers}
          subtitle={`${stats.activeVouchers} active`}
        />
        <StatCard
          icon={Users}
          label="Reports"
          value={stats.pendingReports}
          subtitle="Pending review"
        />
        <StatCard
          icon={DollarSign}
          label="Points Pool"
          value={stats.totalPointsRedeemed.toLocaleString()}
          subtitle="Total value"
        />
        <StatCard
          icon={Gift}
          label="Redemptions"
          value={vouchers.filter(v => v.voucher_status === 'used').length}
          subtitle="Completed"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-default)]">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-1 pb-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'catalog'
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            <Gift size={16} />
            Catalog
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex items-center gap-2 px-1 pb-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'vouchers'
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            <Ticket size={16} />
            Vouchers
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-1 pb-3 font-medium text-sm border-b-2 transition-colors relative ${
              activeTab === 'reports'
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            <AlertTriangle size={16} />
            Reports
            {stats.pendingReports > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {stats.pendingReports}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-bg)] transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors">
          <Filter size={16} />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'catalog' && (
          <RewardList
            rewards={rewards}
            isLoading={loading}
            searchQuery={searchQuery}
            onEdit={(r: RewardCatalogItem) => {
              setEditingReward(r);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteReward}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab === 'vouchers' && (
          <RewardVouchers
            vouchers={vouchers}
            isLoading={loading}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'reports' && (
          <MissingPointsReports
            reports={reports}
            isLoading={loading}
            searchQuery={searchQuery}
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
