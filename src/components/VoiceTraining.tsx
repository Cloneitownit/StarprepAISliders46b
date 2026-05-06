
import React, { useState, useRef, useEffect } from 'react';

interface VoiceTrainingProps {
  onComplete: (audioBlobs: Blob[]) => void;
  onClose: () => void;
  jingleUrl?: string;
}

const VoiceTraining: React.FC<VoiceTrainingProps> = ({
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<'gender' | 'record' | 'complete'>('gender');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const selectGender = (g: 'male' | 'female') => {
    setGender(g);
    localStorage.setItem('starprep_voice_gender', g);
    setStep('record');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyzer for VU meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // VU meter animation
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel((avg / 255) * 100);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecording(blob);
        stream.getTracks().forEach(t => t.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setAudioLevel(0);
        setStep('complete');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Mic error:', err);
      alert('Please allow microphone access!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getVuColor = (level: number) => {
    if (level > 70) return 'bg-red-500';
    if (level > 40) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-pink-500/50 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-pink-500/30">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
            🎤 Voice Sample
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Gender Selection */}
          {step === 'gender' && (
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">⚡ Quick Voice Capture</h3>
              <p className="text-gray-400 mb-6">Record 15-20 seconds so AI can learn your unique voice!</p>
              <p className="text-pink-400 font-semibold mb-4">Select your voice type:</p>
              
              <div className="flex gap-4 justify-center">
                <button 
                  className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-gradient-to-b from-blue-900/50 to-blue-950/50 border-2 border-blue-500/30 hover:border-pink-400 transition-all hover:scale-105"
                  onClick={() => selectGender('male')}
                >
                  <span className="text-4xl">👨‍🎤</span>
                  <span className="text-blue-300 font-semibold">Male</span>
                </button>
                <button 
                  className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-gradient-to-b from-pink-900/50 to-pink-950/50 border-2 border-pink-500/30 hover:border-pink-400 transition-all hover:scale-105"
                  onClick={() => selectGender('female')}
                >
                  <span className="text-4xl">👩‍🎤</span>
                  <span className="text-pink-300 font-semibold">Female</span>
                </button>
              </div>
            </div>
          )}

          {/* Record */}
          {step === 'record' && (
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Record Your Voice 🎤</h3>
              
              <div className={`bg-black/50 rounded-2xl p-6 mb-6 border ${isRecording ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-pink-500/20'}`}>
                <p className="text-white text-lg leading-relaxed mb-3">
                  🎤 Sing or speak for 15-20 seconds:
                </p>
                <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-4 border border-pink-500/30 text-left">
                  <p className="text-pink-300 leading-relaxed space-y-2">
                    <span className="block">🎵 Sing a few lines of your favorite song</span>
                    <span className="block">💬 Or just talk naturally — tell us about your day!</span>
                    <span className="block">🎶 The more you record, the better your clone sounds</span>
                  </p>
                </div>
                <p className="text-gray-500 text-sm mt-3">
                  💡 Just be yourself — AI needs to hear YOUR unique voice!
                </p>
              </div>

              {/* VU Meter */}
              {isRecording && (
                <div className="mb-6">
                  <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600 max-w-xs mx-auto">
                    <div 
                      className={`h-full transition-all duration-75 ${getVuColor(audioLevel)}`}
                      style={{ width: `${Math.min(audioLevel, 100)}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">🎤 {Math.round(audioLevel)}%</p>
                </div>
              )}

              {!isRecording ? (
                <button 
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg hover:scale-105 transition-transform"
                  onClick={startRecording}
                >
                  🔴 Start Recording
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-red-400 text-xl font-semibold">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    Recording {formatTime(recordingTime)}
                  </div>
                  
                  {recordingTime >= 10 && (
                    <button 
                      className="px-6 py-3 rounded-full bg-white/10 border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-all"
                      onClick={stopRecording}
                    >
                      ⏹️ Stop & Save
                    </button>
                  )}
                  
                  {recordingTime < 10 && (
                    <p className="text-yellow-400 text-sm">
                      Keep going! Need at least 10 seconds...
                    </p>
                  )}
                </div>
              )}

              <p className="text-gray-500 text-sm mt-4">
                💡 Tip: Clear audio in a quiet room works best!
              </p>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && recording && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">Voice Captured!</h3>
              <p className="text-white mb-6">Your {recordingTime} second sample is ready.</p>
              
              <div className="bg-black/50 rounded-xl p-4 mb-6 border border-green-500/30">
                <p className="text-gray-300 text-sm">
                  ⚡ <strong>Instant voice cloning</strong> — your voice applied in seconds!<br/>
                  Your voice will be applied instantly when creating songs.
                </p>
              </div>

              <button 
                className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg hover:scale-105 transition-transform"
                onClick={() => onComplete([recording])}
              >
                ✨ Save Voice Sample
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTraining;
