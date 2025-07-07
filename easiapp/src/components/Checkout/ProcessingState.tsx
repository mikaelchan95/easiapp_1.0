import React from 'react';

const ProcessingState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600">
          Securing your order...
        </p>
      </div>
    </div>
  );
};

export default ProcessingState;