import React from 'react';
import { 
  User, MapPin, CreditCard, Shield, Bell, Settings,
  HelpCircle, Mail, Receipt, ChevronRight
} from 'lucide-react';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  action: () => void;
  highlight?: boolean;
  trailingText?: string;
}

interface ProfileMenuSectionProps {
  title: string;
  items: MenuItem[];
}

const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({ title, items }) => {
  // Map string icon names to Lucide components
  const getIcon = (iconName: string, highlighted: boolean = false) => {
    const props = {
      className: `w-4 h-4 ${highlighted ? 'text-purple-600' : 'text-gray-600'}`
    };
    
    switch (iconName) {
      case 'user': return <User {...props} />;
      case 'mapPin': return <MapPin {...props} />;
      case 'creditCard': return <CreditCard {...props} />;
      case 'shield': return <Shield {...props} />;
      case 'bell': return <Bell {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'helpCircle': return <HelpCircle {...props} />;
      case 'mail': return <Mail {...props} />;
      case 'receipt': return <Receipt {...props} />;
      default: return <Settings {...props} />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <button 
            key={index}
            onClick={item.action}
            className={`w-full bg-white p-4 rounded-xl flex items-center space-x-3 border ${
              item.highlight ? 'border-purple-200 shadow-sm' : 'border-gray-200'
            } active:scale-98 transition-all`}
          >
            <div className={`w-10 h-10 ${
              item.highlight ? 'bg-purple-100' : 'bg-gray-100'
            } rounded-lg flex items-center justify-center border ${
              item.highlight ? 'border-purple-200' : 'border-gray-200'
            }`}>
              {getIcon(item.icon, item.highlight)}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
            {item.trailingText ? (
              <div className="text-sm font-bold text-purple-600 mr-1">{item.trailingText}</div>
            ) : null}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileMenuSection;