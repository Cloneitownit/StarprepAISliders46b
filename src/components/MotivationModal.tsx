import React from 'react';

interface MotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

const MotivationModal: React.FC<MotivationModalProps> = ({
  isOpen,
  onClose,
  enabled,
  onToggleEnabled,
}) => {
  if (!isOpen) return null;

  const motivationalQuotes = [
    "The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Keep Going! 💪</h2>
              <p className="text-gray-400">You're doing amazing!</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-neonPink/20 to-purple-500/20 p-6 rounded-lg mb-6 text-center">
            <p className="text-lg italic">"{randomQuote}"</p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Motivational Messages</p>
              <p className="text-sm text-gray-400">
                {enabled ? 'Messages are enabled' : 'Messages are disabled'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={enabled}
                onChange={(e) => onToggleEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
            </label>
          </div>
        </div>
        
        <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neonPink text-black rounded-lg font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotivationModal;
