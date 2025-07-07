import React, { useState } from 'react';
import { ArrowLeft, FileText, TrendingUp, CreditCard } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';
import CreditHeader from './CreditHeader';
import CreditOverview from './CreditOverview';
import CreditInvoiceList from './CreditInvoiceList';
import CreditActivityList from './CreditActivityList';
import InvoiceDetailView from './InvoiceDetailView';
import CreditHistoryView from './CreditHistoryView';

interface CreditDashboardProps {
  onBack: () => void;
}

type CreditView = 'overview' | 'invoices' | 'payments' | 'history';

const CreditDashboard: React.FC<CreditDashboardProps> = ({ onBack }) => {
  const { 
    creditAccount, 
    invoices, 
    payments, 
    loading,
    isCreditEligible
  } = useCredit();
  
  const [currentView, setCurrentView] = useState<CreditView>('overview');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  const selectedInvoice = selectedInvoiceId 
    ? invoices.find(inv => inv.id === selectedInvoiceId)
    : null;

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleCloseInvoice = () => {
    setSelectedInvoiceId(null);
  };

  if (!isCreditEligible) {
    return (
      <>
        <CreditHeader onBack={onBack} title="Credit Account" />
        <div className="page-content flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-6 mt-16">
            <CreditCard className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Credit Account</h3>
          <p className="text-gray-600 mb-8">
            Apply for trade credit to access flexible payment terms
          </p>
          <button
            onClick={onBack}
            className="bg-black text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Go Back
          </button>
        </div>
      </>
    );
  }

  if (selectedInvoice) {
    return <InvoiceDetailView invoice={selectedInvoice} onBack={handleCloseInvoice} />;
  }

  if (currentView === 'history') {
    return <CreditHistoryView onBack={() => setCurrentView('overview')} />;
  }

  return (
    <>
      <CreditHeader 
        onBack={onBack} 
        title="Credit Account" 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="page-content">
        {currentView === 'overview' && (
          <CreditOverview 
            creditAccount={creditAccount}
            recentInvoices={invoices.slice(0, 3)}
            recentPayments={payments.slice(0, 3)}
            onViewInvoice={handleViewInvoice}
            onViewAllInvoices={() => setCurrentView('invoices')}
            onViewAllPayments={() => setCurrentView('payments')}
            onViewHistory={() => setCurrentView('history')}
          />
        )}

        {currentView === 'invoices' && (
          <div className="px-4 py-6">
            <CreditInvoiceList 
              invoices={invoices}
              onViewInvoice={handleViewInvoice}
              isLoading={loading}
            />
          </div>
        )}
        
        {currentView === 'payments' && (
          <div className="px-4 py-6">
            <CreditActivityList 
              payments={payments}
              isLoading={loading}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CreditDashboard;