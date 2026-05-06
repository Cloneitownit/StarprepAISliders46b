import React, { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTraining: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onStartTraining }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: '🎤',
      title: 'Sing Just 4 Words',
      description: 'Record yourself singing any 4 words. That\'s all we need to capture YOUR unique voice!',
      visual: '🗣️ → 🎙️ → 💾',
    },
    {
      icon: '🤖',
      title: 'AI Creates YOUR Song',
      description: 'Our AI writes a complete hit song using your 4 words, then sings it back to you IN YOUR OWN VOICE - but with perfect pitch!',
      visual: '✨ AI Magic ✨',
    },
    {
      icon: '🎵',
      title: 'Practice Mode Begins',
      description: 'The AI plays your song as a karaoke track - just the music and lyrics on screen. No vocals. Now it\'s YOUR turn to shine!',
      visual: '🎹 + 📝 = 🎤 Your Turn!',
    },
    {
      icon: '⭐',
      title: 'Sing & Get Rated',
      description: 'Sing along with the music while our AI rates your performance in real-time. Your goal? Match the perfection of your AI-enhanced voice!',
      visual: '📊 0% → 50% → 95%',
    },
    {
      icon: '🏆',
      title: 'Earn Your Golden Ticket!',
      description: 'When you score 95-100%, you\'ve mastered YOUR song! You\'ll receive a printable Golden Ticket award - your pass to the BIG STAGE!',
      visual: '🎫✨ GOLDEN TICKET ✨🎫',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    onStartTraining();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-3xl max-w-2xl w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
            🌟 Welcome to StarPrep AI 🌟
          </h1>
          <p className="text-gray-400">Your Journey to Vocal Stardom Starts Here!</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentStep 
                  ? 'bg-neonPink w-8' 
                  : idx < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="px-8 pb-6">
          <div className="bg-black/40 rounded-2xl p-8 border border-white/10 min-h-[280px] flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4 animate-bounce">
              {steps[currentStep].icon}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Step {currentStep + 1}: {steps[currentStep].title}
            </h2>
            
            <p className="text-lg text-gray-300 mb-6 max-w-md">
              {steps[currentStep].description}
            </p>
            
            <div className="text-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl px-6 py-3 border border-purple-500/30">
              {steps[currentStep].visual}
            </div>
          </div>
        </div>

        {/* How It All Works - Summary (shown on last step) */}
        {currentStep === steps.length - 1 && (
          <div className="px-8 pb-6">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">🎯 The StarPrep Method</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">🎤</span>
                  <span className="text-gray-400">4 Words</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">→</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">🤖</span>
                  <span className="text-gray-400">AI Song</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">→</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">🏆</span>
                  <span className="text-gray-400">Golden Ticket!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="px-8 pb-8 flex gap-4">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-4 rounded-xl bg-gray-800 text-gray-300 font-bold text-lg hover:bg-gray-700 transition"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl bg-gray-800 text-gray-300 font-bold text-lg hover:bg-gray-700 transition"
            >
              ✕ Close
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:scale-105 transition transform"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black font-bold text-lg hover:scale-105 transition transform animate-pulse"
            >
              🎤 Clone Your Voice to Stardom! 🌟
            </button>
          )}
        </div>

        {/* Skip Link */}
        {currentStep < steps.length - 1 && (
          <div className="text-center pb-6">
            <button 
              onClick={() => setCurrentStep(steps.length - 1)}
              className="text-gray-500 hover:text-gray-300 text-sm underline"
            >
              Skip to Start →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
