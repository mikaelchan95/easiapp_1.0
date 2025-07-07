import React, { useState } from 'react';
import { useNavigationControl } from '../../hooks/useNavigationControl';
import CreditHeader from '../../components/Credit/CreditHeader';
import CreditOverview from '../../components/Credit/CreditOverview';
import CreditInvoiceList from '../../components/Credit/CreditInvoiceList';
import CreditActivityList from '../../components/Credit/CreditActivityList';
import InvoiceDetailView from '../../components/Credit/InvoiceDetailView';
import CreditHistoryView from '../../components/Credit/CreditHistoryView';
import CreditPaymentSuccess from '../../components/Credit/CreditPaymentSuccess';
import { useCredit } from '../../hooks/useCredit';
import { CreditCard } from 'lucide-react';

interface CreditManagementProps {
  onBack: () => void;
}

type CreditView = 'overview' | 'invoices' | 'payments' | 'history';

const CreditManagement: React.FC<CreditManagementProps> = ({ onBack }) => {
  const { 
    creditAccount, 
    invoices, 
    payments, 
    loading,
    isCreditEligible,
    makePayment
  } = useCredit();
  
  const [currentView, setCurrentView] = useState<CreditView>('overview');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<any>(null);
  
  // Control navigation visibility
  useNavigationControl();
  
  const selectedInvoice = selectedInvoiceId 
    ? invoices.find(inv => inv.id === selectedInvoiceId)
    : null;

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleCloseInvoice = () => {
    setSelectedInvoiceId(null);
  };

  const handlePaymentSuccess = (payment: any) => {
    setSuccessPayment(payment);
    setSelectedInvoiceId(null);
  };

  const handleCloseSuccess = () => {
    setSuccessPayment(null);
    setCurrentView('invoices');
  };

  // Override the makePayment function to capture the success
  const handleMakePayment = async (invoiceId: string, amount: number) => {
    try {
      const payment = await makePayment(invoiceId, amount);
      handlePaymentSuccess(payment);
      return payment;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  };

  if (!isCreditEligible) {
    return (
      <div className="page-container bg-gray-50">
        <CreditHeader onBack={onBack} title="Credit Account" />
        
        <div className="page-content flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 mt-16">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Credit Account</h3>
          <p className="text-gray-600 mb-8">
            Apply for trade credit to access flexible payment terms
          </p>
          <button
            onClick={onBack}
            className="bg-black text-white px-8 py-4 rounded-xl font-bold active:scale-95 transition-transform"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (selectedInvoice) {
    // Create a new component instance with our custom makePayment handler
    return (
      <InvoiceDetailView 
        invoice={selectedInvoice} 
        onBack={handleCloseInvoice}
        makePayment={handleMakePayment}
      />
    );
  }

  if (successPayment) {
    return (
      <CreditPaymentSuccess
        payment={successPayment}
        onViewInvoices={handleCloseSuccess}
        onClose={handleCloseSuccess}
      />
    );
  }

  if (currentView === 'history') {
    return <CreditHistoryView onBack={() => setCurrentView('overview')} />;
  }

  return (
    <div className="page-container bg-gray-50">
      <CreditHeader 
        onBack={onBack} 
        title="Credit Account" 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="page-content pb-20">
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
          <div className="px-4 py-4">
            <CreditInvoiceList 
              invoices={invoices}
              onViewInvoice={handleViewInvoice}
              isLoading={loading}
            />
          </div>
        )}
        
        {currentView === 'payments' && (
          <div className="px-4 py-4">
            <CreditActivityList 
              payments={payments}
              isLoading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditManagement;