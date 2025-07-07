import React from 'react';
import { FileText, ChevronRight, Sparkles } from 'lucide-react';
import { CreditAccount, CreditInvoice, CreditPayment } from '../../types/credit';
import CreditUsageCard from './CreditUsageCard';
import CreditBalanceGrid from './CreditBalanceGrid';
import CreditInvoiceList from './CreditInvoiceList';

interface CreditOverviewProps {
  creditAccount: CreditAccount | null;
  recentInvoices: CreditInvoice[];
  recentPayments: CreditPayment[];
  onViewInvoice: (invoiceId: string) => void;
  onViewAllInvoices: () => void;
  onViewAllPayments: () => void;
  onViewHistory: () => void;
}

const CreditOverview: React.FC<CreditOverviewProps> = ({
  creditAccount,
  recentInvoices,
  recentPayments,
  onViewInvoice,
  onViewAllInvoices,
  onViewAllPayments,
  onViewHistory
}) => {
  if (!creditAccount) return null;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Credit Usage Card */}
      <CreditUsageCard creditAccount={creditAccount} onViewHistory={onViewHistory} />
      
      {/* Balance & Metrics Grid */}
      <CreditBalanceGrid creditAccount={creditAccount} />
      
      {/* Recent Invoices */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Recent Invoices</h2>
          <button 
            onClick={onViewAllInvoices}
            className="text-sm font-bold text-black flex items-center space-x-1 active:scale-95 transition-transform"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <CreditInvoiceList 
          invoices={recentInvoices}
          onViewInvoice={onViewInvoice}
        />

        {recentInvoices.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Ready to Go</h3>
            <p className="text-sm text-gray-500 mb-3">Your credit account is all set up</p>
            <button className="bg-black text-white py-2 px-4 rounded-lg text-sm font-bold inline-flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Learn About Credit Terms</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Credit Information */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-900">Credit Terms</h3>
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800">
            Net {creditAccount.paymentTerms}
          </span>
        </div>
        
        <div className="space-y-2 text-sm divide-y divide-gray-100">
          <div className="flex justify-between pb-2">
            <span className="text-gray-600">Payment Terms</span>
            <span className="font-bold text-gray-900">{creditAccount.paymentTerms} days</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Credit Score</span>
            <span className="font-bold text-gray-900">{creditAccount.creditScore}</span>
          </div>
          
          {creditAccount.nextPaymentDue && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-600">Next Payment</span>
              <span className="font-bold text-gray-900">
                {new Date(creditAccount.nextPaymentDue).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3">
          <button
            onClick={onViewHistory}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
          >
            <span>View Credit History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditOverview;