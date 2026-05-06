import React, { useEffect, useRef, useState } from 'react';

const JINGLE_URL = '/starprep-jingle.mp3';

const JinglePlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play short preview after ANY user interaction (click, touch, keypress)
  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem('starprep_jingle_played');
    if (alreadyPlayed || hasAutoPlayed) return;

    const playJingle = async () => {
      try {
        const audio = audioRef.current;
        if (!audio) return;

        // Start at low volume (25%)
        audio.volume = 0.25;
        audio.currentTime = 0;
        
        await audio.play();
        setIsPlaying(true);
        setHasAutoPlayed(true);
        sessionStorage.setItem('starprep_jingle_played', 'true');

        // Remove listeners after playing
        document.removeEventListener('click', playJingle);
        document.removeEventListener('touchstart', playJingle);
        document.removeEventListener('keydown', playJingle);

        // Fade out after 10 seconds (auto-play preview only)
        fadeTimeoutRef.current = setTimeout(() => {
          fadeOut(audio);
        }, 10000);

      } catch (err) {
        console.log('Jingle play failed:', err);
      }
    };

    // Listen for ANY user interaction
    document.addEventListener('click', playJingle, { once: true });
    document.addEventListener('touchstart', playJingle, { once: true });
    document.addEventListener('keydown', playJingle, { once: true });

    return () => {
      document.removeEventListener('click', playJingle);
      document.removeEventListener('touchstart', playJingle);
      document.removeEventListener('keydown', playJingle);
    };
  }, [hasAutoPlayed]);

  const fadeOut = (audio: HTMLAudioElement) => {
    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > 0.02) {
        audio.volume = Math.max(0, audio.volume - 0.02);
      } else {
        audio.pause();
        audio.volume = volume; // Reset for manual play
        setIsPlaying(false);
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, 100);
  };

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any fade timers
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Play the FULL song at user's volume
      audio.currentTime = 0;
      audio.volume = volume;
      await audio.play();
      setIsPlaying(true);
      // NO fade out - let it play the whole song!
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative flex flex-col items-center">
      <audio 
        ref={audioRef} 
        src={JINGLE_URL} 
        onEnded={handleEnded}
        preload="auto"
      />
      
      <div 
        className="relative"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={handlePlay}
          className={`p-2.5 rounded-full transition border ${
            isPlaying 
              ? 'bg-neonPink/20 text-neonPink border-neonPink/50 animate-pulse' 
              : 'bg-white/10 text-gray-300 border-gray-700 hover:bg-white/20 hover:text-white hover:border-gray-500'
          }`}
          title={isPlaying ? 'Pause Jingle' : 'Play Full Jingle'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          )}
        </button>

        {/* Volume Slider - appears on hover */}
        {showVolumeSlider && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f0f13] border border-gray-700 rounded-lg p-3 shadow-xl z-50">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neonPink"
                style={{
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, #ff1493 0%, #ff1493 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-white">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Jingle label below button */}
      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">Jingle</span>
    </div>
  );
};

export default JinglePlayer;
