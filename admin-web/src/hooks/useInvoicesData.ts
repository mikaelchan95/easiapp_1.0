import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice } from '../types';

export interface InvoiceKPIs {
  totalOutstanding: number;
  totalOverdue: number;
  totalPaidThisMonth: number;
  outstandingTrend: number | null;
  overdueTrend: number | null;
  paidTrend: number | null;
}

export interface EnrichedInvoice extends Invoice {
  daysOverdue: number;
  customerName: string;
  customerDetail: string;
  isCompany: boolean;
}

export interface InvoicesData {
  invoices: EnrichedInvoice[];
  kpis: InvoiceKPIs;
  loading: boolean;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function useInvoicesData(): InvoicesData {
  const [data, setData] = useState<InvoicesData>({
    invoices: [],
    kpis: {
      totalOutstanding: 0,
      totalOverdue: 0,
      totalPaidThisMonth: 0,
      outstandingTrend: null,
      overdueTrend: null,
      paidTrend: null,
    },
    loading: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const { data: raw, error } = await supabase
        .from('company_invoices')
        .select('*, company:companies(name, uen)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Invoices fetch error:', error);
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const invoices = (raw ?? []) as (Invoice & {
        company?: { name: string; uen?: string };
      })[];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalOutstanding = 0;
      let totalOverdue = 0;
      let totalPaidThisMonth = 0;

      const enriched: EnrichedInvoice[] = invoices.map(inv => {
        const amt = Number(inv.billing_amount) || Number(inv.total_amount) || 0;
        const outAmt =
          Number(inv.outstanding_amount) ||
          Number(inv.remaining_amount) ||
          (inv.status === 'paid' ? 0 : amt);

        const dueDate = inv.payment_due_date || inv.due_date;
        const daysOverdue = dueDate
          ? Math.max(0, daysBetween(now, new Date(dueDate)))
          : 0;

        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          totalOutstanding += outAmt;
        }
        if (inv.status === 'overdue') {
          totalOverdue += outAmt;
        }
        if (inv.status === 'paid' && new Date(inv.created_at) >= monthStart) {
          totalPaidThisMonth += amt;
        }

        const companyData = inv.company as
          | { name: string; uen?: string }
          | undefined;

        return {
          ...inv,
          daysOverdue,
          customerName: companyData?.name || 'Unknown',
          customerDetail: companyData?.uen || '',
          isCompany: !!inv.company_id,
        } as EnrichedInvoice;
      });

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59
      );

      let prevOutstanding = 0;
      let prevOverdue = 0;
      let prevPaid = 0;

      for (const inv of invoices) {
        const created = new Date(inv.created_at);
        if (created < prevMonthStart || created > prevMonthEnd) continue;

        const invAmt =
          Number(inv.billing_amount) || Number(inv.total_amount) || 0;
        const invOut =
          Number(inv.outstanding_amount) ||
          Number(inv.remaining_amount) ||
          (inv.status === 'paid' ? 0 : invAmt);

        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          prevOutstanding += invOut;
        }
        if (inv.status === 'overdue') {
          prevOverdue += invOut;
        }
        if (inv.status === 'paid') {
          prevPaid += invAmt;
        }
      }

      function pctChange(cur: number, prev: number): number | null {
        if (prev === 0) return cur > 0 ? 100 : null;
        return ((cur - prev) / prev) * 100;
      }

      setData({
        invoices: enriched,
        kpis: {
          totalOutstanding,
          totalOverdue,
          totalPaidThisMonth,
          outstandingTrend: pctChange(totalOutstanding, prevOutstanding),
          overdueTrend: pctChange(totalOverdue, prevOverdue),
          paidTrend: pctChange(totalPaidThisMonth, prevPaid),
        },
        loading: false,
      });
    } catch (err) {
      console.error('Invoices fetch error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  return data;
}
