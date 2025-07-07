import React from 'react';
import { ArrowLeft, FileText, TrendingUp, Clock } from 'lucide-react';

interface CreditHeaderProps {
  onBack: () => void;
  title: string;
  currentView?: 'overview' | 'invoices' | 'payments';
  onViewChange?: (view: 'overview' | 'invoices' | 'payments') => void;
}

const CreditHeader: React.FC<CreditHeaderProps> = ({ 
  onBack, 
  title,
  currentView = 'overview',
  onViewChange
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3 mb-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        </div>

        {onViewChange && (
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'invoices', name: 'Invoices', icon: FileText },
              { id: 'payments', name: 'Activity', icon: Clock }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onViewChange(tab.id as any)}
                  className={`flex-1 py-2.5 px-2 rounded-lg font-bold text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                    currentView === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 active:scale-95'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditHeader;