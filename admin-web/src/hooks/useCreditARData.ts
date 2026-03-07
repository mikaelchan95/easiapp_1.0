import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreditKPIs {
  totalExtended: number;
  totalUsed: number;
  utilization: number;
  totalOutstanding: number;
  overdueAmount: number;
  avgDaysToPay: number;
}

export interface AgingChartBucket {
  month: string;
  current: number;
  mid: number;
  overdue: number;
}

export interface CompanyRow {
  id: string;
  name: string;
  uen: string;
  initials: string;
  creditLimit: number;
  creditUsed: number;
  utilization: number;
  overdueAmount: number;
  oldestOverdueDays: number;
}

export interface CreditARData {
  kpis: CreditKPIs;
  agingChart: AgingChartBucket[];
  companies: CompanyRow[];
  loading: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCreditARData(): CreditARData {
  const [data, setData] = useState<CreditARData>({
    kpis: {
      totalExtended: 0,
      totalUsed: 0,
      utilization: 0,
      totalOutstanding: 0,
      overdueAmount: 0,
      avgDaysToPay: 0,
    },
    agingChart: [],
    companies: [],
    loading: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [companiesRes, invoicesRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, uen, credit_limit, current_credit, payment_terms'),
        supabase
          .from('invoices')
          .select(
            'id, total_amount, billing_amount, paid_amount, remaining_amount, outstanding_amount, due_date, payment_due_date, status, company_id, created_at'
          )
          .in('status', ['outstanding', 'partial_paid', 'overdue', 'pending']),
      ]);

      const companies = companiesRes.data ?? [];
      const invoices = invoicesRes.data ?? [];
      const now = new Date();

      // ── KPIs ────────────────────────────────────────────────────────────

      const totalExtended = companies.reduce(
        (s, c) => s + (Number(c.credit_limit) || 0),
        0
      );
      const totalUsed = companies.reduce(
        (s, c) => s + (Number(c.current_credit) || 0),
        0
      );
      const utilization =
        totalExtended > 0 ? (totalUsed / totalExtended) * 100 : 0;

      let totalOutstanding = 0;
      let overdueAmount = 0;
      let totalDays = 0;
      let invoiceCount = 0;

      for (const inv of invoices) {
        const amt =
          Number(inv.remaining_amount) ||
          Number(inv.outstanding_amount) ||
          Number(inv.total_amount) ||
          Number(inv.billing_amount) ||
          0;
        totalOutstanding += amt;

        const dueDate = inv.due_date || inv.payment_due_date;
        if (dueDate && new Date(dueDate) < now) {
          overdueAmount += amt;
        }

        const created = new Date(inv.created_at);
        totalDays += daysBetween(now, created);
        invoiceCount++;
      }

      const avgDaysToPay =
        invoiceCount > 0 ? Math.round(totalDays / invoiceCount) : 0;

      // ── AR Aging Chart (last 5 months) ──────────────────────────────────

      const agingChart: AgingChartBucket[] = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const label = d.toLocaleDateString('en-US', { month: 'short' });

        let current = 0;
        let mid = 0;
        let overdue = 0;

        for (const inv of invoices) {
          const created = new Date(inv.created_at);
          if (created < d || created > monthEnd) continue;

          const amt =
            Number(inv.remaining_amount) ||
            Number(inv.outstanding_amount) ||
            Number(inv.total_amount) ||
            Number(inv.billing_amount) ||
            0;

          const dueDate = inv.due_date || inv.payment_due_date;
          if (!dueDate) {
            current += amt;
            continue;
          }

          const days = daysBetween(now, new Date(dueDate));
          const isPast = new Date(dueDate) < now;

          if (!isPast) {
            current += amt;
          } else if (days <= 60) {
            mid += amt;
          } else {
            overdue += amt;
          }
        }

        agingChart.push({ month: label, current, mid, overdue });
      }

      // ── Company Rows ────────────────────────────────────────────────────

      const invoicesByCompany = new Map<
        string,
        { overdueAmt: number; oldestDays: number }
      >();

      for (const inv of invoices) {
        if (!inv.company_id) continue;
        const dueDate = inv.due_date || inv.payment_due_date;
        const isPast = dueDate ? new Date(dueDate) < now : false;

        if (!isPast) continue;

        const amt =
          Number(inv.remaining_amount) ||
          Number(inv.outstanding_amount) ||
          Number(inv.total_amount) ||
          Number(inv.billing_amount) ||
          0;
        const days = dueDate ? daysBetween(now, new Date(dueDate)) : 0;

        const existing = invoicesByCompany.get(inv.company_id) ?? {
          overdueAmt: 0,
          oldestDays: 0,
        };
        existing.overdueAmt += amt;
        existing.oldestDays = Math.max(existing.oldestDays, days);
        invoicesByCompany.set(inv.company_id, existing);
      }

      const companyRows: CompanyRow[] = companies
        .map(c => {
          const limit = Number(c.credit_limit) || 0;
          const used = Number(c.current_credit) || 0;
          const util = limit > 0 ? (used / limit) * 100 : 0;
          const invData = invoicesByCompany.get(c.id);

          return {
            id: c.id,
            name: c.name,
            uen: c.uen || '',
            initials: initials(c.name),
            creditLimit: limit,
            creditUsed: used,
            utilization: util,
            overdueAmount: invData?.overdueAmt ?? 0,
            oldestOverdueDays: invData?.oldestDays ?? 0,
          };
        })
        .sort((a, b) => b.utilization - a.utilization);

      setData({
        kpis: {
          totalExtended,
          totalUsed,
          utilization,
          totalOutstanding,
          overdueAmount,
          avgDaysToPay,
        },
        agingChart,
        companies: companyRows,
        loading: false,
      });
    } catch (err) {
      console.error('Credit & AR data fetch error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  return data;
}
