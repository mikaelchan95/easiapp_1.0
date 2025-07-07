import React from 'react';
import { Download, Calendar, CheckCircle, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react';
import { CreditInvoice } from '../../types/credit';
import { useCredit } from '../../hooks/useCredit';
import { formatDaysUntilDue } from '../../utils/credit';

interface InvoiceDetailViewProps {
  invoice: CreditInvoice;
  onBack: () => void;
  makePayment?: (invoiceId: string, amount: number) => Promise<any>;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  makePayment
}) => {
  const { formatCurrency, makePayment: defaultMakePayment } = useCredit();
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  
  const actualMakePayment = makePayment || defaultMakePayment;
  
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
  const isPaid = invoice.status === 'paid';

  const handlePayNow = async () => {
    if (isProcessingPayment || isPaid) return;
    
    setIsProcessingPayment(true);
    
    try {
      await actualMakePayment(invoice.id, invoice.total);
      // Success would be handled by the Credit context
      
      // Haptic feedback for success
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50, 30, 100]);
      }
    } catch (error) {
      console.error('Payment failed', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="page-container bg-gray-50 max-w-sm mx-auto">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-gray-900">Invoice #{invoice.id.slice(-6)}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  isPaid ? 'bg-primary-100 text-primary-700' : 
                  isOverdue ? 'bg-red-100 text-red-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{new Date(invoice.issueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content pb-24">
        <div className="px-4 py-4 space-y-4">
          {/* Status Summary */}
          <div className={`p-3 rounded-xl border ${
            isPaid ? 'bg-primary-50 border-primary-100' : 
            isOverdue ? 'bg-red-50 border-red-100' : 
            'bg-blue-50 border-blue-100'
          }`}>
            <div className="flex items-center space-x-3">
              {isPaid ? (
                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
              ) : isOverdue ? (
                <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
              
              <div>
                <h3 className={`font-bold ${
                  isPaid ? 'text-primary-900' : 
                  isOverdue ? 'text-red-900' : 
                  'text-blue-900'
                }`}>
                  {isPaid ? 'Payment Received' : isOverdue ? 'Payment Overdue' : 'Payment Due'}
                </h3>
                <p className={`text-sm ${
                  isPaid ? 'text-primary-700' : 
                  isOverdue ? 'text-red-700' : 
                  'text-blue-700'
                }`}>
                  {isPaid ? 
                    (invoice.paidDate ? `Paid on ${new Date(invoice.paidDate).toLocaleDateString()}` : 'Payment received') : 
                    formatDaysUntilDue(invoice.dueDate)
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Order Reference */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Order Reference</div>
                <div className="font-bold text-gray-900">#{invoice.orderId.slice(-6)}</div>
              </div>
              <button className="text-xs bg-gray-100 text-gray-700 font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 active:scale-95 transition-transform">
                <span>Order Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* Invoice Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3.5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Invoice Items</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between p-3.5">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-gray-900 mb-0.5 leading-tight text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.quantity} × ${item.unitPrice.toFixed(0)} • {item.sku}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">${item.total.toFixed(0)}</div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-gray-900">${invoice.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (9%)</span>
                  <span className="font-bold text-gray-900">${invoice.taxAmount.toFixed(0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">${invoice.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Terms */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <div className="flex items-center space-x-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-0.5">Payment Terms</h4>
                <p className="text-xs text-blue-700">
                  Net {invoice.paymentTerms} days from invoice date.
                  Due by {new Date(invoice.dueDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-4 max-w-sm mx-auto pb-[calc(var(--sab,0px)+16px)]">
        <div className="flex space-x-3">
          <button
            onClick={() => {}}
            className="w-12 bg-gray-100 text-gray-900 border border-gray-200 py-3 rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm"
          >
            <Download className="w-4.5 h-4.5" />
          </button>
          
          {isPaid ? (
            <button
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
            >
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Paid • ${invoice.total.toFixed(0)}</span>
            </button>
          ) : (
            <button
              onClick={handlePayNow}
              disabled={isProcessingPayment}
              className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-70"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Pay Now • ${invoice.total.toFixed(0)}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailView;