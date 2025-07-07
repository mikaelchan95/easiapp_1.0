import React from 'react';
import { useCredit } from '../../hooks/useCredit';
import { CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { CreditAccount } from '../../types/credit';

interface CreditHistoryViewProps {
  onBack: () => void;
}

const CreditHistoryView: React.FC<CreditHistoryViewProps> = ({ onBack }) => {
  const { creditAccount, invoices, payments, formatCurrency } = useCredit();
  
  // Create a merged timeline of credit activities
  const createTimeline = () => {
    const timeline: any[] = [];
    
    // Add invoices to timeline
    invoices.forEach(invoice => {
      timeline.push({
        type: 'invoice',
        date: new Date(invoice.issueDate),
        amount: invoice.total,
        id: invoice.id,
        status: invoice.status,
        dueDate: new Date(invoice.dueDate),
        reference: `Order #${invoice.orderId.slice(-6)}`
      });
    });
    
    // Add payments to timeline
    payments.forEach(payment => {
      timeline.push({
        type: 'payment',
        date: new Date(payment.paymentDate),
        amount: payment.amount,
        id: payment.id,
        status: payment.status,
        reference: payment.reference
      });
    });
    
    // Sort by date, most recent first
    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timeline = createTimeline();

  return (
    <div className="page-container bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-gray-900">Credit History</h1>
          </div>
        </div>
      </div>

      <div className="page-content pb-20">
        <div className="px-4 py-4 space-y-4">
          {/* Credit Overview */}
          <CreditAccountHistory creditAccount={creditAccount} />
          
          {/* Timeline */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 px-0.5">Activity Timeline</h2>
            
            <div className="space-y-0.5">
              {timeline.length > 0 ? (
                timeline.map((activity, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-3 flex items-start space-x-3"
                  >
                    {activity.type === 'invoice' ? (
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="w-4 h-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ArrowDownLeft className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <p className="font-bold text-gray-900 text-sm">
                          {activity.type === 'invoice' ? 'Invoice Created' : 'Payment Received'}
                        </p>
                        <p className={`font-bold text-sm ${activity.type === 'invoice' ? 'text-blue-600' : 'text-primary-600'}`}>
                          {activity.type === 'invoice' ? '-' : '+'}{formatCurrency(activity.amount)}
                        </p>
                      </div>
                      
                      <div className="flex justify-between">
                        <p className="text-xs text-gray-600">
                          {activity.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </p>
                        <p className={`text-xs font-medium ${
                          activity.type === 'invoice' && activity.status === 'paid' ? 'text-primary-600' :
                          activity.type === 'invoice' && new Date() > activity.dueDate && activity.status !== 'paid' ? 'text-red-600' :
                          activity.type === 'payment' ? 'text-primary-600' :
                          'text-gray-600'
                        }`}>
                          {activity.reference}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                  <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreditAccountHistoryProps {
  creditAccount: CreditAccount | null;
}

const CreditAccountHistory: React.FC<CreditAccountHistoryProps> = ({ creditAccount }) => {
  const { formatCurrency, creditUtilization } = useCredit();
  
  if (!creditAccount) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
          <CreditCard className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base">Credit Summary</h2>
          <p className="text-xs text-gray-600">Account overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="text-xs text-gray-500 mb-0.5">Credit Limit</div>
          <div className="font-bold text-gray-900 text-base">{formatCurrency(creditAccount.creditLimit)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="text-xs text-gray-500 mb-0.5">Available</div>
          <div className="font-bold text-gray-900 text-base">{formatCurrency(creditAccount.availableCredit)}</div>
        </div>
      </div>
      
      {/* Credit Usage Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Credit Usage</span>
          </div>
          <span className="text-xs font-bold text-gray-900">{creditUtilization.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-1.5 rounded-full transition-all ${
              creditUtilization >= 90 ? 'bg-red-500' :
              creditUtilization >= 70 ? 'bg-yellow-500' :
              'bg-primary-500'
            }`}
            style={{ width: `${Math.min(creditUtilization, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Credit Stats */}
      <div className="space-y-1 text-sm divide-y divide-gray-100">
        <div className="flex justify-between py-1">
          <span className="text-xs text-gray-600">Approved Date</span>
          <span className="text-xs font-medium text-gray-900">
            {new Date(creditAccount.approvedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-xs text-gray-600">Payment Terms</span>
          <span className="text-xs font-medium text-gray-900">Net {creditAccount.paymentTerms} days</span>
        </div>
      </div>
    </div>
  );
};

export default CreditHistoryView;