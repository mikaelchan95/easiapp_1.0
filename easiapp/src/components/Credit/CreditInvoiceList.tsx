import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { CreditInvoice } from '../../types/credit';
import { formatDaysUntilDue } from '../../utils/credit';

interface CreditInvoiceListProps {
  invoices: CreditInvoice[];
  onViewInvoice: (invoiceId: string) => void;
  isLoading?: boolean;
}

const CreditInvoiceList: React.FC<CreditInvoiceListProps> = ({ 
  invoices, 
  onViewInvoice,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="w-16 h-5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
        <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No invoices yet</p>
      </div>
    );
  }

  const getStatusIcon = (status: string, dueDate: string) => {
    if (status === 'paid') {
      return <CheckCircle className="w-5 h-5 text-primary-600" />;
    }
    
    const now = new Date();
    const due = new Date(dueDate);
    
    if (now > due) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    
    return <Clock className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-2.5">
      {invoices.map((invoice) => {
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
        
        return (
          <button
            key={invoice.id}
            onClick={() => onViewInvoice(invoice.id)}
            className="w-full bg-white rounded-xl p-3.5 border border-gray-200 text-left active:scale-98 transition-all flex items-center space-x-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              invoice.status === 'paid' ? 'bg-primary-100' : 
              isOverdue ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {getStatusIcon(invoice.status, invoice.dueDate)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 leading-tight">INV-{invoice.id.slice(-6)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-gray-900">${invoice.total.toFixed(0)}</p>
              <p className={`text-xs font-bold ${
                invoice.status === 'paid' ? 'text-primary-600' : 
                isOverdue ? 'text-red-600' : 'text-blue-600'
              }`}>
                {invoice.status === 'paid' ? 'Paid' : formatDaysUntilDue(invoice.dueDate)}
              </p>
            </div>
            
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
};

export default CreditInvoiceList;