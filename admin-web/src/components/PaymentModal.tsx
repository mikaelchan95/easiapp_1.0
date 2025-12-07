import React, { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { Invoice } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(
    invoice.outstanding_amount?.toString() || ''
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('invoice_payments').insert({
        invoice_id: invoice.id,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: reference,
        notes: notes,
      });

      if (error) throw error;

      onPaymentSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment - ${invoice.invoice_number}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Payment Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            required
            max={invoice.outstanding_amount}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Outstanding: ${invoice.outstanding_amount?.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Payment Date
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Reference Number
          </label>
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="e.g. Transaction ID, Cheque No."
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2.5 text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
