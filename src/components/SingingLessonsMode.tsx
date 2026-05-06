import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VocalExercise {
  name: string;
  instruction: string;
  duration: number;
  targetNote?: string;
  type: 'breathing' | 'warmup' | 'technique' | 'song';
}

interface SingingLesson {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  exercises: VocalExercise[];
  tips: string[];
  thumbnail: string;
  isPremium: boolean;
  instructorName: string;
  instructorAvatar: string;
}

const LESSON_CATEGORIES = [
  { id: 'breathing', name: 'Breathing', emoji: '🫁', color: 'from-cyan-500 to-blue-500' },
  { id: 'warmup', name: 'Warm-Ups', emoji: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 'technique', name: 'Technique', emoji: '🎯', color: 'from-purple-500 to-pink-500' },
  { id: 'range', name: 'Range', emoji: '📈', color: 'from-green-500 to-emerald-500' },
  { id: 'style', name: 'Style', emoji: '✨', color: 'from-yellow-500 to-orange-500' },
  { id: 'performance', name: 'Performance', emoji: '🎤', color: 'from-pink-500 to-rose-500' },
];

const SINGING_LESSONS: SingingLesson[] = [
  {
    id: '1',
    title: 'Diaphragm Breathing 101',
    category: 'breathing',
    difficulty: 'beginner',
    duration: '5 min',
    instructorName: 'Vocal Coach Sarah',
    instructorAvatar: '👩‍🏫',
    exercises: [
      { name: 'Belly Breath', instruction: 'Place hand on belly. Breathe in deeply - feel belly expand outward!', duration: 15, type: 'breathing' },
      { name: 'Slow Release', instruction: 'Now breathe out slowly with a "sssss" sound. Keep it steady!', duration: 15, type: 'breathing' },
      { name: 'Quick Breath', instruction: 'Take a quick breath in through your mouth, then slow release.', duration: 15, type: 'breathing' },
      { name: 'Breath Hold', instruction: 'Breathe in, hold for 5 seconds, then release slowly.', duration: 15, type: 'breathing' },
    ],
    tips: ['Shoulders stay DOWN', 'Belly moves, not chest', 'Relax your jaw'],
    thumbnail: '🫁',
    isPremium: false,
  },
  {
    id: '2',
    title: 'Basic Vocal Warm-Up',
    category: 'warmup',
    difficulty: 'beginner',
    duration: '7 min',
    instructorName: 'Coach Marcus',
    instructorAvatar: '🧔',
    exercises: [
      { name: 'Lip Trills', instruction: 'Make a "brrr" sound with your lips, slide up and down.', duration: 20, type: 'warmup', targetNote: 'slide' },
      { name: 'Humming', instruction: 'Hum "mmmmm" on a comfortable note. Feel the vibration!', duration: 20, type: 'warmup', targetNote: 'C4' },
      { name: 'Ma-May-Mi-Mo-Mu', instruction: 'Sing "Ma-May-Mi-Mo-Mu" on one note, then move up.', duration: 20, type: 'warmup', targetNote: 'scale' },
      { name: 'Gentle Sirens', instruction: 'Slide from your lowest to highest note smoothly like a siren.', duration: 20, type: 'warmup', targetNote: 'siren' },
    ],
    tips: ['Never strain!', 'Start soft', 'Drink water'],
    thumbnail: '🔥',
    isPremium: false,
  },
  {
    id: '3',
    title: 'Belt Voice Technique',
    category: 'technique',
    difficulty: 'intermediate',
    duration: '10 min',
    instructorName: 'Broadway Beth',
    instructorAvatar: '🎭',
    exercises: [
      { name: 'Chest Voice Find', instruction: 'Speak "Hey!" loudly like calling someone. Feel chest vibrate!', duration: 20, type: 'technique', targetNote: 'speech' },
      { name: 'Belt Prep', instruction: 'Sing a strong "AH" on G4, engage your core muscles!', duration: 25, type: 'technique', targetNote: 'G4' },
      { name: 'Power Note', instruction: 'Belt an "EH" on A4 - project forward, don\'t push from throat!', duration: 25, type: 'technique', targetNote: 'A4' },
      { name: 'Belt Phrase', instruction: 'Sing "I am a STAR!" - belt on STAR, open and powerful!', duration: 25, type: 'technique', targetNote: 'phrase' },
    ],
    tips: ['Support from core', 'Open throat', 'Rest if tired'],
    thumbnail: '📢',
    isPremium: true,
  },
  {
    id: '4',
    title: 'Runs & Riffs',
    category: 'style',
    difficulty: 'advanced',
    duration: '12 min',
    instructorName: 'R&B Ray',
    instructorAvatar: '🎤',
    exercises: [
      { name: '3-Note Run', instruction: 'Sing C-D-E quickly on "ah" - start slow, speed up!', duration: 25, type: 'technique', targetNote: 'C-D-E' },
      { name: '5-Note Run', instruction: 'Now C-D-E-F-G on "ee" - keep it smooth and connected!', duration: 25, type: 'technique', targetNote: 'C-D-E-F-G' },
      { name: 'Descending Riff', instruction: 'Come back down G-F-E-D-C with attitude!', duration: 25, type: 'technique', targetNote: 'G-F-E-D-C' },
      { name: 'Full Riff', instruction: 'Put it together: run up, add a flip at top, come back down!', duration: 30, type: 'technique', targetNote: 'full' },
    ],
    tips: ['Accuracy over speed', 'Practice with piano', 'Listen to R&B masters'],
    thumbnail: '🎵',
    isPremium: true,
  },
  {
    id: '5',
    title: 'Extend Your High Range',
    category: 'range',
    difficulty: 'intermediate',
    duration: '10 min',
    instructorName: 'High Note Hannah',
    instructorAvatar: '👱‍♀️',
    exercises: [
      { name: 'Find Your Top', instruction: 'Slide up to find your current highest comfortable note.', duration: 20, type: 'warmup', targetNote: 'find' },
      { name: 'Edge Work', instruction: 'Lip trill to ONE note above your comfortable range.', duration: 25, type: 'technique', targetNote: 'edge' },
      { name: 'Mix Voice', instruction: 'Sing "OOO" in your mix voice - lighter than belt, fuller than falsetto.', duration: 25, type: 'technique', targetNote: 'mix' },
      { name: 'High Phrase', instruction: 'Sing "I believe I can fly" - light and free on the high notes!', duration: 25, type: 'technique', targetNote: 'phrase' },
    ],
    tips: ['NEVER strain', 'Small steps daily', 'Patience is key'],
    thumbnail: '⬆️',
    isPremium: true,
  },
  {
    id: '6',
    title: 'Stage Performance',
    category: 'performance',
    difficulty: 'beginner',
    duration: '8 min',
    instructorName: 'Star Coach Kim',
    instructorAvatar: '⭐',
    exercises: [
      { name: 'Eye Contact', instruction: 'Pick 3 spots in the room. Connect with each as you sing "Hello!"', duration: 20, type: 'technique' },
      { name: 'Hand Gestures', instruction: 'Sing "I love you" with meaningful hand movements.', duration: 20, type: 'technique' },
      { name: 'Move & Sing', instruction: 'Walk while singing - keep your breath steady!', duration: 20, type: 'technique' },
      { name: 'Full Performance', instruction: 'Put it together: eye contact, gestures, movement. Own that stage!', duration: 25, type: 'technique' },
    ],
    tips: ['Be authentic', 'Connect emotionally', 'Practice in mirror'],
    thumbnail: '🌟',
    isPremium: false,
  },
];

interface SingingLessonsModeProps {
  userTier?: 'FREE' | 'PRO' | 'SUPERSTAR' | 'DIAMOND';
}

const SingingLessonsMode: React.FC<SingingLessonsModeProps> = ({ userTier = 'FREE' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<SingingLesson | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [pitchIndicator, setPitchIndicator] = useState<'low' | 'good' | 'high' | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isDiamond = userTier === 'DIAMOND';
  const canAccessPremium = userTier === 'SUPERSTAR' || userTier === 'DIAMOND';

  const filteredLessons = selectedCategory 
    ? SINGING_LESSONS.filter(l => l.category === selectedCategory)
    : SINGING_LESSONS;

  // Audio analysis
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average);
    
    // Find dominant frequency for pitch detection (simplified)
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    // Simple pitch indicator (very basic)
    if (average > 30) {
      if (maxIndex < 50) {
        setPitchIndicator('low');
        setCurrentFeedback('Try going a bit higher! ⬆️');
      } else if (maxIndex > 150) {
        setPitchIndicator('high');
        setCurrentFeedback('Ease down slightly! ⬇️');
      } else {
        setPitchIndicator('good');
        setCurrentFeedback('Great pitch! Keep it up! 🎯');
      }
    } else {
      setPitchIndicator(null);
      setCurrentFeedback('Sing louder! Let me hear you! 🎤');
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isPlaying]);

  const enableMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setMicEnabled(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const disableMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setMicEnabled(false);
    setAudioLevel(0);
  };

  const startLesson = (lesson: SingingLesson) => {
    if (lesson.isPremium && !canAccessPremium) {
      setShowUpgrade(true);
      return;
    }
    setSelectedLesson(lesson);
    setCurrentExerciseIndex(0);
    setIsPlaying(false);
    setScores([]);
    setOverallScore(null);
    setExerciseTimer(0);
  };

  const startPlaying = async () => {
    if (!micEnabled) {
      await enableMic();
    }
    
    // 3-2-1 countdown
    setCountdown(3);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => {
      setCountdown(null);
      setIsPlaying(true);
      setCurrentExerciseIndex(0);
      setExerciseTimer(selectedLesson?.exercises[0]?.duration || 15);
      animationRef.current = requestAnimationFrame(analyzeAudio);
    }, 3000);
  };

  // Timer for each exercise
  useEffect(() => {
    if (isPlaying && selectedLesson && exerciseTimer > 0) {
      timerRef.current = setTimeout(() => {
        setExerciseTimer(prev => prev - 1);
      }, 1000);
    } else if (isPlaying && selectedLesson && exerciseTimer === 0) {
      // Exercise complete - record score based on audio level
      const exerciseScore = Math.min(100, 60 + Math.floor(audioLevel * 1.5));
      setScores(prev => [...prev, exerciseScore]);
      
      // Next exercise or finish
      if (currentExerciseIndex < selectedLesson.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setExerciseTimer(selectedLesson.exercises[currentExerciseIndex + 1].duration);
      } else {
        // Lesson complete!
        setIsPlaying(false);
        const allScores = [...scores, exerciseScore];
        const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        setOverallScore(avg);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, exerciseTimer, selectedLesson, currentExerciseIndex, scores, audioLevel, analyzeAudio]);

  const closeLesson = () => {
    setSelectedLesson(null);
    setIsPlaying(false);
    setCurrentExerciseIndex(0);
    setScores([]);
    setOverallScore(null);
    disableMic();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    return () => {
      disableMic();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentExercise = selectedLesson?.exercises[currentExerciseIndex];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          🎤 AI Singing Lessons 🎵
        </h1>
        <p className="text-gray-300">
          Train your voice with AI-powered feedback!
        </p>
        {isDiamond && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full px-4 py-2">
            <span className="text-purple-400">💎</span>
            <span className="text-purple-200 text-sm">Diamond - Real-Time Pitch Analysis Active!</span>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md border border-yellow-500/50">
            <div className="text-center">
              <div className="text-6xl mb-4">🎤</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Premium Lesson</h2>
              <p className="text-gray-300 mb-6">
                Unlock advanced vocal techniques and AI pitch analysis!
              </p>
              <div className="space-y-3">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
                  ⭐ Upgrade to Superstar - $19.99/mo
                </button>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                  💎 Upgrade to Diamond - $49.99/mo
                </button>
                <button onClick={() => setShowUpgrade(false)} className="w-full py-3 rounded-xl bg-gray-700 text-gray-300">
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson View */}
      {selectedLesson ? (
        <div className="space-y-6">
          <button onClick={closeLesson} className="text-gray-400 hover:text-white flex items-center gap-2">
            ← Back to lessons
          </button>

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-9xl font-bold text-yellow-400 animate-pulse">{countdown}</div>
                <p className="text-2xl text-white mt-4">Take a breath...</p>
              </div>
            </div>
          )}

          {/* Overall Score Screen */}
          {overallScore !== null && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center bg-gray-900 p-10 rounded-3xl border border-yellow-500">
                <div className="text-6xl mb-4">
                  {overallScore >= 90 ? '🌟' : overallScore >= 80 ? '⭐' : overallScore >= 70 ? '👏' : '💪'}
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">Lesson Complete!</h2>
                <p className="text-6xl font-bold text-yellow-400 mb-4">{overallScore}%</p>
                <p className="text-xl text-gray-300 mb-6">
                  {overallScore >= 90 ? 'AMAZING vocals!' : 
                   overallScore >= 80 ? 'Great singing!' : 
                   overallScore >= 70 ? 'Good progress!' : 'Keep practicing!'}
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => { setOverallScore(null); startPlaying(); }} className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
                    🔄 Try Again
                  </button>
                  <button onClick={closeLesson} className="px-8 py-3 rounded-xl bg-gray-700 text-white font-bold">
                    ✓ Done
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Instructor Panel */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{selectedLesson.instructorAvatar}</div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
                  <p className="text-yellow-400">{selectedLesson.instructorName}</p>
                </div>
              </div>

              {/* Instruction Display */}
              <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 mb-4 min-h-[200px] flex flex-col justify-center">
                {isPlaying && currentExercise ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-yellow-300 text-sm">Exercise {currentExerciseIndex + 1} of {selectedLesson.exercises.length}</span>
                      <span className="text-2xl font-bold text-yellow-400">{exerciseTimer}s</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{currentExercise.name}</h3>
                    <p className="text-lg text-gray-200">{currentExercise.instruction}</p>
                    {currentExercise.targetNote && (
                      <p className="text-yellow-400 mt-2">🎵 Target: {currentExercise.targetNote}</p>
                    )}
                    
                    {/* Progress bar */}
                    <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000"
                        style={{ width: `${(exerciseTimer / currentExercise.duration) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">{selectedLesson.instructorAvatar}</div>
                    <p className="text-gray-300">Press START when you're ready!</p>
                    <p className="text-sm text-gray-500 mt-2">{selectedLesson.exercises.length} exercises • {selectedLesson.duration}</p>
                  </div>
                )}
              </div>

              {/* Exercise List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedLesson.exercises.map((exercise, idx) => (
                  <div key={idx} className={`p-3 rounded-lg flex items-center gap-3 ${
                    idx === currentExerciseIndex && isPlaying ? 'bg-yellow-500/30 border border-yellow-500' :
                    idx < currentExerciseIndex ? 'bg-green-500/20 border border-green-500/50' :
                    'bg-gray-800/50 border border-gray-700'
                  }`}>
                    <span className="text-lg">
                      {idx < currentExerciseIndex ? '✅' : idx === currentExerciseIndex && isPlaying ? '🎵' : `${idx + 1}`}
                    </span>
                    <span className="text-gray-300">{exercise.name}</span>
                    {scores[idx] && <span className="ml-auto text-yellow-400 font-bold">{scores[idx]}%</span>}
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <h3 className="font-bold text-gray-300 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  {selectedLesson.tips.map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Audio Visualization & Controls */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-green-500/30">
              <h2 className="text-xl font-bold text-green-400 mb-4">🎙️ Your Voice</h2>
              
              {/* Audio Visualization */}
              <div className="bg-gray-900 rounded-xl p-6 mb-4 min-h-[200px] flex flex-col items-center justify-center">
                {micEnabled ? (
                  <>
                    {/* Audio Level Bars */}
                    <div className="flex items-end justify-center gap-1 h-24 mb-4">
                      {[...Array(15)].map((_, i) => (
                        <div 
                          key={i}
                          className={`w-4 rounded-t transition-all duration-100 ${
                            audioLevel > (i * 10) ? 'bg-gradient-to-t from-green-500 to-yellow-400' : 'bg-gray-700'
                          }`}
                          style={{ 
                            height: `${Math.max(10, Math.min(100, audioLevel + Math.random() * 20))}%`,
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Pitch Indicator */}
                    <div className="flex items-center gap-4 mb-2">
                      <span className={`text-2xl ${pitchIndicator === 'low' ? 'opacity-100' : 'opacity-30'}`}>⬇️</span>
                      <span className={`text-4xl ${pitchIndicator === 'good' ? 'text-green-400 animate-pulse' : 'opacity-30'}`}>🎯</span>
                      <span className={`text-2xl ${pitchIndicator === 'high' ? 'opacity-100' : 'opacity-30'}`}>⬆️</span>
                    </div>
                    
                    <p className="text-lg text-white">{currentFeedback}</p>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">🎙️</div>
                    <p className="text-gray-400">Microphone will activate when you start</p>
                  </div>
                )}
              </div>

              {/* Start/Stop Button */}
              {!isPlaying ? (
                <button
                  onClick={startPlaying}
                  disabled={countdown !== null}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl hover:scale-105 transition transform"
                >
                  ▶️ START LESSON
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xl"
                >
                  ⏹️ STOP
                </button>
              )}

              {/* AI Analysis Panel */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🤖</span>
                  <span className="font-bold text-purple-400">AI Vocal Analysis</span>
                </div>
                {isDiamond ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Volume</span>
                      <span className={audioLevel > 50 ? 'text-green-400' : 'text-yellow-400'}>
                        {audioLevel > 50 ? 'Strong' : audioLevel > 20 ? 'Medium' : 'Soft'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pitch</span>
                      <span className={pitchIndicator === 'good' ? 'text-green-400' : 'text-yellow-400'}>
                        {pitchIndicator === 'good' ? 'On Target' : pitchIndicator === 'high' ? 'High' : pitchIndicator === 'low' ? 'Low' : 'Listening...'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Breath Support</span>
                      <span className="text-blue-400">{isPlaying ? 'Analyzing...' : 'Standby'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Upgrade to Diamond for detailed pitch and tone analysis!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Category Filter */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-300 mb-4">Choose a Category</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full transition ${!selectedCategory ? 'bg-white text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                All Lessons
              </button>
              {LESSON_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full transition flex items-center gap-2 ${
                    selectedCategory === cat.id ? `bg-gradient-to-r ${cat.color} text-white font-bold` : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => {
              const category = LESSON_CATEGORIES.find(c => c.id === lesson.category);
              const isLocked = lesson.isPremium && !canAccessPremium;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => startLesson(lesson)}
                  className={`relative group bg-black/40 backdrop-blur-md rounded-2xl p-6 border transition-all hover:scale-[1.02] text-left ${
                    isLocked ? 'border-gray-700 opacity-80' : 'border-yellow-500/30 hover:border-yellow-500/60'
                  }`}
                >
                  {lesson.isPremium && (
                    <div className="absolute top-4 right-4">
                      {isLocked ? <span className="text-2xl">🔒</span> : 
                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">PREMIUM</span>
                      }
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category?.color || 'from-gray-600 to-gray-700'} flex items-center justify-center`}>
                      <span className="text-2xl">{lesson.thumbnail}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{lesson.title}</h3>
                      <p className="text-sm text-gray-400">{lesson.instructorAvatar} {lesson.instructorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {lesson.difficulty}
                    </span>
                    <span>⏱️ {lesson.duration}</span>
                    <span>📚 {lesson.exercises.length} exercises</span>
                  </div>

                  <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <span>🤖</span>
                    <span>AI Voice Analysis</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div className="mt-12 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-2xl p-8 border border-yellow-500/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl">🤖</div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  Coming Soon: AI Video Vocal Coaches
                </h2>
                <p className="text-gray-300 mb-4">
                  Real AI-generated video instructors demonstrating vocal techniques!
                </p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>🎥 AI avatars showing mouth positioning</li>
                  <li>🎵 Real-time pitch detection & visualization</li>
                  <li>✨ Personalized vocal improvement tips</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SingingLessonsMode;
