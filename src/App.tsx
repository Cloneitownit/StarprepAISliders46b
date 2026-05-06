import React, { useState, useEffect } from 'react';
import StarWarp from './components/StarWarp';
import EarthBackground from './components/EarthBackground';
import JudgeMode from './components/JudgeMode';
import SongWriterMode from './components/SongWriterMode';
import LyricComposerMode from './components/LyricComposerMode';
import VocalCoachMode from './components/VocalCoachMode';
import IdolPrepMode from './components/IdolPrepMode';
import StagePresenceMode from './components/StagePresenceMode';
import DuetMode from './components/DuetMode';
import BrandingMode from './components/BrandingMode';
import VoiceCloneMode from './components/VoiceCloneMode';
import { TrainingModeButton, HomeGuide, TrainingGuideStyles } from './components/TrainingGuide';
import DanceCoachMode from './components/DanceCoachMode';
import SingingLessonsMode from './components/SingingLessonsMode';
import JingleBox from './components/JingleBox';
import JinglePlayer from './components/JinglePlayer';
import MerchShop from './components/MerchShop';
import PricingModal from './components/PricingModal';
import SettingsModal from './components/SettingsModal';
import MotivationModal from './components/MotivationModal';
import DonateModal from './components/DonateModal';
import { MicDisplay, LevelUpModal, getMicForXp, MicDefinition } from './components/MicRewardSystem';
import GlobalConnect from './components/GlobalConnect';
import { AppMode, User, SubscriptionTier, AppLanguage } from './types';
import { getTranslation, LANGUAGES } from './utils/localization';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [showPricing, setShowPricing] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [trainingMode, setTrainingMode] = useState(() => {
    return localStorage.getItem('starprep_training_dismissed') !== 'true';
  });
  const [trainingStep, setTrainingStep] = useState(1); // Tracks which guide to show

  const dismissTraining = () => {
    setTrainingMode(false);
    localStorage.setItem('starprep_training_dismissed', 'true');
  };

  const advanceStep = (nextStep: number) => {
    console.log('🎯 App v48 | Step advancing:', trainingStep, '→', nextStep);
    setTrainingStep(nextStep);
  };
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('EN');
  
  const [showSettings, setShowSettings] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState<'MEMBERSHIP' | 'SUPPORT' | 'LEGAL' | 'SYSTEM' | 'ABOUT'>('MEMBERSHIP');
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [motivationEnabled, setMotivationEnabled] = useState(() => {
    return localStorage.getItem('starprep_motivation') !== 'false';
  });
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // v24: Trigger starfield warp on any button/interactive click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, [role="button"], .clickable, a[href]')) {
        window.dispatchEvent(new Event('starwarp'));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setInstallPrompt(null);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'StarPrepAI',
      text: 'Check out this AI Vocal Coach app!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('App link copied to clipboard!');
    }
  };

  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Guest Artist', tier: 'DIAMOND', xp: 0 }
  ]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [showLevelUp, setShowLevelUp] = useState<MicDefinition | null>(null);

  useEffect(() => {
    localStorage.setItem('starprep_motivation', motivationEnabled.toString());
  }, [motivationEnabled]);

  // Show motivation popup only when clicking X to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleUpgrade = (tier: SubscriptionTier) => {
    const updatedUser = { ...currentUser, tier };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setShowPricing(false);
  };

  const handleAddUser = () => {
    const name = prompt("Enter new artist name:");
    if (name) {
      const newUser: User = {
        id: Date.now().toString(),
        name,
        tier: 'FREE',
        xp: 0
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
    }
  };

  const openSettings = (tab: 'MEMBERSHIP' | 'SUPPORT' | 'LEGAL' | 'SYSTEM' | 'ABOUT' = 'MEMBERSHIP') => {
    setInitialSettingsTab(tab);
    setShowSettings(true);
  };

  const handleSignOut = () => {
     window.location.reload();
  };

  const addXp = (amount: number) => {
    const oldMic = getMicForXp(currentUser.xp);
    const newXp = currentUser.xp + amount;
    const newMic = getMicForXp(newXp);
    const updatedUser = { ...currentUser, xp: newXp };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (newMic.id !== oldMic.id) {
       setShowLevelUp(newMic);
    }
  };

  const isProOrAbove = currentUser.tier === 'PRO' || currentUser.tier === 'SUPERSTAR';
  const isSuperstar = currentUser.tier === 'SUPERSTAR';
  const t = (key: string) => getTranslation(key, currentLanguage);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0514] via-[#1a0b2e] to-black opacity-80"></div>
        <div className="absolute w-[500px] h-[500px] bg-neonPink rounded-full filter blur-[150px] opacity-10 animate-pulse-slow top-0 left-0"></div>
        <div className="absolute w-[500px] h-[500px] bg-neonBlue rounded-full filter blur-[150px] opacity-10 animate-pulse-slow bottom-0 right-0"></div>
        <div className="relative z-10 flex flex-col items-center">
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-neonPink to-neonBlue blur-2xl opacity-50 animate-pulse"></div>
              <h1 className="relative text-7xl md:text-9xl font-serif font-bold text-white tracking-tighter">
                SP<span className="text-neonPink">.</span>AI
              </h1>
           </div>
           <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-neonPink to-neonBlue animate-[shimmer_1.5s_infinite]"></div>
           </div>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] animate-fade-in-up">
             Loading Studio...
           </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (mode) {
      case AppMode.VOICE_CLONE:
        return <VoiceCloneMode onGoToSongWriter={() => { setMode(AppMode.SONG_WRITER); if (trainingMode) advanceStep(4); }} trainingMode={trainingMode} trainingStep={trainingStep} advanceStep={advanceStep} />;
      case AppMode.JUDGE:
        return <JudgeMode />;
      case AppMode.IDOL_PREP:
        return <IdolPrepMode />;
      case AppMode.SONG_WRITER:
        return <SongWriterMode onComplete={() => addXp(100)} trainingMode={trainingMode} onDismissTraining={dismissTraining} trainingStep={trainingStep} advanceStep={advanceStep} />;
      case AppMode.LYRIC_COMPOSER:
        return <LyricComposerMode />;
      case AppMode.VOCAL_COACH:
        return <VocalCoachMode />;
      case AppMode.SINGING_LESSONS:
        return <SingingLessonsMode userTier={currentUser.tier} />;
      case AppMode.DANCE_COACH:
        return <DanceCoachMode userTier={currentUser.tier} />;
      case AppMode.STAGE_PRESENCE:
        return <StagePresenceMode />;
      case AppMode.DUET:
        return <DuetMode />;
      case AppMode.BRANDING:
        return <BrandingMode />;
      case AppMode.SHOP:
        return <MerchShop onBack={() => setMode(AppMode.HOME)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fade-in text-center p-6">
            <div className="space-y-4 relative z-10">
              <p className="text-sm md:text-lg font-bold tracking-[0.4em] text-neonBlue uppercase drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] mb-2 animate-fade-in-up">
                 {t('heroTitle')}
              </p>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight drop-shadow-2xl">
                StarPrep<span className="text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-purple-500">AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-neonBlue font-light tracking-wide drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
                {t('tagline')}
              </p>
              {!isSuperstar && (
                 <button 
                  onClick={() => setShowPricing(true)}
                  className="mt-4 px-6 py-2 rounded-full border border-gold text-gold hover:bg-gold hover:text-black transition text-sm font-bold uppercase tracking-wider backdrop-blur-md bg-black/30"
                 >
                   {t('fullPotential')}
                 </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl relative z-10">
              {trainingMode && trainingStep === 1 && <div className="col-span-full"><HomeGuide show={true} onDismiss={dismissTraining} /></div>}
              <button onClick={() => { setMode(AppMode.VOICE_CLONE); if (trainingMode) advanceStep(2); }} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-purple-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🎙️</div>
                  <h3 className="text-lg font-bold text-white mb-2">Voice Clone</h3>
                  <p className="text-gray-400 text-xs">Record your voice and hear yourself in a hit song!</p>
                </div>
                <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.SONG_WRITER)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-neonPink h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🎤</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('voiceCloner')}</h3>
                  <p className="text-gray-400 text-xs">{t('voiceClonerDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-neonPink opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => { if (isProOrAbove) { setMode(AppMode.LYRIC_COMPOSER); } else { setShowPricing(true); }}} className={`group relative overflow-hidden glass-panel p-6 rounded-2xl transition-all duration-300 border-t-4 border-neonBlue h-full flex flex-col justify-between ${isProOrAbove ? 'hover:bg-white/5 hover:-translate-y-2 cursor-pointer' : 'cursor-default opacity-80'}`}>
                <div className="relative z-10">
                  <div className="text-4xl mb-4 flex justify-between items-center">
                    📝
                    {!isProOrAbove && <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded uppercase">Pro</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('lyricComposer')}</h3>
                  <p className="text-gray-400 text-xs">{t('lyricComposerDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-neonBlue opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.JUDGE)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-gold h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">⭐</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('judgeMode')}</h3>
                  <p className="text-gray-400 text-xs">{t('judgeModeDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.IDOL_PREP)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-blue-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🎫</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('agtPrep')}</h3>
                  <p className="text-gray-400 text-xs">{t('agtPrepDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.DUET)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-pink-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">👩‍🎤</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('duetMode')}</h3>
                  <p className="text-gray-400 text-xs">{t('duetModeDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => { if (isSuperstar) { setMode(AppMode.VOCAL_COACH); } else { setShowPricing(true); }}} className={`group relative overflow-hidden glass-panel p-6 rounded-2xl transition-all duration-300 border-t-4 border-purple-500 h-full flex flex-col justify-between ${isSuperstar ? 'hover:bg-white/5 hover:-translate-y-2 cursor-pointer' : 'cursor-default opacity-80'}`}>
                <div className="relative z-10">
                  <div className="text-4xl mb-4 flex justify-between items-center">
                    🎹 
                    {!isSuperstar && <span className="text-[10px] bg-gradient-to-r from-gold to-orange-500 text-black px-2 py-0.5 rounded font-bold uppercase">Prem</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('vocalCoach')}</h3>
                  <p className="text-gray-400 text-xs">{t('vocalCoachDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.SINGING_LESSONS)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-yellow-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4 flex justify-between items-center">
                    🎤
                    <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-0.5 rounded uppercase font-bold">New</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('singingLessons')}</h3>
                  <p className="text-gray-400 text-xs">{t('singingLessonsDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.DANCE_COACH)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-pink-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4 flex justify-between items-center">
                    💃
                    <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded uppercase">New</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('danceCoach')}</h3>
                  <p className="text-gray-400 text-xs">{t('danceCoachDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

               <button onClick={() => setMode(AppMode.STAGE_PRESENCE)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-red-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🎭</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('stagePresence')}</h3>
                  <p className="text-gray-400 text-xs">{t('stagePresenceDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <button onClick={() => setMode(AppMode.BRANDING)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-emerald-500 h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('starIdentity')}</h3>
                  <p className="text-gray-400 text-xs">{t('starIdentityDesc')}</p>
                </div>
                <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>

              <JingleBox />

              <button onClick={() => setMode(AppMode.SHOP)} className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 border-t-4 border-gold h-full flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="text-lg font-bold text-white mb-2">Shop</h3>
                  <p className="text-gray-400 text-xs">Merch & Microphones to level up your vocal game</p>
                </div>
                <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative text-white font-sans selection:bg-neonPink selection:text-white pb-20 overflow-x-hidden">
      <div style={{position: 'fixed', inset: 0, zIndex: 0}}>
        <EarthBackground onFlagClick={(code) => setSelectedFlag(code)} />
        <StarWarp />
      </div>

      {/* Chat room modal from flag click */}
      {selectedFlag && (
        <GlobalConnect countryCode={selectedFlag} onClose={() => setSelectedFlag(null)} />
      )}
      
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onUpgrade={handleUpgrade} />}
      {showLevelUp && <LevelUpModal mic={showLevelUp} onClose={() => setShowLevelUp(null)} />}
      
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={currentUser} onNavigate={(mode: string) => setMode(mode as AppMode)} initialTab={initialSettingsTab} motivationEnabled={motivationEnabled} onToggleMotivation={setMotivationEnabled} currentLanguage={currentLanguage} onSetLanguage={(lang: string) => setCurrentLanguage(lang as AppLanguage)} />
      <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} />

      <nav className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode(AppMode.HOME)} className="text-2xl font-serif font-bold tracking-tighter hover:opacity-80 transition flex items-center gap-2">
            SP<span className="text-neonPink">.</span>AI
          </button>
          <JinglePlayer />
          {mode !== AppMode.HOME && (
            <button onClick={() => setMode(AppMode.HOME)} className="text-xs font-semibold text-gray-400 hover:text-white transition uppercase tracking-widest border border-gray-600 px-3 py-1 rounded-full hover:border-white">
              {t('home')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-center">
           <MicDisplay xp={currentUser.xp} />
           
           {/* Language Selector */}
           <div className="relative group">
             <button className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition border border-gray-700 hover:border-gray-500 flex items-center gap-1" title={t('language')}>
               <span className="text-lg">{LANGUAGES.find(l => l.code === currentLanguage)?.flag || '🌐'}</span>
             </button>
             <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f13] border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden max-h-80 overflow-y-auto">
               <p className="text-[10px] text-gray-500 px-3 py-2 uppercase font-bold tracking-wider border-b border-gray-800">{t('selectLanguage')}</p>
               {LANGUAGES.map(lang => (
                 <button
                   key={lang.code}
                   onClick={() => setCurrentLanguage(lang.code as AppLanguage)}
                   className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 ${currentLanguage === lang.code ? 'bg-neonPink/20 text-neonPink' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                 >
                   <span>{lang.flag}</span>
                   <span>{lang.name}</span>
                   {currentLanguage === lang.code && <span className="ml-auto text-green-400">✓</span>}
                 </button>
               ))}
             </div>
           </div>
           
           <button onClick={() => openSettings('SYSTEM')} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition border border-gray-700 hover:border-gray-500" title={t('settings')}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </button>

           <div className="group relative">
              <button className="flex items-center gap-3 text-sm font-semibold hover:text-neonBlue transition bg-white/5 pr-4 pl-1 py-1 rounded-full border border-gray-700">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center border border-white/20 shadow-md">
                    <span className="text-white font-bold">{currentUser.name[0]}</span>
                 </div>
                 <span className="hidden md:inline text-gray-200">{currentUser.name}</span>
                 {currentUser.tier === 'PRO' && <span className="text-[10px] bg-neonBlue text-black px-1.5 py-0.5 rounded font-bold">PRO</span>}
                 {currentUser.tier === 'SUPERSTAR' && <span className="text-[10px] bg-gradient-to-r from-gold to-orange-500 text-black px-1.5 py-0.5 rounded font-bold">STAR</span>}
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f0f13] border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform group-hover:translate-y-0 translate-y-2">
                 <div className="p-2 border-b border-gray-800">
                    <p className="text-[10px] text-gray-500 px-3 py-2 uppercase font-bold tracking-wider">{t('switchUser')}</p>
                    {users.map(u => (
                      <button key={u.id} onClick={() => setCurrentUser(u)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${currentUser.id === u.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        {u.name}
                        {currentUser.id === u.id && <span className="text-green-400">●</span>}
                      </button>
                    ))}
                 </div>
                 <button onClick={handleAddUser} className="w-full text-left px-5 py-3 text-xs text-neonBlue hover:bg-white/5 font-bold uppercase tracking-wider transition">
                   + {t('addProfile')}
                 </button>
                 <div className="border-t border-gray-800">
                   <button onClick={() => openSettings('MEMBERSHIP')} className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {t('settings')}
                   </button>
                   <button onClick={handleSignOut} className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-gray-800 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      {t('signOut')}
                   </button>
                 </div>
              </div>
           </div>

           {installPrompt && (
             <button onClick={handleInstallClick} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase transition hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1 animate-pulse">
               📲 Install App
             </button>
           )}

           <button onClick={handleShare} className="bg-white/10 hover:bg-white/20 text-blue-300 border border-blue-400/30 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase transition flex items-center gap-1">
             <span>🔗</span> Share
           </button>

           <button onClick={() => setMode(AppMode.SHOP)} className="bg-gold/20 hover:bg-gold/40 text-gold border border-gold/50 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase transition flex items-center gap-1">
             <span>🛍️</span> Shop
           </button>

           <button onClick={() => setShowDonate(true)} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/50 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase transition flex items-center gap-1">
             <span>❤️</span> {t('donate')}
           </button>

           <TrainingModeButton isActive={trainingMode} onToggle={() => {
             if (trainingMode) {
               dismissTraining();
             } else {
               localStorage.removeItem('starprep_training_dismissed');
               setTrainingMode(true);
               setTrainingStep(1);
             }
           }} />

           {!isSuperstar && (
             <button onClick={() => setShowPricing(true)} className="bg-gradient-to-r from-gold to-yellow-600 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase hover:scale-105 transition shadow-lg">
               {t('upgrade')}
             </button>
           )}
        </div>
      </nav>

      <main className="relative z-20 container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <footer className="relative z-[1] text-center py-8 text-gray-600 text-xs mt-auto pointer-events-auto">
        <style dangerouslySetInnerHTML={{ __html: TrainingGuideStyles }} />
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4 uppercase tracking-widest font-bold text-[10px] sm:text-xs">
           <button onClick={() => openSettings('SUPPORT')} className="hover:text-white transition">Support</button>
           <button onClick={() => openSettings('LEGAL')} className="hover:text-white transition">Privacy Policy</button>
           <button onClick={() => openSettings('LEGAL')} className="hover:text-white transition">Terms of Service</button>
           <button onClick={() => openSettings('ABOUT')} className="hover:text-white transition">About Us</button>
        </div>
        <p className="opacity-50">StarPrepAI v95 | Copyright 2025 StarPrepAI</p>
      </footer>

      {/* Extra scroll space so the earth + star mascot reveal when scrolling past menus */}
      {mode === AppMode.HOME && (
        <div style={{ height: '80vh', position: 'relative', zIndex: 0 }} />
      )}
    </div>
  );
};

export default App;
