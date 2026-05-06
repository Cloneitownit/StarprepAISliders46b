import React, { useState, useRef } from "react";

interface PitchData {
  time: number;
  frequency: number;
  confidence: number;
}

interface PracticeSession {
  id: string;
  songTitle: string;
  songArtist: string;
  backingTrackUrl: string;
  clonedVocalUrl?: string;
}

interface ScoreResult {
  overall: number;
  pitch: number;
  timing: number;
  feedback: string[];
  qualifiesForGoldenTicket: boolean;
}

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const VocalCoachMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo songs (in real app, these would come from the API)
  const demoSongs = [
    { id: '1', title: 'Rise Up', artist: 'Andra Day', difficulty: 'Medium' },
    { id: '2', title: 'Hallelujah', artist: 'Leonard Cohen', difficulty: 'Easy' },
    { id: '3', title: 'Someone Like You', artist: 'Adele', difficulty: 'Medium' },
  ];

  const startPracticeSession = async (songId: string) => {
    setIsLoading(true);
    setError(null);
    setScoreResult(null);
    
    try {
      // In a real implementation, this would call the backend
      // For now, create a demo session
      const song = demoSongs.find(s => s.id === songId);
      if (!song) throw new Error('Song not found');
      
      setCurrentSession({
        id: `session_${Date.now()}`,
        songTitle: song.title,
        songArtist: song.artist,
        backingTrackUrl: '', // Would come from API
      });
      
      setIsPracticing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for pitch detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      
      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await submitRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setPitchData([]);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start pitch detection
      pitchIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          analyserRef.current.getFloatTimeDomainData(dataArray);
          
          // Simple autocorrelation for pitch detection
          const pitch = detectPitch(dataArray, audioContextRef.current!.sampleRate);
          if (pitch > 0) {
            setPitchData(prev => [...prev, {
              time: recordingTime,
              frequency: pitch,
              confidence: 0.8, // Simplified
            }]);
          }
        }
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  };

  // Simple autocorrelation pitch detection
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Float32Array(SIZE);

    for (let offset = 0; offset < SIZE; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / SIZE;
      correlations[offset] = correlation;

      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
        foundGoodCorrelation = true;
      }
    }

    if (!foundGoodCorrelation || bestOffset < 1) return -1;
    return sampleRate / bestOffset;
  };

  const submitRecording = async (_audioBlob: Blob) => {
    if (!currentSession) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would:
      // 1. Send the audio to the backend
      // 2. Backend would analyze pitch and compare to expected
      // 3. Return a score
      
      // For demo, generate a simulated score
      const simulatedScore: ScoreResult = {
        overall: Math.round(70 + Math.random() * 25),
        pitch: Math.round(65 + Math.random() * 30),
        timing: Math.round(75 + Math.random() * 20),
        feedback: [
          '👍 Good pitch control in the verses!',
          '📈 Work on breath support in the chorus',
          '⏱️ Great rhythm throughout',
        ],
        qualifiesForGoldenTicket: false,
      };
      
      simulatedScore.qualifiesForGoldenTicket = simulatedScore.overall >= 95;
      
      setScoreResult(simulatedScore);
      setIsPracticing(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit recording');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetSession = () => {
    setCurrentSession(null);
    setScoreResult(null);
    setPitchData([]);
    setIsPracticing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neonPink mb-4">
          🎤 Vocal Coach
        </h2>
        <p className="text-gray-300">
          Practice singing and get real-time feedback. Score 95% or higher to earn your Golden Ticket! 🎫
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Song Selection */}
      {!currentSession && !scoreResult && (
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Choose a Song to Practice</h3>
          <div className="grid gap-4">
            {demoSongs.map(song => (
              <button
                key={song.id}
                onClick={() => startPracticeSession(song.id)}
                disabled={isLoading}
                className="p-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-neonPink rounded-xl transition text-left group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white group-hover:text-neonPink transition">{song.title}</p>
                    <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    song.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    song.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {song.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-neonBlue/10 border border-neonBlue/30 rounded-lg">
            <p className="text-sm text-neonBlue">
              💡 <strong>Tip:</strong> Connect the backend to unlock voice cloning. Your practice track will be sung in your own AI-cloned voice!
            </p>
          </div>
        </div>
      )}

      {/* Practice Mode */}
      {isPracticing && currentSession && (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{currentSession.songTitle}</h3>
          <p className="text-gray-400 mb-8">{currentSession.songArtist}</p>
          
          <div className="mb-8">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-neonPink to-purple-600 hover:scale-110 transition-all duration-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,0,255,0.5)]"
              >
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-all duration-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse"
              >
                <div className="w-12 h-12 bg-white rounded-lg"></div>
              </button>
            )}
          </div>
          
          {isRecording && (
            <div className="space-y-2">
              <p className="text-3xl font-mono text-neonPink font-bold">{formatTime(recordingTime)}</p>
              <p className="text-sm text-gray-400 animate-pulse">Recording... Sing your heart out!</p>
              
              {/* Simple pitch visualization */}
              <div className="h-16 mt-4 flex items-end justify-center gap-1">
                {pitchData.slice(-20).map((p, i) => (
                  <div
                    key={i}
                    className="w-2 bg-neonPink rounded-t transition-all"
                    style={{ height: `${Math.min(100, (p.frequency / 800) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {!isRecording && (
            <p className="text-gray-400">Tap the microphone to start recording</p>
          )}
          
          <button
            onClick={resetSession}
            className="mt-8 text-sm text-gray-500 hover:text-white transition"
          >
            ← Choose a different song
          </button>
        </div>
      )}

      {/* Score Results */}
      {scoreResult && (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <div className="mb-8">
            {scoreResult.qualifiesForGoldenTicket ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-3xl font-bold text-gold">GOLDEN TICKET!</h3>
                <p className="text-gray-300 mt-2">You've earned your guaranteed audition!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-3xl font-bold text-white">Great Practice!</h3>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-4xl font-bold text-neonPink">{scoreResult.overall}%</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Overall</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-4xl font-bold text-neonBlue">{scoreResult.pitch}%</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pitch</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-4xl font-bold text-purple-400">{scoreResult.timing}%</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Timing</p>
            </div>
          </div>
          
          <div className="text-left mb-8">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Feedback</h4>
            <ul className="space-y-2">
              {scoreResult.feedback.map((fb, i) => (
                <li key={i} className="text-gray-300 text-sm">{fb}</li>
              ))}
            </ul>
          </div>
          
          {!scoreResult.qualifiesForGoldenTicket && (
            <p className="text-sm text-gray-500 mb-6">
              Score 95% or higher to earn your Golden Ticket! 🎫
            </p>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setScoreResult(null)}
              className="px-6 py-3 bg-neonPink text-black font-bold rounded-lg hover:bg-pink-400 transition"
            >
              Try Again
            </button>
            <button
              onClick={resetSession}
              className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition"
            >
              New Song
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-neonPink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Analyzing your performance...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocalCoachMode;