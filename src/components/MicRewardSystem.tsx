import React from 'react';

export type MicTier = 'PLASTIC' | 'METAL' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface MicDefinition {
  id: MicTier;
  label: string;
  minXp: number;
  color: string;
  iconClass: string;
  description: string;
}

export const MIC_TIERS: MicDefinition[] = [
  { 
    id: 'PLASTIC', 
    label: 'Plastic Mic', 
    minXp: 0, 
    color: 'text-gray-500', 
    iconClass: 'opacity-70 grayscale',
    description: 'A humble beginning. Practice makes perfect.'
  },
  { 
    id: 'METAL', 
    label: 'Metal Mic', 
    minXp: 100, 
    color: 'text-gray-300', 
    iconClass: 'drop-shadow-md brightness-125',
    description: 'Solid and reliable. You are finding your voice.'
  },
  { 
    id: 'SILVER', 
    label: 'Silver Mic', 
    minXp: 300, 
    color: 'text-slate-200', 
    iconClass: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] brightness-150',
    description: 'Shining bright. You are becoming a pro.'
  },
  { 
    id: 'GOLD', 
    label: 'Gold Mic', 
    minXp: 600, 
    color: 'text-yellow-400', 
    iconClass: 'drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse-fast',
    description: 'Pure gold. You command the stage.'
  },
  { 
    id: 'PLATINUM', 
    label: 'Platinum Mic', 
    minXp: 1000, 
    color: 'text-cyan-100', 
    iconClass: 'drop-shadow-[0_0_20px_rgba(165,243,252,0.9)] brightness-200',
    description: 'Legendary status. The world is listening.'
  }
];

export const getMicForXp = (xp: number): MicDefinition => {
  // Find the highest tier where xp >= minXp
  return [...MIC_TIERS].reverse().find(tier => xp >= tier.minXp) || MIC_TIERS[0];
};

export const getNextTier = (currentTier: MicTier): MicDefinition | null => {
  const idx = MIC_TIERS.findIndex(t => t.id === currentTier);
  if (idx === -1 || idx === MIC_TIERS.length - 1) return null;
  return MIC_TIERS[idx + 1];
};

interface MicDisplayProps {
  xp: number;
}

export const MicDisplay: React.FC<MicDisplayProps> = ({ xp }) => {
  const currentMic = getMicForXp(xp);
  const nextMic = getNextTier(currentMic.id);
  
  // Calculate progress percentage
  let progress = 100;
  if (nextMic) {
    const range = nextMic.minXp - currentMic.minXp;
    const current = xp - currentMic.minXp;
    progress = (current / range) * 100;
  }

  // Clamp percentage to valid range 0-100 to prevent CSS errors
  const widthPercent = Math.max(0, Math.min(100, progress));

  return (
    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/10 relative group cursor-help">
      <div className="flex flex-col items-end">
        {/* Added select-text and cursor-text to ensure copyability */}
        <span className={`text-xs font-bold uppercase tracking-wider ${currentMic.color} select-text cursor-text`}>
          {currentMic.label}
        </span>
        <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${currentMic.id === 'GOLD' ? 'bg-yellow-400' : currentMic.id === 'PLATINUM' ? 'bg-cyan-200' : 'bg-white'}`} 
            style={{ width: `${widthPercent}%` }}
          ></div>
        </div>
      </div>
      
      <div className={`text-2xl transform transition-transform group-hover:scale-110 ${currentMic.iconClass}`}>
        🎤
      </div>

      {/* Tooltip */}
      <div className="absolute top-full mt-2 right-0 w-48 bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50 pointer-events-none">
        <p className="text-white text-xs font-bold mb-1">{currentMic.label}</p>
        <p className="text-gray-400 text-[10px] mb-2">{currentMic.description}</p>
        <p className="text-gray-500 text-[10px]">
          XP: <span className="text-white">{xp}</span> / {nextMic ? nextMic.minXp : 'MAX'}
        </p>
      </div>
    </div>
  );
};

interface LevelUpModalProps {
  mic: MicDefinition;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ mic, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-white/20 p-8 rounded-3xl text-center max-w-sm w-full shadow-[0_0_50px_rgba(255,255,255,0.2)] animate-pow">
        
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
           <div className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-bounce">
             🎤
           </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-8 mb-2 uppercase tracking-widest">Level Up!</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-6"></div>
        
        <p className="text-gray-400 text-sm mb-4">You have unlocked the</p>
        <p className={`text-2xl font-black uppercase mb-6 ${mic.color} drop-shadow-md select-text`}>
          {mic.label}
        </p>
        
        <div className="bg-white/5 p-4 rounded-xl mb-6">
           <p className="text-gray-300 italic">"{mic.description}"</p>
        </div>

        <button 
          onClick={onClose}
          className={`w-full py-3 rounded-full font-bold text-black uppercase tracking-wider transition hover:scale-105 shadow-lg ${
            mic.id === 'GOLD' ? 'bg-yellow-400' : 
            mic.id === 'PLATINUM' ? 'bg-cyan-200' : 
            'bg-white'
          }`}
        >
          Collect Reward
        </button>
      </div>
    </div>
  );
};
