import React, { useState, useEffect } from 'react';

type TabType = 'MEMBERSHIP' | 'SUPPORT' | 'LEGAL' | 'SYSTEM' | 'ABOUT' | 'ACCOUNT' | 'NOTIFICATIONS' | 'PRIVACY';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onNavigate: (mode: string) => void;
  initialTab?: TabType;
  motivationEnabled: boolean;
  onToggleMotivation: (enabled: boolean) => void;
  currentLanguage: string;
  onSetLanguage: (language: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: (enabled: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigate,
  initialTab = 'SYSTEM',
  motivationEnabled,
  onToggleMotivation,
  currentLanguage,
  onSetLanguage,
  darkMode = true,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'SYSTEM', label: 'System' },
    { id: 'ACCOUNT', label: 'Account' },
    { id: 'NOTIFICATIONS', label: 'Notifications' },
    { id: 'PRIVACY', label: 'Privacy' },
    { id: 'ABOUT', label: 'About' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'SYSTEM':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Display</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-400">Switch between light and dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={darkMode}
                      onChange={(e) => onToggleDarkMode && onToggleDarkMode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-gray-400">Select your preferred language</p>
                  </div>
                  <select 
                    value={currentLanguage}
                    onChange={(e) => onSetLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="EN">English</option>
                    <option value="ES">Español</option>
                    <option value="JA">日本語</option>
                    <option value="KO">한국어</option>
                    <option value="ZH">中文</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Audio Settings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Microphone Volume</span>
                    <span className="text-sm">75%</span>
                  </div>
                  <input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neonPink" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Playback Volume</span>
                    <span className="text-sm">85%</span>
                  </div>
                  <input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neonPink" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Motivational Messages</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Enable Motivational Messages</p>
                  <p className="text-sm text-gray-400">Receive encouraging messages during practice</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={motivationEnabled}
                    onChange={(e) => onToggleMotivation(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'ACCOUNT':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="font-medium mb-6">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input 
                    type="text" 
                    defaultValue={user?.name || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription</label>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-gray-400">Upgrade for more features</p>
                    </div>
                    <button 
                      onClick={() => onNavigate('PRICING')}
                      className="px-4 py-2 bg-neonPink text-black rounded-lg font-medium text-sm"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                  Delete Account
                </button>
                <button className="w-full text-left p-3 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition">
                  Logout
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'NOTIFICATIONS':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="font-medium mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { id: 'practice', label: 'Practice Reminders', description: 'Daily and weekly practice reminders' },
                  { id: 'progress', label: 'Progress Updates', description: 'Weekly progress reports and achievements' },
                  { id: 'new', label: 'New Features', description: 'Updates about new features and improvements' },
                  { id: 'promo', label: 'Promotions', description: 'Special offers and promotions' },
                ].map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.id !== 'promo'} />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'PRIVACY':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="font-medium mb-6">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Make Profile Public</p>
                    <p className="text-sm text-gray-400">Allow others to view your profile and progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Show Activity Status</p>
                    <p className="text-sm text-gray-400">Show when you're active on the platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                  </label>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3">Data & Privacy</h4>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition">
                      Download Your Data
                    </button>
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition">
                      Request Data Deletion
                    </button>
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition">
                      View Privacy Policy
                    </button>
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition">
                      View Terms of Service
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'ABOUT':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neonPink to-purple-600 flex items-center justify-center text-2xl">
                🎤
              </div>
              <h2 className="text-2xl font-bold mb-2">StarPrep AI</h2>
              <p className="text-gray-400 mb-6">Version 1.0.0</p>
              
              <div className="space-y-4 text-left">
                <div>
                  <p className="font-medium">Developed by</p>
                  <p className="text-gray-400">StarPrep Team</p>
                </div>
                <div>
                  <p className="font-medium">Contact</p>
                  <a href="mailto:support@starprep.ai" className="text-neonPink hover:underline">support@starprep.ai</a>
                </div>
                <div>
                  <p className="font-medium">Website</p>
                  <a href="https://starprep.ai" target="_blank" rel="noopener noreferrer" className="text-neonPink hover:underline">https://starprep.ai</a>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="font-medium mb-3">Open Source Libraries</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>React</div>
                  <div>Vite</div>
                  <div>Tailwind CSS</div>
                  <div>Framer Motion</div>
                </div>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                © {new Date().getFullYear()} StarPrep AI. All rights reserved.
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-200 ${
          isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Settings</h2>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex overflow-x-auto mt-4 -mx-4 px-4 pb-1 scrollbar-hide">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-neonPink text-black'
                      : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
          {renderTabContent()}
        </div>
        
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
