import React from 'react';
import { Download, Share2, Calendar, CreditCard } from 'lucide-react';
import { CreditInvoice } from '../../types/credit';
import { formatDaysUntilDue, formatInvoiceNumber } from '../../utils/credit';

interface InvoiceViewProps {
  invoice: CreditInvoice;
  onDownload?: () => void;
  onShare?: () => void;
  onPayNow?: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoice,
  onDownload,
  onShare,
  onPayNow
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-xl">Invoice</h3>
            <p className="text-gray-300">#{formatInvoiceNumber(invoice.id)}</p>
          </div>
          <div className={`px-3 py-2 rounded-lg border font-bold text-sm ${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-300 text-sm">Issue Date</div>
            <div className="font-bold">{new Date(invoice.issueDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-300 text-sm">Due Date</div>
            <div className="font-bold">
              {new Date(invoice.dueDate).toLocaleDateString()}
              <div className="text-sm text-gray-300">
                {formatDaysUntilDue(invoice.dueDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Items */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 mb-4">Items</h4>
          <div className="space-y-3">
            {invoice.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.quantity} × {formatCurrency(item.unitPrice)} • SKU: {item.sku}
                  </div>
                </div>
                <div className="font-bold text-gray-900">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST (9%)</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900 text-xl">Total</span>
              <span className="font-bold text-2xl text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-bold text-blue-900 mb-1">Payment Terms</h5>
              <p className="text-sm text-blue-700">
                Net {invoice.paymentTerms} days from invoice date. 
                Payment due by {new Date(invoice.dueDate).toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {invoice.status === 'pending' && onPayNow && (
            <button
              onClick={onPayNow}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
            >
              <CreditCard className="w-5 h-5" />
              <span>Pay Now • {formatCurrency(invoice.total)}</span>
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {onDownload && (
              <button
                onClick={onDownload}
                className="bg-gray-100 text-gray-900 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="bg-gray-100 text-gray-900 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;