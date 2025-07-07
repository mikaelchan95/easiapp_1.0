import React from 'react';
import { Phone, Mail, MessageSquare, HelpCircle, FileText, ArrowRight } from 'lucide-react';
import ProfileHeader from './ProfileHeader';

interface SupportViewProps {
  onBack: () => void;
}

const SupportView: React.FC<SupportViewProps> = ({ onBack }) => {
  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader title="Support" onBack={onBack} />

      <div className="page-content pb-24">
        <div className="px-4 py-6 space-y-8">
          {/* Quick Help */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Get Help</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-600 p-5 rounded-xl text-white text-left active:scale-98 transition-transform shadow-sm">
                <Phone className="w-5 h-5 mb-3" />
                <h3 className="font-bold text-lg">Call Us</h3>
                <p className="text-sm opacity-90 mt-1">Talk to an agent now</p>
                <div className="flex items-center mt-3 text-sm">
                  <span>+65 6789 1234</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
              
              <button className="bg-white p-5 rounded-xl border border-gray-200 text-left active:scale-98 transition-transform shadow-sm">
                <MessageSquare className="w-5 h-5 mb-3 text-gray-600" />
                <h3 className="font-bold text-lg text-gray-900">Chat</h3>
                <p className="text-sm text-gray-600 mt-1">Live assistance</p>
                <div className="flex items-center mt-3 text-sm text-black">
                  <span>Start chat</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>

            <button className="w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between active:scale-98 transition-transform shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Email Support</div>
                  <div className="text-sm text-gray-600">support@easi.epico.com</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Help Topics */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Help Topics</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {[
                'Orders & Shipping', 
                'Returns & Refunds', 
                'Payment Issues', 
                'Product Information', 
                'Account Management'
              ].map((topic, index) => (
                <button key={index} className="flex items-center justify-between p-4 w-full text-left active:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{topic}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Resources</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'FAQ', icon: <HelpCircle className="w-6 h-6 text-purple-600" /> },
                { title: 'Privacy Policy', icon: <FileText className="w-6 h-6 text-blue-600" /> },
                { title: 'Shipping Policy', icon: <Truck className="w-6 h-6 text-green-600" /> },
                { title: 'Terms of Service', icon: <FileText className="w-6 h-6 text-red-600" /> }
              ].map((item, index) => (
                <button key={index} className="bg-white p-4 rounded-xl border border-gray-200 text-center active:scale-98 transition-transform flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <span className="font-bold text-gray-900">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Office Hours */}
          <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Business Hours</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-gray-900">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;