import React, { useState, useRef } from 'react';

interface JudgeScore {
  pitch: number;
  timing: number;
  emotion: number;
  overall: number;
  feedback: string;
  goldenTicket: boolean;
}

/**
 * Enhanced JudgeMode Component
 * 
 * This component judges singers and awards Golden Tickets at 95%+ scores
 * 
 * CURRENT STATUS: Uses simulated scoring for demo purposes
 * 
 * FOR PRODUCTION: Replace analyzePerformance() with real audio analysis:
 * 
 * Option 1 - Web Audio API (Built-in, Free):
 *   - Use AudioContext and AnalyserNode for pitch detection
 *   - Extract frequency data with FFT
 *   - Compare against reference track
 * 
 * Option 2 - Essentia.js (Advanced, Free):
 *   npm install essentia.js
 *   - Professional audio analysis library
 *   - Pitch detection, onset detection, beat tracking
 *   - Used in music production software
 * 
 * Option 3 - Tone.js (Music-focused, Free):
 *   npm install tone
 *   - Music theory aware
 *   - Note detection, rhythm analysis
 *   - Great for musical applications
 * 
 * Option 4 - External API (Requires API Key):
 *   - Dolby.io API - Professional audio analysis
 *   - Google Cloud Speech-to-Text - Pitch analysis
 *   - AWS Transcribe - Audio analysis
 * 
 * RECOMMENDED APPROACH FOR PRODUCTION:
 * Use Essentia.js or Web Audio API for pitch detection,
 * then compare user recording vs reference AI track using:
 * - Dynamic Time Warping (DTW) for alignment
 * - Cross-correlation for similarity
 * - Pitch contour matching
 */

const JudgeMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<JudgeScore | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [referenceTrack, setReferenceTrack] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setScore(null);
      setRecordingTime(0);

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
    }
  };

  /**
   * TODO: Replace this with REAL audio analysis
   * 
   * For production implementation:
   * 
   * 1. Extract audio features from user recording:
   *    - Pitch contour (fundamental frequency over time)
   *    - Timing/rhythm (onset detection, tempo)
   *    - Energy/dynamics (loudness contour)
   * 
   * 2. Compare with reference track (AI-generated song):
   *    - Load reference track from localStorage or state
   *    - Align using Dynamic Time Warping (DTW)
   *    - Calculate similarity scores
   * 
   * 3. Calculate component scores:
   *    - Pitch: % of notes within acceptable cent range
   *    - Timing: Onset alignment accuracy
   *    - Emotion: Dynamic range and expression matching
   * 
   * 4. Award Golden Ticket if overall >= 95%
   */
  const analyzePerformance = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    
    // ============================================
    // SIMULATED ANALYSIS (FOR DEMO)
    // Replace this entire section with real analysis
    // ============================================
    
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate realistic scores based on recording length
    const baseScore = Math.min(recordingTime * 2, 60) + 30;
    const variance = () => Math.floor(Math.random() * 15) - 7;
    
    const pitch = Math.min(100, Math.max(50, baseScore + variance()));
    const timing = Math.min(100, Math.max(50, baseScore + variance()));
    const emotion = Math.min(100, Math.max(50, baseScore + variance()));
    const overall = Math.round((pitch + timing + emotion) / 3);
    
    // ============================================
    // FOR PRODUCTION: Use real audio analysis here
    // Example pseudocode:
    // 
    // const audioContext = new AudioContext();
    // const arrayBuffer = await audioBlob.arrayBuffer();
    // const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    // 
    // // Extract pitch using autocorrelation or YIN algorithm
    // const pitchContour = extractPitchContour(audioBuffer);
    // 
    // // Load reference track
    // const referenceBuffer = await loadReferenceTrack();
    // const referencePitchContour = extractPitchContour(referenceBuffer);
    // 
    // // Compare and calculate score
    // const pitchScore = comparePitchContours(pitchContour, referencePitchContour);
    // const timingScore = compareOnsets(audioBuffer, referenceBuffer);
    // const emotionScore = compareDynamics(audioBuffer, referenceBuffer);
    // 
    // const overall = (pitchScore + timingScore + emotionScore) / 3;
    // ============================================
    
    const goldenTicket = overall >= 95;
    
    const feedbackOptions = {
      low: [
        "Keep practicing! Your voice has potential, but needs more control.",
        "I hear something there, but you need to work on your breath support.",
        "Not quite ready for the big stage yet, but don't give up!",
        "You've got heart, but the technique needs work. Keep training!",
      ],
      medium: [
        "Good performance! You've got talent, keep developing it.",
        "I can see you've been working hard. You're getting closer!",
        "Nice job! A few more weeks of practice and you'll be ready.",
        "You're on the right track! Keep refining your skills.",
      ],
      high: [
        "Wow! That was incredible! You've got star quality!",
        "I'm blown away! You're ready for the spotlight!",
        "Golden Ticket worthy! You're going to Hollywood!",
        "You just earned your spot on the big stage! Phenomenal!",
        "This is what we've been waiting for! Pack your bags!",
      ],
    };
    
    let feedbackArray;
    if (overall < 70) feedbackArray = feedbackOptions.low;
    else if (overall < 95) feedbackArray = feedbackOptions.medium;
    else feedbackArray = feedbackOptions.high;
    
    const feedback = feedbackArray[Math.floor(Math.random() * feedbackArray.length)];
    
    setScore({ pitch, timing, emotion, overall, feedback, goldenTicket });
    setIsAnalyzing(false);
  };

  const resetJudge = () => {
    setAudioBlob(null);
    setScore(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  /**
   * TODO: Add reference track selection
   * Users should be able to:
   * 1. Upload their own reference track
   * 2. Use a previously generated AI song
   * 3. Select from preset songs
   */
  const loadReferenceTrack = (url: string) => {
    setReferenceTrack(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          ⚖️ The Judge
        </h1>
        <p className="text-gray-300">
          Perform your best and get scored like you're on America's Got Talent!
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Score 95%+ to earn your Golden Ticket! 🎫
        </p>
      </div>

      {/* Recording Section */}
      {!score && (
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-yellow-500/30 mb-8">
          <div className="text-center">
            {!audioBlob ? (
              <>
                <p className="text-gray-400 mb-6">
                  {isRecording ? 'Sing your heart out!' : 'Press the button and perform your best!'}
                </p>
                
                {/* Record Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full transition-all transform ${
                    isRecording
                      ? 'bg-red-500 scale-110 animate-pulse'
                      : 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105'
                  } shadow-lg`}
                >
                  <span className="text-4xl">{isRecording ? '⏹️' : '🎤'}</span>
                </button>
                
                {isRecording && (
                  <div className="mt-4">
                    <p className="text-3xl font-mono text-yellow-400">{formatTime(recordingTime)}</p>
                    <p className="text-sm text-gray-400 animate-pulse">Recording...</p>
                  </div>
                )}
                
                {!isRecording && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Sing for at least 15 seconds for best results
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Tip: Sing along with a song you know well
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-green-400 mb-4">✅ Recording captured! ({formatTime(recordingTime)})</p>
                
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full max-w-md mx-auto mb-6"
                />
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={resetJudge}
                    className="px-6 py-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={analyzePerformance}
                    disabled={isAnalyzing}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:scale-105 transition transform disabled:opacity-50"
                  >
                    {isAnalyzing ? '🎯 Judging...' : '⚖️ Get Judged!'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Analyzing Animation */}
      {isAnalyzing && (
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-yellow-500/30 text-center">
          <div className="text-6xl animate-bounce mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">The Judges are deliberating...</h2>
          <p className="text-gray-400">Analyzing your pitch, timing, and emotion</p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="text-3xl animate-pulse">⭐</span>
            <span className="text-3xl animate-pulse">⭐</span>
            <span className="text-3xl animate-pulse">⭐</span>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {/* TODO: Replace with real progress from actual audio analysis */}
            Using AI to evaluate your performance...
          </p>
        </div>
      )}

      {/* Score Results */}
      {score && !isAnalyzing && (
        <div className="space-y-6">
          {/* Golden Ticket Banner */}
          {score.goldenTicket && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-center animate-pulse">
              <div className="text-6xl mb-2">🎫</div>
              <h2 className="text-3xl font-bold text-black">GOLDEN TICKET!</h2>
              <p className="text-black/80 text-lg mb-2">You're going to Hollywood!</p>
              <p className="text-sm text-black/70">
                Congratulations! You've earned an instant audition opportunity!
              </p>
              {/* TODO: Generate actual ticket - PDF or digital pass */}
              <button className="mt-4 px-6 py-3 bg-black text-yellow-400 rounded-xl font-bold hover:scale-105 transition">
                📄 Download Your Golden Ticket
              </button>
            </div>
          )}

          {/* Score Card */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-yellow-500/30">
            <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">Your Scores</h2>
            
            <ScoreBar label="🎵 Pitch Accuracy" value={score.pitch} color="bg-blue-500" />
            <ScoreBar label="⏱️ Timing & Rhythm" value={score.timing} color="bg-green-500" />
            <ScoreBar label="💖 Emotion & Expression" value={score.emotion} color="bg-pink-500" />
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-xl text-gray-300">Overall Score</span>
                <span className={`text-4xl font-bold ${
                  score.overall >= 95 ? 'text-yellow-400' : 
                  score.overall >= 70 ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {score.overall}%
                </span>
              </div>
              {score.overall >= 95 && (
                <p className="text-center text-yellow-400 mt-2 text-sm">
                  ⭐ GOLDEN TICKET ACHIEVED! ⭐
                </p>
              )}
              {score.overall >= 90 && score.overall < 95 && (
                <p className="text-center text-orange-400 mt-2 text-sm">
                  So close! Just {95 - score.overall}% away from a Golden Ticket!
                </p>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-yellow-500/30">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">🎤 Judge's Feedback</h3>
            <p className="text-xl text-gray-200 italic">"{score.feedback}"</p>
            
            {/* Detailed feedback based on component scores */}
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              {score.pitch < 70 && (
                <p>• Work on hitting the right notes - practice with a piano or tuner</p>
              )}
              {score.timing < 70 && (
                <p>• Focus on staying in rhythm - try using a metronome</p>
              )}
              {score.emotion < 70 && (
                <p>• Add more feeling and dynamics to your performance</p>
              )}
              {score.overall >= 90 && (
                <p>• You're performing at a professional level - keep it up!</p>
              )}
            </div>
          </div>

          {/* Try Again */}
          <div className="text-center">
            <button
              onClick={resetJudge}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xl hover:scale-105 transition transform"
            >
              🎤 Perform Again
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {!isRecording && !audioBlob && !score && (
        <div className="bg-black/20 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">💡 Performance Tips</h3>
          <ul className="space-y-2 text-gray-400">
            <li>🎵 Sing in a quiet environment for best results</li>
            <li>⏱️ Perform for at least 15-30 seconds</li>
            <li>💖 Put emotion into your performance</li>
            <li>🎤 Hold your device close like a microphone</li>
            <li>⭐ Aim for 95%+ to earn your Golden Ticket!</li>
            <li>🎧 Optional: Sing along with an AI-generated track</li>
          </ul>
          
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
            <p className="text-yellow-400 font-bold mb-2">🏆 Golden Ticket Requirements:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Overall score of 95% or higher</li>
              <li>• Grants instant audition opportunity</li>
              <li>• Valid for AGT, The Voice, and partner shows</li>
              <li>• Download and bring to your audition</li>
            </ul>
          </div>
        </div>
      )}

      {/* Developer Note */}
      <div className="mt-8 p-4 bg-purple-900/20 rounded-xl border border-purple-500/30 text-xs text-gray-500">
        <p className="font-bold text-purple-400 mb-2">🔧 Developer Note:</p>
        <p>
          This component currently uses simulated scoring for demonstration.
          For production, replace the analyzePerformance() function with real audio analysis
          using Web Audio API, Essentia.js, or Tone.js. See code comments for implementation guidance.
        </p>
      </div>
    </div>
  );
};

export default JudgeMode;
