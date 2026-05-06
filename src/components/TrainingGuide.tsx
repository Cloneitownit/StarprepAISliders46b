import React from 'react';

// ═══ TRAINING GUIDE COMPONENT ═══
// Step-by-step guided walkthrough with flashing arrows
// Training Mode ON/OFF button in nav bar

// Flashing arrow component - arrows flash, text stays solid
const FlashingArrows: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <div className={`flex items-center justify-center gap-2 py-2 px-4 ${className}`}>
    <span className="text-white text-xl animate-bounce-arrow">⬇️</span>
    <span className="text-white font-bold text-sm md:text-base tracking-wide whitespace-nowrap">
      {text}
    </span>
    <span className="text-white text-xl animate-bounce-arrow">⬇️</span>
  </div>
);

// Training guide hint wrapper
const GuideHint: React.FC<{ text: string; show: boolean; className?: string; onDismiss?: () => void; showDismiss?: boolean }> = ({ text, show, className = '', onDismiss, showDismiss = false }) => {
  if (!show) return null;
  return (
    <div className={`relative z-[60] ${className}`}>
      <div className="bg-black/90 border border-white/30 rounded-xl px-4 py-2 backdrop-blur-sm shadow-lg">
        <FlashingArrows text={text} />
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="block mx-auto mt-1 text-[10px] text-gray-500 hover:text-white transition underline underline-offset-2"
          >
            ✕ Don't show this again
          </button>
        )}
      </div>
    </div>
  );
};

// Training Mode Toggle Button for nav
export const TrainingModeButton: React.FC<{ 
  isActive: boolean; 
  onToggle: () => void;
}> = ({ isActive, onToggle }) => (
  <button
    onClick={onToggle}
    className={`px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase transition flex items-center gap-1 ${
      isActive
        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
        : 'bg-white/10 text-gray-400 border border-gray-600 hover:bg-white/20'
    }`}
  >
    <span>{isActive ? '🎓' : '📖'}</span>
    <span className="hidden sm:inline">Training</span>
    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`}></span>
  </button>
);

// ═══ HOME SCREEN GUIDE ═══
export const HomeGuide: React.FC<{ show: boolean; onDismiss?: () => void }> = ({ show, onDismiss }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Click on Clone Voice" 
      show={true} 
      className="mt-3 mb-3"
      onDismiss={onDismiss}
      showDismiss={true}
    />
  );
};

// ═══ VOICE CLONE SCREEN GUIDES ═══
export const VoiceCloneCreateGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Now click on Create Your Song" 
      show={true} 
      className="mt-4 mb-4"
    />
  );
};

export const VoiceCloneRecordGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Now click Record Voice Sample" 
      show={true} 
      className="mt-4 mb-4"
    />
  );
};

// ═══ SONG WRITER SCREEN GUIDES ═══
export const RecordLiveGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Now click the pink microphone button, press stop when finished" 
      show={true} 
      className="mt-4 mb-4"
    />
  );
};

export const CollectRewardsGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Now collect your rewards" 
      show={true} 
      className="mb-4"
    />
  );
};

export const SelectGenderGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Select Gender" 
      show={true} 
      className="mb-3"
    />
  );
};

export const SelectGenreGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Select Genre" 
      show={true} 
      className="mt-3 mb-3"
    />
  );
};

export const CloneVoiceToggleGuide: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Clone Voice — On or Off" 
      show={true} 
      className="mt-3 mb-3"
    />
  );
};

export const GenerateGuide: React.FC<{ show: boolean; onDismiss?: () => void }> = ({ show, onDismiss }) => {
  if (!show) return null;
  return (
    <GuideHint 
      text="Now click Generate Clone Voice" 
      show={true} 
      className="mt-3 mb-3"
      onDismiss={onDismiss}
      showDismiss={true}
    />
  );
};

// ═══ CSS ANIMATION (add to your global CSS or tailwind config) ═══
// This creates a bouncing arrow animation
export const TrainingGuideStyles = `
  @keyframes bounce-arrow {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(6px); opacity: 0.4; }
  }
  .animate-bounce-arrow {
    animation: bounce-arrow 1.2s ease-in-out infinite;
  }
`;

export default {
  TrainingModeButton,
  HomeGuide,
  VoiceCloneCreateGuide,
  VoiceCloneRecordGuide,
  RecordLiveGuide,
  CollectRewardsGuide,
  SelectGenderGuide,
  SelectGenreGuide,
  CloneVoiceToggleGuide,
  GenerateGuide,
  TrainingGuideStyles,
};
