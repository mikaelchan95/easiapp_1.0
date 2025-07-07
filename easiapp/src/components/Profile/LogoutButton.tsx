import React, { useState } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className="w-full bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-3 active:scale-95 transition-transform"
      >
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <LogOut className="w-4 h-4 text-red-600" />
        </div>
        <span className="font-bold text-red-600">Sign Out</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-gray-600">Are you sure you want to sign out?</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={onLogout}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;