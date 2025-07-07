import React, { useState } from 'react';
import { Moon, Sun, Globe, Volume2, VolumeX, Smartphone, Shield } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import ToggleSwitch from '../UI/ToggleSwitch';

interface PreferencesViewProps {
  onBack: () => void;
}

const PreferencesView: React.FC<PreferencesViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    darkMode: false,
    hapticFeedback: true,
    soundEffects: true,
    faceId: false
  });

  const updateSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader title="Preferences" onBack={onBack} />

      <div className="page-content pb-24">
        <div className="px-4 py-6 space-y-8">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Appearance</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  {settings.darkMode ? 
                    <Moon className="w-5 h-5 text-gray-800" /> : 
                    <Sun className="w-5 h-5 text-gray-800" />
                  }
                  <div>
                    <div className="font-bold text-gray-900">Dark Mode</div>
                    <div className="text-sm text-gray-600">Easier on the eyes</div>
                  </div>
                </div>
                <ToggleSwitch 
                  isEnabled={settings.darkMode} 
                  onToggle={() => updateSetting('darkMode')}
                />
              </div>
            </div>
          </div>

          {/* Regional */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Regional</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <button className="flex items-center justify-between p-4 w-full text-left active:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-bold text-gray-900">Language</div>
                    <div className="text-sm text-gray-600">English</div>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between p-4 w-full text-left active:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center text-gray-800 font-bold">$</div>
                  <div>
                    <div className="font-bold text-gray-900">Currency</div>
                    <div className="text-sm text-gray-600">Singapore Dollar (SGD)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Experience</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-bold text-gray-900">Haptic Feedback</div>
                    <div className="text-sm text-gray-600">Touch vibrations</div>
                  </div>
                </div>
                <ToggleSwitch 
                  isEnabled={settings.hapticFeedback} 
                  onToggle={() => updateSetting('hapticFeedback')}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  {settings.soundEffects ? 
                    <Volume2 className="w-5 h-5 text-gray-500" /> : 
                    <VolumeX className="w-5 h-5 text-gray-500" />
                  }
                  <div>
                    <div className="font-bold text-gray-900">Sound Effects</div>
                    <div className="text-sm text-gray-600">App sounds</div>
                  </div>
                </div>
                <ToggleSwitch 
                  isEnabled={settings.soundEffects} 
                  onToggle={() => updateSetting('soundEffects')}
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Security</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-bold text-gray-900">Face ID</div>
                    <div className="text-sm text-gray-600">Quick & secure login</div>
                  </div>
                </div>
                <ToggleSwitch 
                  isEnabled={settings.faceId} 
                  onToggle={() => updateSetting('faceId')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesView;