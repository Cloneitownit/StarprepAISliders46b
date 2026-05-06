import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing?: boolean;
  label?: string;
  onRecordStart?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  isProcessing = false,
  label = "Record Audio",
  onRecordStart
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analyser for VU meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start VU meter animation
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255 * 100);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
      
      // Use best available format for voice cloning quality
      // WAV > PCM > OGG > WebM (WebM strips vocal data AI needs)
      const mimeOptions = [
        'audio/wav',
        'audio/pcm',
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=pcm',
        'audio/webm;codecs=opus', 
        'audio/webm',
      ];
      let selectedMime = 'audio/webm';
      for (const mime of mimeOptions) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          console.log('🎙️ Recording format:', mime);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      if (onRecordStart) onRecordStart();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get VU meter color based on level
  const getVuColor = (level: number) => {
    if (level > 70) return 'bg-red-500';
    if (level > 40) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      {/* VU Meter - Always visible when recording */}
      {isRecording && (
        <div className="w-full max-w-xs mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400">🎤 MIC LEVEL</span>
            <span className="text-xs text-neonPink font-mono">{Math.round(audioLevel)}%</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div 
              className={`h-full transition-all duration-75 ${getVuColor(audioLevel)}`}
              style={{ width: `${Math.min(audioLevel, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Silent</span>
            <span>Good</span>
            <span>Loud</span>
          </div>
          {audioLevel < 5 && (
            <p className="text-xs text-red-400 mt-2 text-center animate-pulse">
              ⚠️ No audio detected! Check your mic.
            </p>
          )}
        </div>
      )}

      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-neonPink to-purple-600 hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg className="w-16 h-16 text-white group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse"
        >
          <div className="w-12 h-12 bg-white rounded-lg"></div>
        </button>
      )}

      <div className="text-center">
        {isRecording && (
          <div className="space-y-2">
            <p className="text-2xl font-mono text-neonPink font-bold">{formatTime(recordingTime)}</p>
            <p className="text-xs text-gray-400 animate-pulse">Recording...</p>
          </div>
        )}
        {!isRecording && !isProcessing && (
          <p className="text-sm text-gray-400">{label}</p>
        )}
        {isProcessing && (
          <p className="text-sm text-neonBlue animate-pulse">Processing...</p>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
