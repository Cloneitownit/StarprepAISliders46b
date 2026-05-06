import React, { useState, useRef, useEffect } from 'react';

const JingleBox: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentJingle, setCurrentJingle] = useState<string | null>(null);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const jingles = [
    { id: 'upbeat', name: 'Upbeat Pop', emoji: '🎵', duration: '0:30' },
    { id: 'electronic', name: 'Electronic Beat', emoji: '🎧', duration: '0:30' },
    { id: 'acoustic', name: 'Acoustic', emoji: '🎸', duration: '0:30' },
    { id: 'hiphop', name: 'Hip Hop', emoji: '🎤', duration: '0:30' },
  ];

  const playJingle = (jingleId: string) => {
    if (currentJingle === jingleId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentJingle(null);
    } else {
      // In a real app, you would load the actual jingle audio file here
      // For now, we'll just simulate it
      setCurrentJingle(jingleId);
      setIsPlaying(true);
      
      // Simulate audio ending after 30 seconds
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentJingle(null);
      }, 30000);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 border-t-4 border-purple-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Jingle Box</h3>
          <p className="text-sm text-gray-400">Add music to your performances</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
          🎵
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {jingles.map((jingle) => (
            <button
              key={jingle.id}
              onClick={() => playJingle(jingle.id)}
              className={`p-3 rounded-lg border ${
                currentJingle === jingle.id && isPlaying
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20'
              } transition-colors flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{jingle.emoji}</span>
                <div className="text-left">
                  <div className="font-medium">{jingle.name}</div>
                  <div className="text-xs text-gray-400">{jingle.duration}</div>
                </div>
              </div>
              {currentJingle === jingle.id && isPlaying ? (
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1s',
                        animationIterationCount: 'infinite',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Volume</span>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} loop />
    </div>
  );
};

export default JingleBox;
