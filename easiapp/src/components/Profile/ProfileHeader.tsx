import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ProfileHeaderProps {
  onBack: () => void;
  title: string;
  showSave?: boolean;
  onSave?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  onBack, 
  title, 
  showSave = false, 
  onSave 
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {showSave && (
          <button 
            onClick={onSave}
            className="font-bold text-black active:scale-95 transition-transform"
          >
            Save
          </button>
        )}
        {!showSave && <div className="w-10" />}
      </div>
    </div>
  );
};

export default ProfileHeader;