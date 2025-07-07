import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useCredit } from '../../hooks/useCredit';
import { useNavigationControl } from '../../hooks/useNavigationControl';
import CreditSummary from './CreditSummary';
import InvoiceView from './InvoiceView';

interface CreditManagementProps {
  onBack: () => void;
}

type CreditView = 'overview' | 'invoices' | 'payments' | 'terms';

const CreditManagement: React.FC<CreditManagementProps> = ({ onBack }) => {
  const { 
    creditAccount, 
    invoices, 
    payments, 
    loading,
    formatCurrency 
  } = useCredit();
  const [currentView, setCurrentView] = useState<CreditView>('overview');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  
  // Control navigation visibility
  useNavigationControl();

  if (!creditAccount) {
    return (
      <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
          <CreditCard className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Credit Account</h2>
        <p className="text-gray-600 text-center mb-8">
          Apply for trade credit to access flexible payment terms
        </p>
        <button
          onClick={onBack}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Go Back
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="px-4 py-6 space-y-6">
      <CreditSummary />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900">{invoices.length}</div>
              <div className="text-sm text-gray-600">Invoices</div>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('invoices')}
            className="text-sm font-bold text-blue-600 active:scale-95 transition-transform"
          >
            View All
          </button>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900">{payments.length}</div>
              <div className="text-sm text-gray-600">Payments</div>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('payments')}
            className="text-sm font-bold text-green-600 active:scale-95 transition-transform"
          >
            View All
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
        
        {invoices.length === 0 && payments.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Invoice #{invoice.id.slice(-6)}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(invoice.total)}</div>
                  <div className={`text-xs font-bold ${
                    invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {invoice.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="px-4 py-6 space-y-4">
      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No Invoices</h3>
          <p className="text-gray-600">Invoices will appear here after credit purchases</p>
        </div>
      ) : (
        invoices.map((invoice) => (
          <div key={invoice.id} className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900">#{invoice.id.slice(-6)}</div>
                <div className="text-sm text-gray-600">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{formatCurrency(invoice.total)}</div>
                <div className={`text-xs px-2 py-1 rounded-lg font-bold ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {invoice.status}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedInvoice(invoice.id)}
              className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold active:scale-95 transition-transform"
            >
              View Invoice
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3 mb-6">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Credit Account</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'invoices', name: 'Invoices', icon: FileText }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as CreditView)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                    currentView === tab.id
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 active:scale-95'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto pb-32 scrollbar-hide">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'invoices' && renderInvoices()}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gray-100">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="text-gray-600 text-xl">×</span>
                </button>
              </div>
              <div className="p-4">
                <InvoiceView
                  invoice={invoices.find(inv => inv.id === selectedInvoice)!}
                  onDownload={() => {}}
                  onShare={() => {}}
                  onPayNow={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;