
import React, { useState, useEffect, useRef } from 'react';
import { generateSongFromAudio } from '../services/claudeService';
import { generateTrackAudio, generateClonedTrack } from '../services/musicGenService';
import { SongResult } from '../types';
import AudioRecorder from './AudioRecorder';
// Voice setup handled by VoiceCloneMode — no separate setup needed
import { RecordLiveGuide, CollectRewardsGuide, SelectGenderGuide, SelectGenreGuide, CloneVoiceToggleGuide, GenerateGuide } from './TrainingGuide';

interface SongWriterModeProps {
  onComplete?: () => void;
  trainingMode?: boolean;
  onDismissTraining?: () => void;
  trainingStep?: number;
  advanceStep?: (step: number) => void;
}

// Helper to render lyrics with structure highlighting
const renderStructuredLyrics = (rawLyrics: string) => {
  const parts = rawLyrics.split(/(\[.*?\])/).filter(p => p.trim());
  const blocks = [];
  
  for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('[') && part.endsWith(']')) {
          const header = part.replace(/[\[\]]/g, '');
          const content = parts[i+1] && !parts[i+1].startsWith('[') ? parts[i+1] : '';
          if (content) i++;
          blocks.push({ header, content });
      } else {
          blocks.push({ header: '', content: part });
      }
  }

  return (
      <div className="space-y-12 flex flex-col items-center w-full animate-fade-in-up">
          {blocks.map((block, idx) => {
              const type = block.header.toLowerCase();
              let borderColor = "border-gray-800";
              let textColor = "text-gray-300";
              let badgeClass = "bg-gray-800 text-gray-400";
              let containerBg = "bg-black/80";
              
              if (type.includes('chorus')) {
                  borderColor = "border-neonPink/60";
                  textColor = "text-white font-medium";
                  badgeClass = "bg-neonPink text-black font-bold shadow-[0_0_15px_rgba(255,0,255,0.6)]";
                  containerBg = "bg-black/90 border-neonPink/30"; 
              } else if (type.includes('verse')) {
                  borderColor = "border-neonBlue/40";
                  textColor = "text-gray-200";
                  badgeClass = "bg-neonBlue/20 text-neonBlue border border-neonBlue/30 font-bold";
                  containerBg = "bg-black/80";
              } else if (type.includes('bridge')) {
                  borderColor = "border-purple-500/60";
                  textColor = "text-purple-100 italic";
                  badgeClass = "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)]";
                  containerBg = "bg-purple-900/40";
              } else if (type.includes('outro') || type.includes('intro')) {
                  borderColor = "border-white/20";
                  textColor = "text-gray-400";
                  badgeClass = "bg-white/10 text-gray-300 border border-white/10 font-bold";
                  containerBg = "bg-black/80";
              }

              return (
                  <div key={idx} className={`w-full max-w-3xl p-8 md:p-10 rounded-3xl border ${borderColor} ${containerBg} backdrop-blur-md relative group transition-all duration-300 hover:scale-[1.02] text-center shadow-2xl`}>
                      {block.header && (
                         <span className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs uppercase tracking-widest ${badgeClass} z-10`}>
                             {block.header}
                         </span>
                      )}
                      <p className={`whitespace-pre-wrap font-serif text-2xl md:text-4xl leading-relaxed text-center ${textColor} ${block.header ? 'mt-4' : ''}`}>
                          {block.content.trim()}
                      </p>
                  </div>
              );
          })}
      </div>
  );
};

const SongWriterMode: React.FC<SongWriterModeProps> = ({ onComplete, trainingMode = false, onDismissTraining, trainingStep = 0, advanceStep }) => {
  console.log('🎯 SongWriterMode v48 | trainingMode:', trainingMode, '| step:', trainingStep);
  const [result, setResult] = useState<SongResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  
  // Voice Setup State
  const [voiceReady] = useState(() => localStorage.getItem('starprep_voice_setup_complete') === 'true');
  
  // Input Method State
  const [inputMethod, setInputMethod] = useState<'RECORD' | 'UPLOAD'>('RECORD');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Audio Generation State
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [useVoiceClone, setUseVoiceClone] = useState(true); // v39: ON by default — voice auto-captured from 4 words
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('starprep_autoplay') !== 'false'); // ON by default
  const [audioProgressPercent, setAudioProgressPercent] = useState(0);
  const [audioProgressStep, setAudioProgressStep] = useState('');
  
  // Voice Cloning Specific State
  const [selectedVoiceModel, setSelectedVoiceModel] = useState<string>('Studio Pop (Male)');
  const [referenceMethod, setReferenceMethod] = useState<'ORIGINAL' | 'UPLOAD'>('ORIGINAL');
  const [customReferenceFile, setCustomReferenceFile] = useState<File | null>(null);
  const [vocalGender, setVocalGender] = useState<'m' | 'f'>('f'); // Male or Female AI vocals
  const [selectedGenre, setSelectedGenre] = useState<string>('Pop'); // Song genre

  // Audio generation progress timer (must be after all state declarations)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressStartRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioLoading) {
      progressStartRef.current = Date.now();
      setAudioProgressPercent(2);
      
      const estimatedTotal = useVoiceClone ? 90000 : 45000;
      
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - progressStartRef.current;
        const rawPercent = (elapsed / estimatedTotal) * 100;
        const smoothPercent = Math.min(95, rawPercent * (1 - rawPercent / 200));
        setAudioProgressPercent(Math.max(2, Math.round(smoothPercent)));
      }, 500);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (generatedAudioUrl) {
        setAudioProgressPercent(100);
        setTimeout(() => setAudioProgressPercent(0), 1500);
      } else {
        setAudioProgressPercent(0);
      }
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [audioLoading]);

  const handleAudioProgress = (msg: string) => {
    setAudioProgressStep(msg);
    setAnalysisStep(msg);
    if (msg.includes('Step 1')) setAudioProgressPercent(10);
    else if (msg.includes('song is ready') || msg.includes('Song ready')) setAudioProgressPercent(30);
    else if (msg.includes('Step 2') || msg.includes('Separating')) setAudioProgressPercent(35);
    else if (msg.includes('Stems')) setAudioProgressPercent(45);
    else if (msg.includes('Step 3') || msg.includes('Cloning')) setAudioProgressPercent(50);
    else if (msg.includes('Voice cloned')) setAudioProgressPercent(85);
    else if (msg.includes('Step 4') || msg.includes('Mixing')) setAudioProgressPercent(88);
    else if (msg.includes('Mix complete') || msg.includes('complete')) setAudioProgressPercent(95);
  };

  const voiceModels = [
    { id: 'Studio Pop (Male)', label: 'Studio Pop (Male)' },
    { id: 'Studio Pop (Female)', label: 'Studio Pop (Female)' },
    { id: 'R&B Soul', label: 'R&B Soul' },
    { id: 'Future Bass (Robot)', label: 'Future Bass (Robot)' },
  ];

  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    
    // ═══════════════════════════════════════════════════════════════
    // v43: Only auto-save as voice reference if NO longer sample exists
    // If user recorded 15-30 sec in Voice Clone, DON'T overwrite with 3 sec
    // ═══════════════════════════════════════════════════════════════
    const existingVoice = localStorage.getItem('starprep_voice_base64');
    if (!existingVoice) {
      try {
        console.log('💾 No voice sample found — saving 4-word recording as fallback...');
        const wavBase64 = await convertBlobToWavBase64(blob);
        localStorage.setItem('starprep_voice_base64', wavBase64);
        localStorage.setItem('starprep_voice_base64_type', 'audio/wav');
        localStorage.setItem('starprep_voice_setup_complete', 'true');
        console.log('✅ Voice reference saved:', Math.round(wavBase64.length / 1024), 'KB');
      } catch (e) {
        console.warn('⚠️ Voice auto-save failed:', e);
      }
    } else {
      console.log('✅ Longer voice sample already exists (' + Math.round(existingVoice.length / 1024) + ' KB) — NOT overwriting with 4-word clip');
    }
    
    await processAudio(blob);
  };

  // Convert audio blob to WAV base64 for voice cloning
  const convertBlobToWavBase64 = async (blob: Blob): Promise<string> => {
    const audioContext = new AudioContext({ sampleRate: 44100 });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const length = audioBuffer.length;
    const wavBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wavBuffer);
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, length * 2, true);
    const ch = audioBuffer.getChannelData(0);
    let off = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(off, Math.max(-1, Math.min(1, ch[i])) * 0x7FFF, true);
      off += 2;
    }
    const bytes = new Uint8Array(wavBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    audioContext.close();
    return btoa(binary);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    const blob = new Blob([uploadedFile], { type: uploadedFile.type });
    setAudioBlob(blob);
    await processAudio(blob);
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedAudioUrl(null);
    setAudioError(null);
    
    setAnalysisStep('Listening to your 4 words...');
    
    try {
      setTimeout(() => setAnalysisStep('Extracting Vocal DNA & Timbre...'), 1500);
      setTimeout(() => setAnalysisStep('Detecting Musical Style & Genre...'), 3000);
      setTimeout(() => setAnalysisStep('Composing Full Hit Song...'), 4500);
      setTimeout(() => setAnalysisStep('Generating Audio Track...'), 6000);

      const data = await generateSongFromAudio(blob);
      setResult(data);
      if (advanceStep && trainingStep === 5) advanceStep(6);
      
      // Don't auto-use backend audio - let user choose gender first
      // if (data.audioUrl) {
      //   console.log('✅ Using audio from backend:', data.audioUrl);
      //   setGeneratedAudioUrl(data.audioUrl);
      // }
      
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create song. Please try singing clearly or check your file format.");
    } finally {
      setLoading(false);
      setAnalysisStep('');
    }
  };

  const handleGenerateAudio = async () => {
    if (!result) return;
    setAudioLoading(true);
    setAudioError(null);
    setAudioProgressPercent(0);
    setAudioProgressStep('');
    
    // Pre-wake Seed-VC space if voice cloning is enabled
    if (useVoiceClone) {
      console.log('🔥 Pre-waking Seed-VC space for voice cloning...');
      fetch('https://ronbooron-seed-vc.hf.space/gradio_api/info', { signal: AbortSignal.timeout(10000) }).catch(() => {});
    }
    
    // Override hardcoded genre with user's selection
    const songResult = { ...result, genre: selectedGenre };
    
    try {
      let url: string;
      
      if (useVoiceClone) {
        const baseSongUrl = generatedAudioUrl || result.audioUrl;
        try {
          if (referenceMethod === 'UPLOAD') {
             if (!customReferenceFile) {
               setAudioError("Please upload a custom voice sample to proceed with cloning.");
               setAudioLoading(false);
               return;
             }
             const songWithAudio = { ...songResult, audioUrl: baseSongUrl };
             url = await generateClonedTrack(songWithAudio, customReferenceFile, selectedVoiceModel, handleAudioProgress, vocalGender);
          } else {
             if (!audioBlob) {
               setAudioError("Original recording not found. Please try uploading a sample instead.");
               setAudioLoading(false);
               return;
             }
             const songWithAudio = { ...songResult, audioUrl: baseSongUrl };
             url = await generateClonedTrack(songWithAudio, audioBlob, selectedVoiceModel, handleAudioProgress, vocalGender);
          }
        } catch (cloneErr: any) {
          // v32: Graceful fallback — if cloning fails, play the AI song instead of showing error
          console.warn('⚠️ Voice cloning failed, falling back to AI song:', cloneErr?.message);
          if (baseSongUrl) {
            url = baseSongUrl;
            handleAudioProgress('🎵 Your song is ready! (Voice cloning unavailable right now — playing AI version)');
          } else {
            throw cloneErr; // No fallback available
          }
        }
      } else {
        handleAudioProgress(`Generating ${vocalGender === 'm' ? 'male' : 'female'} ${selectedGenre} vocals...`);
        url = await generateTrackAudio(songResult, handleAudioProgress, vocalGender);
      }
      
      console.log('Audio URL generated:', url);
      setGeneratedAudioUrl(url);
      
      // Autoplay if enabled
      if (autoPlay && url) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Autoplay blocked by browser:', e.message));
          }
        }, 500);
      }
      
      // Verify the audio URL is valid
      if (!url || url === '') {
        throw new Error('Empty audio URL returned');
      }
      
      // v13 FIX: Save audio URL to localStorage for JudgeMode
      // This lets the Judge play the song as a reference for the singer
      try {
        localStorage.setItem('starprep_last_song_url', url);
        if (result?.lyrics) {
          localStorage.setItem('starprep_last_song_lyrics', result.lyrics);
        }
        console.log('💾 Saved song URL for Judge mode');
      } catch (e) { /* ignore */ }
      
    } catch (err: any) {
      console.error("Audio generation failed:", err);
      setAudioError(err?.message || "Failed to generate audio. Please check your API keys and try again.");
    } finally {
      setAudioLoading(false);
    }
  };

  const saveSong = () => {
    if (!result) return;
    const content = `TITLE: ${result.title}\nGENRE: ${result.genre}\nVOCAL STYLE: ${result.vocalAnalysis || 'N/A'}\n\n[CHORDS]\n${result.chords}\n\n[STRUCTURE]\n${result.structure}\n\n[LYRICS]\n${result.lyrics}`;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${result.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6 animate-fade-in-up">
      
      <div className="text-center mb-10">
        {/* Voice Status - Top Right */}
        <div className="flex justify-end mb-4">
          <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
            voiceReady 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
          }`}>
            {voiceReady ? '✅ Voice Ready' : '🎤 Record voice in Clone Voice'}
          </div>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-purple-400 mb-4">
          Song Writer
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Sing just 4 words and our AI will compose a complete song with lyrics, melody suggestions, and structure.
        </p>
      </div>

      {/* Input Method Selector */}
      {!result && !loading && (
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setInputMethod('RECORD')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              inputMethod === 'RECORD'
                ? 'bg-neonPink text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🎤 Record Live
          </button>
          <button
            onClick={() => setInputMethod('UPLOAD')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              inputMethod === 'UPLOAD'
                ? 'bg-neonPink text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📁 Upload File
          </button>
        </div>
      )}

      {/* Recording/Upload UI */}
      {!result && !loading && (
        <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
          {inputMethod === 'RECORD' ? (
            <>
              <RecordLiveGuide show={trainingMode && trainingStep === 4} />
              <AudioRecorder 
              onRecordingComplete={handleRecordingComplete} 
              isProcessing={loading} 
              label="Sing 4 words to create your song"
              onRecordStart={() => { if (advanceStep) advanceStep(5); }}
            />
            </>
          ) : (
            <div className="w-full max-w-md space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-neonPink transition">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="text-sm text-gray-400">
                      {uploadedFile ? uploadedFile.name : 'Click to upload audio file'}
                    </p>
                    <p className="text-xs text-gray-500">MP3, WAV, M4A, or WEBM</p>
                  </div>
                </label>
              </div>
              {uploadedFile && (
                <button
                  onClick={processUploadedFile}
                  className="w-full py-3 bg-neonPink text-black rounded-lg font-bold hover:bg-pink-400 transition"
                >
                  Process Audio File
                </button>
              )}
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center min-h-[400px] space-y-8">
          <CollectRewardsGuide show={trainingMode && trainingStep === 5} />
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-4 border-neonPink/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-neonPink rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              🎵
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl text-neonPink font-bold animate-pulse">{analysisStep}</p>
            <p className="text-sm text-gray-400">This may take 15-30 seconds...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-12">
          {/* Song Header */}
          <div className="text-center space-y-2 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-300">
              {result.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="px-3 py-1 bg-neonPink/20 text-neonPink rounded-full border border-neonPink/30 font-semibold">
                {result.genre}
              </span>
              {result.vocalAnalysis && (
                <span className="px-3 py-1 bg-neonBlue/20 text-neonBlue rounded-full border border-neonBlue/30 font-semibold">
                  {result.vocalAnalysis}
                </span>
              )}
            </div>
          </div>

          {/* Audio Generation Panel */}
          <div className="glass-panel p-8 rounded-2xl border-2 border-neonPink/30 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-4 text-center">🎧 Generate Full Track</h3>
                
                {!generatedAudioUrl ? (
                   <div className="space-y-4">
                     {/* Voice Gender Selector */}
                     <SelectGenderGuide show={trainingMode && trainingStep === 6} />
                     <div className="p-4 bg-black/40 rounded-lg">
                       <label className="block text-xs font-bold text-gray-400 mb-3 uppercase">AI Vocalist</label>
                       <div className="flex gap-3">
                         <button
                           onClick={() => { setVocalGender('f'); localStorage.setItem('starprep_voice_gender', 'female'); if (advanceStep && trainingStep === 6) advanceStep(7); }}
                           className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                             vocalGender === 'f' 
                               ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold' 
                               : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                           }`}
                         >
                           <span className="text-xl">👩‍🎤</span>
                           <span>Female</span>
                         </button>
                         <button
                           onClick={() => { setVocalGender('m'); localStorage.setItem('starprep_voice_gender', 'male'); if (advanceStep && trainingStep === 6) advanceStep(7); }}
                           className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                             vocalGender === 'm' 
                               ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold' 
                               : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                           }`}
                         >
                           <span className="text-xl">👨‍🎤</span>
                           <span>Male</span>
                         </button>
                       </div>
                     </div>

                     {/* Genre Selector */}
                     <SelectGenreGuide show={trainingMode && trainingStep === 7} />
                     <div className="p-4 bg-black/40 rounded-lg">
                       <label className="block text-xs font-bold text-gray-400 mb-3 uppercase">Song Genre</label>
                       <div className="grid grid-cols-3 gap-2">
                         {['Pop', 'Rock', 'R&B', 'Hip-Hop', 'Country', 'Ballad', 'Electronic', 'Soul', 'Jazz', 'Gospel', 'Christian Rock', 'Worship'].map((genre) => (
                           <button
                             key={genre}
                             onClick={() => { setSelectedGenre(genre); if (advanceStep && trainingStep === 7) advanceStep(8); }}
                             className={`py-2 px-3 rounded-lg text-sm transition ${
                               selectedGenre === genre
                                 ? 'bg-gradient-to-r from-neonPink to-neonBlue text-white font-bold'
                                 : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                             }`}
                           >
                             {genre}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Voice Clone Toggle */}
                     <CloneVoiceToggleGuide show={trainingMode && trainingStep === 8} />
                     <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                       <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${useVoiceClone ? 'bg-neonPink/20 text-neonPink' : 'bg-white/10 text-white'}`}>
                            {useVoiceClone ? '🎤' : '🎹'}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-white">
                              {useVoiceClone ? 'Voice Clone Mode' : 'Standard Production'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {useVoiceClone ? 'AI learns your voice' : 'AI vocalist sings for you'}
                            </p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useVoiceClone}
                            onChange={(e) => { setUseVoiceClone(e.target.checked); if (advanceStep && trainingStep === 8) advanceStep(9); }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonPink"></div>
                       </label>
                     </div>

                     {useVoiceClone && (
                       <div className="mt-4 border-t border-gray-700 pt-3 animate-fade-in">
                         <div className="mb-4">
                           <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Reference Voice</label>
                           <div className="flex gap-2 mb-2">
                              <button
                                onClick={() => setReferenceMethod('ORIGINAL')}
                                className={`flex-1 py-1.5 text-xs rounded border transition ${referenceMethod === 'ORIGINAL' ? 'bg-white/20 border-white text-white' : 'border-gray-700 text-gray-500 hover:bg-white/5'}`}
                              >
                                Use Input
                              </button>
                              <button
                                onClick={() => setReferenceMethod('UPLOAD')}
                                className={`flex-1 py-1.5 text-xs rounded border transition ${referenceMethod === 'UPLOAD' ? 'bg-white/20 border-white text-white' : 'border-gray-700 text-gray-500 hover:bg-white/5'}`}
                              >
                                Upload Sample
                              </button>
                           </div>
                           
                           {referenceMethod === 'UPLOAD' && (
                             <div className="space-y-2">
                                <label className="flex items-center justify-center w-full h-16 border border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition">
                                    <div className="text-center w-full px-2">
                                      {customReferenceFile ? (
                                          <div className="flex items-center justify-center gap-2 overflow-hidden">
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0 flex items-center justify-center">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <p className="text-xs text-green-400 font-bold truncate max-w-[150px]">
                                              {customReferenceFile.name}
                                            </p>
                                          </div>
                                      ) : (
                                          <p className="text-[10px] text-gray-400">Click to upload custom voice sample</p>
                                      )}
                                    </div>
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept=".mp3,.wav,.m4a,audio/*" 
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setCustomReferenceFile(e.target.files[0]);
                                        }
                                      }} 
                                    />
                                </label>
                             </div>
                           )}
                         </div>

                         <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Target Style</label>
                         <div className="relative">
                            <select
                              value={selectedVoiceModel}
                              onChange={(e) => setSelectedVoiceModel(e.target.value)}
                              className="w-full bg-black/40 border border-gray-600 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-neonPink appearance-none cursor-pointer"
                            >
                              {voiceModels.map((model) => (
                                <option key={model.id} value={model.id} className="bg-gray-900 text-white">
                                  {model.label}
                                </option>
                              ))}
                            </select>
                         </div>
                       </div>
                     )}

                     {audioError && (
                       <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                         <p className="text-red-400 text-xs">{audioError}</p>
                       </div>
                     )}

                     <GenerateGuide show={trainingMode && trainingStep === 9} onDismiss={onDismissTraining} />

                     <button 
                       onClick={() => { handleGenerateAudio(); if (onDismissTraining && trainingStep === 9) onDismissTraining(); }}
                       disabled={audioLoading}
                       className={`w-full py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2
                         ${audioLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-neonPink text-black hover:bg-pink-400'}
                       `}
                     >
                       {audioLoading ? (
                         <>
                           <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                           {useVoiceClone ? 'Cloning & Generating...' : 'Producing Track...'}
                         </>
                       ) : (
                         useVoiceClone ? '✨ Generate Cloned Track' : '🎹 Produce Standard Track'
                       )}
                     </button>

                     {/* Progress bar during generation */}
                     {audioLoading && (
                       <div className="mt-4 space-y-3">
                         {/* Progress bar */}
                         <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                           <div 
                             className="h-full rounded-full transition-all duration-700 ease-out"
                             style={{ 
                               width: `${audioProgressPercent}%`,
                               background: 'linear-gradient(90deg, #ec4899, #3b82f6, #ec4899)',
                               backgroundSize: '200% 100%',
                               animation: 'shimmer 2s linear infinite',
                             }}
                           ></div>
                         </div>
                         {/* Percentage + step text */}
                         <div className="flex justify-between items-center">
                           <p className="text-xs text-gray-300 truncate max-w-[75%]">
                             {audioProgressStep || (useVoiceClone ? 'Starting voice clone pipeline...' : 'Starting song generation...')}
                           </p>
                           <span className="text-xs font-bold text-neonPink">{audioProgressPercent}%</span>
                         </div>
                         <p className="text-[10px] text-gray-500 text-center">
                           {useVoiceClone ? 'Voice cloning takes 1-2 minutes' : 'Song generation takes ~45 seconds'}
                         </p>

                         {/* ═══ Scrolling Music Facts ═══ */}
                         <div className="mt-4 bg-black/60 rounded-xl border border-purple-500/30 overflow-hidden" style={{ maxHeight: '200px' }}>
                           <div className="px-4 py-2 bg-purple-900/40 border-b border-purple-500/20">
                             <p className="text-xs font-bold text-purple-300 uppercase tracking-wider text-center">🎵 Singer Music Facts 🎵</p>
                           </div>
                           <div className="relative overflow-hidden" style={{ height: '160px' }}>
                             <div className="animate-scroll-facts absolute w-full px-4">
                               {[...Array(2)].map((_, loopIdx) => 
                                 [
                                   { num: 1, text: "Queen's Bohemian Rhapsody is one of the most beloved songs in history. It first topped the British charts on November 8, 1974 for nine weeks. After Freddie Mercury's death, it was re-released on December 5, 1991 and stayed #1 for five more weeks." },
                                   { num: 2, text: "Before becoming famous: Elvis Presley was a truck driver, Sting an English teacher, Madonna a waitress at Dunkin' Donuts, and Johnny Cash deciphered encrypted codes in the military. Axl Rose received $8/hour to smoke cigarettes as part of a UCLA experiment." },
                                   { num: 3, text: "The reason Nirvana's Smells Like Teen Spirit video features a janitor with a mop (plus cheerleaders and basketball players) is that Kurt Cobain had to work as a janitor at his school — a period that shaped his rebellious personality." },
                                   { num: 4, text: "The first video ever aired on MTV was the Buggles' Video Killed the Radio Star. The first clip on MTV Europe was Dire Straits' Money For Nothing." },
                                   { num: 5, text: "New Order's Blue Monday is the best-selling 12-inch single in history. Unfortunately, for every copy sold the band lost money because the cost of producing its unique disc cover was higher than the sale price." },
                                   { num: 6, text: "When five musicians from Las Vegas were looking for a band name, they chose a fictional band from New Order's Crystal music video. That band name: The Killers." },
                                   { num: 7, text: "The only member of ZZ Top who doesn't have a beard? His name is Frank Beard." },
                                   { num: 8, text: "PETA asked the Pet Shop Boys to change their name to Rescue Shelter Boys. The duo refused with typical British politeness." },
                                   { num: 9, text: "Rick Allen, Def Leppard's drummer, has only one arm — and still drums like a legend." },
                                   { num: 10, text: "Victor Willis, lead singer and writer of most Village People hits, is straight. Bonus: his first wife was Phylicia Rashad, who played Claire Huxtable on The Cosby Show." },
                                   { num: 11, text: "Singers use vocal cords that work best when tight, and sound leaves their mouths at roughly 750 mph. Singing boosts happiness by releasing oxytocin, and it's physically easier to sing while standing. Less than 2% of the population is truly tone-deaf." },
                                   { num: 12, text: "In October 2016, a Mozart box set celebrating the 225th anniversary of his death outsold Beyoncé, Adele, and Drake — all Grammy winners that year. The catch? Each set contained 200 discs, and each disc counted as one sale. Still impressive for a three-century-old composer!" },
                                   { num: 13, text: "Eminem's Rap God holds the world record for most words in a single song: an astounding 1,560 words at 4.28 words per second. Compare that to Born to Run by Bruce Springsteen at 281 words, or The Beatles' Let It Be at just 139." },
                                   { num: 14, text: "Rod Stewart's 1993 New Year's Eve concert on Copacabana Beach in Rio de Janeiro holds the Guinness World Record for largest free concert ever — an estimated 4.2 million people attended. Jean-Michel Jarre's 1997 Moscow show drew 3.5 million." },
                                   { num: 15, text: "Prince's debut album For You came out when he was just 20 years old. On it, he played 27 different instruments including electric guitar, acoustic piano, mini-Moog, bongos, congas, finger cymbals, wind chimes, orchestral bells, and even finger snaps." },
                                   { num: 16, text: "Metallica is the only band to have played concerts on all 7 continents. In Antarctica, they performed for 120 scientists and competition winners inside a see-through dome at Carlini Station. They've played roughly 1,600 shows in their career." },
                                   { num: 17, text: "Nirvana's Smells Like Teen Spirit is actually about a deodorant for teenage girls. Bikini Kill's Katherine Hanna wrote 'Smells Like Teen Spirit' on Kurt Cobain's wall as a joke about his scent. Cobain thought it sounded rebellious and turned it into a song that helped Nevermind sell 30 million copies." },
                                   { num: 18, text: "Guns N' Roses wrote Sweet Child O' Mine in about five minutes. Slash was just playing around with a guitar pattern and never thought it would become a song. Axl Rose heard it from another room and finished the lyrics in minutes. It spent 24 weeks at #1." },
                                   { num: 19, text: "Michael Jackson's Scream has the most expensive music video ever produced — $10.7 million for an intricate spaceship set. It went on to win a Grammy for Best Short Form Music Video." },
                                   { num: 20, text: "On January 1, 1962, The Beatles auditioned for Decca Records, performing 15 songs in one hour. They were rejected because 'guitar groups are on the way out.' The Beatles went on to sell 600 million albums worldwide and score 21 #1 Billboard Hot 100 hits." },
                                   { num: 21, text: "Lady Gaga's NYU peers created a Facebook group to shame her called 'Stefani Germanotta, you will never be famous.' She dropped out, signed with Interscope Records, and became one of the biggest pop stars in history." },
                                   { num: 22, text: "My Chemical Romance's Gerard Way is actually cousins with Joe Rogan. Yes, that Joe Rogan." },
                                   { num: 23, text: "Rapper Nelly created an entire college scholarship called the P.I.M.P. Juice Scholarship. P.I.M.P. stands for 'Positive, Intellectual, Motivated Person.'" },
                                   { num: 24, text: "Research shows that syncing music with exercise helps you work out longer and more efficiently. In one study, cyclists who pedaled in time with music required 7% less oxygen than those cycling with background music." },
                                   { num: 25, text: "In 2014, a study called 'Hooked on Music' tested 12,000 people with 1,000 pop song clips going back to the 1940s. The Spice Girls' Wannabe was identified as the catchiest song ever — people recognized it in just 2.3 seconds, well below the 5-second average." },
                                   { num: 26, text: "Finland is the world capital of heavy metal, with 53.5 metal bands per 100,000 people. Sweden and Norway tie for second at 27.2, and Iceland takes third at 22.7. The US and UK, where metal originated, only have 5.5 and 5.2 respectively." },
                                   { num: 27, text: "In 2015, Canadian astronaut Chris Hadfield released an album entirely recorded in orbit at the International Space Station. He spent 144 days recording 11 original songs for Space Sessions: Songs for a Tin Can. His cover of David Bowie's Space Oddity went viral." },
                                   { num: 28, text: "The British Navy uses Britney Spears songs to scare off Somali pirates. Officers play Oops I Did It Again and Baby One More Time because the pirates reportedly have a strong dislike for Western pop music." },
                                 ].map((fact) => (
                                   <div key={`${loopIdx}-${fact.num}`} className="py-3 border-b border-purple-500/10">
                                     <p className="text-purple-400 font-bold text-xs mb-1">Fact #{fact.num}</p>
                                     <p className="text-gray-300 text-xs leading-relaxed">{fact.text}</p>
                                   </div>
                                 ))
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                ) : (
                  <div className="space-y-3 animate-fade-in relative z-10">
                    <p className="text-xs text-green-400 font-bold uppercase tracking-wide flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Track Ready
                      </span>
                      {useVoiceClone && <span className="text-neonPink">🎤 AI Voice Cloned</span>}
                    </p>
                    <audio 
                      ref={audioRef}
                      controls 
                      className="w-full h-12 rounded-lg" 
                      src={generatedAudioUrl}
                      preload="auto"
                      onError={(e) => {
                        console.error('Audio playback error:', e);
                        setAudioError('Failed to load audio. The URL may be invalid.');
                      }}
                      onLoadedData={() => {
                        console.log('Audio loaded successfully');
                        // Autoplay on load if enabled
                        if (autoPlay && audioRef.current) {
                          audioRef.current.play().catch(e => console.log('Autoplay blocked:', e.message));
                        }
                      }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    {/* Autoplay Toggle */}
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                        <span>Autoplay</span>
                        <div 
                          className={`relative w-10 h-5 rounded-full transition-colors ${autoPlay ? 'bg-neonCyan' : 'bg-gray-700'}`}
                          onClick={() => {
                            const newVal = !autoPlay;
                            setAutoPlay(newVal);
                            localStorage.setItem('starprep_autoplay', String(newVal));
                          }}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoPlay ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <span>{autoPlay ? 'On' : 'Off'}</span>
                      </label>
                    </div>
                    <button 
                       onClick={() => {
                         setGeneratedAudioUrl(null);
                         setAudioError(null);
                       }}
                       className="text-xs text-gray-500 hover:text-white underline w-full text-center transition"
                    >
                      🔄 Generate New Version
                    </button>
                  </div>
                )}
           </div>

           {/* Lyrics Column */}
           <div className="w-full flex flex-col items-center">
              <h3 className="text-xl font-bold text-gray-200 border-b border-gray-800 pb-2 mb-8 flex items-center justify-center gap-2 uppercase tracking-widest w-full max-w-xs">
                 <span>📝</span> Lyrics & Structure
              </h3>
              {renderStructuredLyrics(result.lyrics)}
           </div>
           
           {/* Footer Actions */}
           <div className="w-full max-w-lg space-y-4 mx-auto">
              <div className="bg-black/60 backdrop-blur-md p-6 rounded-xl border border-gray-800 text-center">
                <h3 className="text-lg font-bold text-gold mb-3">📋 Composition Notes</h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Structure</span>
                    <p className="text-sm text-gray-300">{result.structure}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Chords</span>
                    <p className="text-lg text-neonBlue font-mono">{result.chords}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                  <button 
                    onClick={saveSong}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    💾 Save Song File
                  </button>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setUploadedFile(null);
                      setAudioBlob(null);
                      setGeneratedAudioUrl(null);
                      setCustomReferenceFile(null);
                      setAudioError(null);
                      setError(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 transition text-white font-semibold"
                  >
                    🎵 New Song
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SongWriterMode;
