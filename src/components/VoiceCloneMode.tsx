import React, { useState, useEffect } from 'react';

import VoiceTraining from './VoiceTraining';
import { VoiceCloneCreateGuide, VoiceCloneRecordGuide } from './TrainingGuide';

interface VoiceCloneModeProps {
  onGoToSongWriter?: () => void;
  trainingMode?: boolean;
  trainingStep?: number;
  advanceStep?: (step: number) => void;
}

// Convert audio Blob → 48kHz mono WAV Blob
// Replicate RVC requires real PCM WAV — not renamed webm
async function convertToWav(blob: Blob): Promise<Blob> {
  const TARGET_RATE = 48000;
  const arrayBuffer = await blob.arrayBuffer();
  const decodeCtx   = new AudioContext();
  const decoded     = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  decodeCtx.close();

  const totalSamples = Math.ceil(decoded.duration * TARGET_RATE);
  console.log(`🎵 Converting ${decoded.duration.toFixed(1)}s recording to 48kHz mono WAV...`);

  const offlineCtx = new OfflineAudioContext(1, totalSamples, TARGET_RATE);
  const source     = offlineCtx.createBufferSource();
  source.buffer    = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);
  const resampled  = await offlineCtx.startRendering();

  const samples   = resampled.getChannelData(0);
  const dataBytes = samples.length * 2;
  const buffer    = new ArrayBuffer(44 + dataBytes);
  const view      = new DataView(buffer);

  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true);
  w(8, 'WAVE'); w(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);               // PCM
  view.setUint16(22, 1, true);               // mono
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, 'data'); view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s * 0x7FFF, true);
    offset += 2;
  }

  const wavBlob = new Blob([buffer], { type: 'audio/wav' });
  console.log(`✅ WAV ready: ${(wavBlob.size / 1024 / 1024).toFixed(2)}MB`);
  return wavBlob;
}

const VoiceCloneMode: React.FC<VoiceCloneModeProps> = ({ onGoToSongWriter, trainingMode = false, trainingStep = 0, advanceStep }) => {
  const [showTraining, setShowTraining]             = useState(false);
  const [voiceReady, setVoiceReady]                 = useState(false);
  const [isProcessing, setIsProcessing]             = useState(false);
  const [processingStatus, setProcessingStatus]     = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [voiceGender, setVoiceGender]               = useState<string | null>(null);
  
  // TUNING SLIDERS STATE
  const [pitchShift, setPitchShift] = useState(0);
  const [indexRate, setIndexRate] = useState(0.75);
  const [rmsMixRate, setRmsMixRate] = useState(0.2);
  const [protect, setProtect] = useState(0.3);
  const [filterRadius, setFilterRadius] = useState(4);
  const [showTuning, setShowTuning] = useState(false);

  useEffect(() => {
    const isSetup = localStorage.getItem('starprep_voice_setup_complete') === 'true';
    const gender  = localStorage.getItem('starprep_voice_gender');
    setVoiceReady(isSetup);
    setVoiceGender(gender);
    if (isSetup && trainingStep === 2 && advanceStep) advanceStep(3);
    
    // Load saved tuning settings
    const savedTuning = localStorage.getItem('starprep_voice_tuning');
    if (savedTuning) {
      try {
        const t = JSON.parse(savedTuning);
        setPitchShift(t.pitchShift ?? 0);
        setIndexRate(t.indexRate ?? 0.75);
        setRmsMixRate(t.rmsMixRate ?? 0.2);
        setProtect(t.protect ?? 0.3);
        setFilterRadius(t.filterRadius ?? 4);
      } catch (e) {
        console.log('Could not load saved tuning');
      }
    }
  }, []);
  
  // Save tuning settings whenever they change
  const saveTuning = () => {
    const tuning = { pitchShift, indexRate, rmsMixRate, protect, filterRadius };
    localStorage.setItem('starprep_voice_tuning', JSON.stringify(tuning));
    console.log('🎚️ Tuning saved:', tuning);
  };
  
  useEffect(() => {
    saveTuning();
  }, [pitchShift, indexRate, rmsMixRate, protect, filterRadius]);

  const handleReset = () => {
    localStorage.removeItem('starprep_voice_setup_complete');
    localStorage.removeItem('starprep_voice_model_url');
    localStorage.removeItem('starprep_voice_sample_url');
    localStorage.removeItem('starprep_voice_gender');
    localStorage.removeItem('starprep_voice_base64');
    localStorage.removeItem('starprep_voice_base64_type');
    localStorage.removeItem('starprep_voice_method');
    localStorage.removeItem('starprep_voice_prediction_id');
    localStorage.removeItem('starprep_voice_user_id');
    localStorage.removeItem('starprep_voice_tuning');
    setVoiceReady(false);
    setVoiceGender(null);
  };
  
  const applyRonsPreset = () => {
    setPitchShift(-3);
    setIndexRate(0.75);
    setRmsMixRate(0.2);
    setProtect(0.3);
    setFilterRadius(4);
  };
  
  const resetTuning = () => {
    setPitchShift(0);
    setIndexRate(0.75);
    setRmsMixRate(0.2);
    setProtect(0.3);
    setFilterRadius(4);
  };

  const pollForTrainingComplete = async (userId: string, predictionId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 180;
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;
        try {
          const params = new URLSearchParams({ userId, predictionId });
          const response = await fetch(`/api/check-training?${params}`);
          const data = await response.json();

          if (data.status === 'ready' && data.modelUrl) {
            console.log('✅ RVC model ready:', data.modelUrl);
            resolve(data.modelUrl);
          } else if (data.status === 'error') {
            reject(new Error(data.message || 'Training failed'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Training timed out. Please try again.'));
          } else {
            const elapsed = attempts * 10;
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            setProcessingStatus(`🧬 ${data.progress || 'Training...'} (${timeStr})`);
            setProcessingProgress(40 + Math.min(attempts, 50));
            setTimeout(checkStatus, 10000);
          }
        } catch {
          if (attempts >= maxAttempts) reject(new Error('Training check failed'));
          else setTimeout(checkStatus, 10000);
        }
      };

      checkStatus();
    });
  };

  const handleTrainingComplete = async (recordings: Blob[]) => {
    setShowTraining(false);
    setIsProcessing(true);
    setProcessingProgress(5);
    setProcessingStatus('Preparing your voice sample...');

    try {
      const userId = 'user_' + Date.now();
      localStorage.setItem('starprep_voice_user_id', userId);

      // Step 1: Combine recordings
      const combinedBlob = new Blob(recordings, { type: recordings[0]?.type || 'audio/webm' });
      console.log(`📦 Raw recording: ${(combinedBlob.size / 1024 / 1024).toFixed(2)}MB`);

      setProcessingProgress(10);
      setProcessingStatus('🎵 Converting to 48kHz WAV...');

      // Step 2: Convert to real 48kHz mono WAV
      const wavBlob = await convertToWav(combinedBlob);

      setProcessingProgress(20);
      setProcessingStatus('☁️ Uploading voice directly to cloud storage...');

      // Step 3: POST WAV binary to our server → server uploads to Supabase
      console.log('☁️ Uploading voice to storage...');
      const filename = `voices/${userId}_${Date.now()}.wav`;

      const uploadResponse = await fetch('/api/upload-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
          'X-Filename': filename,
        },
        body: wavBlob,
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error((errData as any).error || 'Upload failed: ' + uploadResponse.status);
      }

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.url;
      console.log('✅ Uploaded:', audioUrl);

      setProcessingProgress(30);
      setProcessingStatus('🧬 Starting voice model training...');

      // Step 4: Send ONLY the URL to our server
      const trainResponse = await fetch('/api/train-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl, userId }),
      });

      if (!trainResponse.ok) {
        const errData = await trainResponse.json().catch(() => ({}));
        throw new Error((errData as any).error || 'Training failed: ' + trainResponse.status);
      }

      const trainResult = await trainResponse.json();
      if (!trainResult.success || !trainResult.predictionId) {
        throw new Error(trainResult.error || 'No prediction ID returned');
      }

      localStorage.setItem('starprep_voice_prediction_id', trainResult.predictionId);

      setProcessingProgress(35);
      setProcessingStatus('🧬 Training your voice model... (~10 min)');

      // Step 5: Poll until webhook fires and Supabase shows ready
      const modelUrl = await pollForTrainingComplete(userId, trainResult.predictionId);

      localStorage.setItem('starprep_voice_model_url', modelUrl);
      localStorage.setItem('starprep_voice_method', 'replicate-rvc');

      const gender = localStorage.getItem('starprep_voice_gender') || 'female';
      localStorage.setItem('starprep_voice_setup_complete', 'true');
      localStorage.removeItem('starprep_voice_prediction_id');

      setProcessingProgress(100);
      setProcessingStatus('🎉 Voice model trained! Songs will sound like YOU!');

      setTimeout(() => {
        setIsProcessing(false);
        setVoiceReady(true);
        setVoiceGender(gender);
      }, 1500);

    } catch (error: any) {
      console.error('Voice setup error:', error);
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
      alert('Voice setup failed: ' + (error.message || 'Unknown error') + '\n\nPlease try recording again.');
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-pink-500/30 text-center">
          <div className="text-8xl mb-6 animate-pulse">🎤</div>
          <h2 className="text-3xl font-bold text-white mb-4">Training Your Voice Model...</h2>
          <p className="text-gray-400 mb-8">{processingStatus}</p>
          <div className="max-w-md mx-auto">
            <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500" style={{ width: `${processingProgress}%` }} />
            </div>
            <p className="text-pink-500 font-bold text-2xl">{Math.round(processingProgress)}%</p>
          </div>
          <p className="text-gray-500 text-sm mt-4">Voice model training takes about 10 minutes.<br/>Please don't close this page!</p>
        </div>
      </div>
    );
  }

  if (showTraining) {
    return <VoiceTraining onComplete={handleTrainingComplete} onClose={() => setShowTraining(false)} jingleUrl="/starprep-jingle.mp3" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">🎤 Voice Clone</h1>
        <p className="text-gray-300">Record your voice and AI will create songs that sound like YOU!</p>
      </div>

      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-pink-500/30 text-center">
        {voiceReady ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Voice Clone Ready!</h2>
            {voiceGender && <p className="text-gray-400 mb-4">Voice type: {voiceGender === 'male' ? '👨‍🎤 Male' : '👩‍🎤 Female'}</p>}
            <p className="text-gray-300 mb-6">Your voice clone is ready! Create songs that sound like you!</p>
            
            {/* TUNING SLIDERS SECTION */}
            <div className="mb-6">
              <button 
                onClick={() => setShowTuning(!showTuning)}
                className="px-6 py-2 rounded-xl bg-purple-600/50 text-white hover:bg-purple-600 transition mb-4"
              >
                🎚️ {showTuning ? 'Hide' : 'Show'} Voice Tuning
              </button>
              
              {showTuning && (
                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-pink-500/30 text-left mt-4">
                  <h3 className="text-xl font-bold text-pink-400 mb-4 text-center">🎚️ Voice Tuning Controls</h3>
                  
                  {/* Pitch Shift */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-semibold">🎵 Pitch Shift</span>
                      <span className="text-pink-400 font-bold">{pitchShift > 0 ? '+' : ''}{pitchShift} semitones</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={pitchShift}
                      onChange={(e) => setPitchShift(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Lower = deeper voice | Higher = higher voice</p>
                  </div>
                  
                  {/* Index Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-semibold">🎤 Voice Identity</span>
                      <span className="text-pink-400 font-bold">{indexRate.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={indexRate}
                      onChange={(e) => setIndexRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Lower = cleaner but generic | Higher = more YOU but scratchier</p>
                  </div>
                  
                  {/* RMS Mix Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-semibold">📊 Volume Blend</span>
                      <span className="text-pink-400 font-bold">{rmsMixRate.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={rmsMixRate}
                      onChange={(e) => setRmsMixRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Lower = smoother volume | Higher = more dynamic</p>
                  </div>
                  
                  {/* Protect */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-semibold">💨 Breath Protect</span>
                      <span className="text-pink-400 font-bold">{protect.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={protect}
                      onChange={(e) => setProtect(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Lower = processed | Higher = natural breaths</p>
                  </div>
                  
                  {/* Filter Radius */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-semibold">✨ Smoothing</span>
                      <span className="text-pink-400 font-bold">{filterRadius}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="7"
                      step="1"
                      value={filterRadius}
                      onChange={(e) => setFilterRadius(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Lower = detailed | Higher = smoother</p>
                  </div>
                  
                  {/* Preset Buttons */}
                  <div className="flex gap-3 justify-center mt-6">
                    <button
                      onClick={applyRonsPreset}
                      className="px-4 py-2 rounded-lg bg-pink-600 text-white font-bold hover:bg-pink-500 transition"
                    >
                      🎯 Ron's Preset
                    </button>
                    <button
                      onClick={resetTuning}
                      className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition"
                    >
                      🔄 Reset
                    </button>
                  </div>
                  
                  <p className="text-green-400 text-center text-sm mt-4">✅ Settings auto-saved!</p>
                </div>
              )}
            </div>
            
            <VoiceCloneCreateGuide show={trainingMode && trainingStep === 3} />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {onGoToSongWriter && (
                <button onClick={() => onGoToSongWriter()} className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xl hover:scale-105 transition transform">
                  🎤 Create Your Song!
                </button>
              )}
              <button onClick={handleReset} className="px-6 py-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition">🔄 Record New Sample</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🎙️</div>
            <h2 className="text-2xl font-bold text-pink-400 mb-4">Record Your Voice</h2>
            <p className="text-gray-300 mb-2">Sing along to our jingle and we'll capture your unique voice!</p>
            <p className="text-gray-500 text-sm mb-8">⚡ Training takes about 10 minutes</p>
            <VoiceCloneRecordGuide show={trainingMode && trainingStep === 2} />
            <button onClick={() => { setShowTraining(true); if (advanceStep) advanceStep(3); }} className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xl hover:scale-105 transition transform">
              🎤 Record Voice Sample
            </button>
          </>
        )}
      </div>

      <div className="mt-8 bg-black/20 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-pink-400 mb-4">💡 How Voice Clone Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4"><div className="text-3xl mb-2">1️⃣</div><p className="text-gray-300 font-semibold">Listen to Jingle</p><p className="text-gray-500 text-sm">Learn the fun melody</p></div>
          <div className="text-center p-4"><div className="text-3xl mb-2">2️⃣</div><p className="text-gray-300 font-semibold">Sing & Record</p><p className="text-gray-500 text-sm">Capture your voice</p></div>
          <div className="text-center p-4"><div className="text-3xl mb-2">3️⃣</div><p className="text-gray-300 font-semibold">AI Trains Model</p><p className="text-gray-500 text-sm">~10 min to build your voice</p></div>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-xl p-4 border border-pink-500/20">
          <h4 className="font-bold text-pink-400 mb-2">🎤 Singing Voice Cloning</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Powered by RVC (Retrieval Voice Conversion)</li>
            <li>• Built specifically for singing</li>
            <li>• Preserves pitch, melody & emotion</li>
            <li>• Train once, use forever</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/20">
          <h4 className="font-bold text-purple-400 mb-2">✨ What You Get</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Songs generated in YOUR voice</li>
            <li>• Practice with your own sound</li>
            <li>• Hear how you'd sound on stage</li>
            <li>• Prepare for auditions perfectly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloneMode;
