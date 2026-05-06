import React, { useState, useRef, useEffect, useCallback } from 'react';

// MediaPipe types
interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseResults {
  poseLandmarks?: PoseLandmark[];
}

// Landmark indices for MediaPipe Pose
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// Skeleton connections for drawing
const POSE_CONNECTIONS = [
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

interface DanceLesson {
  id: string;
  title: string;
  style: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  moves: DanceMove[];
  thumbnail: string;
  isPremium: boolean;
  instructorName: string;
  instructorAvatar: string;
}

interface DanceMove {
  name: string;
  instruction: string;
  duration: number;
  targetPose: TargetPose;
}

// Target pose definitions for scoring
interface TargetPose {
  name: string;
  checkpoints: PoseCheckpoint[];
}

interface PoseCheckpoint {
  description: string;
  check: (landmarks: PoseLandmark[]) => boolean;
  weight: number;
}

// Helper functions for pose analysis
const getAngle = (a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

const getDistance = (a: PoseLandmark, b: PoseLandmark): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

// Define target poses with checkpoints
const TARGET_POSES: Record<string, TargetPose> = {
  power_stance: {
    name: 'Power Stance',
    checkpoints: [
      {
        description: 'Feet shoulder-width apart',
        check: (lm) => {
          const hipWidth = getDistance(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.RIGHT_HIP]);
          const ankleWidth = getDistance(lm[POSE_LANDMARKS.LEFT_ANKLE], lm[POSE_LANDMARKS.RIGHT_ANKLE]);
          return ankleWidth >= hipWidth * 0.8 && ankleWidth <= hipWidth * 1.5;
        },
        weight: 0.3,
      },
      {
        description: 'Arms at sides or on hips',
        check: (lm) => {
          const leftWristBelowShoulder = lm[POSE_LANDMARKS.LEFT_WRIST].y > lm[POSE_LANDMARKS.LEFT_SHOULDER].y;
          const rightWristBelowShoulder = lm[POSE_LANDMARKS.RIGHT_WRIST].y > lm[POSE_LANDMARKS.RIGHT_SHOULDER].y;
          return leftWristBelowShoulder && rightWristBelowShoulder;
        },
        weight: 0.3,
      },
      {
        description: 'Standing upright',
        check: (lm) => {
          const shoulderMidY = (lm[POSE_LANDMARKS.LEFT_SHOULDER].y + lm[POSE_LANDMARKS.RIGHT_SHOULDER].y) / 2;
          const hipMidY = (lm[POSE_LANDMARKS.LEFT_HIP].y + lm[POSE_LANDMARKS.RIGHT_HIP].y) / 2;
          return hipMidY > shoulderMidY; // Hips below shoulders
        },
        weight: 0.4,
      },
    ],
  },
  arms_extended: {
    name: 'Arms Extended',
    checkpoints: [
      {
        description: 'Left arm extended',
        check: (lm) => {
          const angle = getAngle(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
          return angle > 150; // Nearly straight arm
        },
        weight: 0.35,
      },
      {
        description: 'Right arm extended',
        check: (lm) => {
          const angle = getAngle(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
          return angle > 150;
        },
        weight: 0.35,
      },
      {
        description: 'Arms at shoulder height',
        check: (lm) => {
          const leftDiff = Math.abs(lm[POSE_LANDMARKS.LEFT_WRIST].y - lm[POSE_LANDMARKS.LEFT_SHOULDER].y);
          const rightDiff = Math.abs(lm[POSE_LANDMARKS.RIGHT_WRIST].y - lm[POSE_LANDMARKS.RIGHT_SHOULDER].y);
          return leftDiff < 0.15 && rightDiff < 0.15;
        },
        weight: 0.3,
      },
    ],
  },
  arms_up: {
    name: 'Arms Up',
    checkpoints: [
      {
        description: 'Arms raised above head',
        check: (lm) => {
          return lm[POSE_LANDMARKS.LEFT_WRIST].y < lm[POSE_LANDMARKS.LEFT_SHOULDER].y &&
                 lm[POSE_LANDMARKS.RIGHT_WRIST].y < lm[POSE_LANDMARKS.RIGHT_SHOULDER].y;
        },
        weight: 0.5,
      },
      {
        description: 'Arms straight',
        check: (lm) => {
          const leftAngle = getAngle(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
          const rightAngle = getAngle(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
          return leftAngle > 140 && rightAngle > 140;
        },
        weight: 0.5,
      },
    ],
  },
  squat: {
    name: 'Squat Position',
    checkpoints: [
      {
        description: 'Knees bent',
        check: (lm) => {
          const leftKneeAngle = getAngle(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]);
          const rightKneeAngle = getAngle(lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE], lm[POSE_LANDMARKS.RIGHT_ANKLE]);
          return leftKneeAngle < 150 && rightKneeAngle < 150;
        },
        weight: 0.6,
      },
      {
        description: 'Back relatively straight',
        check: (lm) => {
          const shoulderMidX = (lm[POSE_LANDMARKS.LEFT_SHOULDER].x + lm[POSE_LANDMARKS.RIGHT_SHOULDER].x) / 2;
          const hipMidX = (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2;
          return Math.abs(shoulderMidX - hipMidX) < 0.1;
        },
        weight: 0.4,
      },
    ],
  },
  t_pose: {
    name: 'T-Pose',
    checkpoints: [
      {
        description: 'Arms horizontal',
        check: (lm) => {
          const leftDiff = Math.abs(lm[POSE_LANDMARKS.LEFT_WRIST].y - lm[POSE_LANDMARKS.LEFT_SHOULDER].y);
          const rightDiff = Math.abs(lm[POSE_LANDMARKS.RIGHT_WRIST].y - lm[POSE_LANDMARKS.RIGHT_SHOULDER].y);
          return leftDiff < 0.12 && rightDiff < 0.12;
        },
        weight: 0.4,
      },
      {
        description: 'Arms extended outward',
        check: (lm) => {
          const shoulderWidth = getDistance(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_SHOULDER]);
          const armSpan = getDistance(lm[POSE_LANDMARKS.LEFT_WRIST], lm[POSE_LANDMARKS.RIGHT_WRIST]);
          return armSpan > shoulderWidth * 2.5;
        },
        weight: 0.4,
      },
      {
        description: 'Standing straight',
        check: (lm) => {
          const leftKneeAngle = getAngle(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]);
          return leftKneeAngle > 160;
        },
        weight: 0.2,
      },
    ],
  },
};

const DANCE_STYLES = [
  { id: 'pop', name: 'Pop', emoji: '🎤', color: 'from-pink-500 to-purple-500' },
  { id: 'hiphop', name: 'Hip-Hop', emoji: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 'contemporary', name: 'Contemporary', emoji: '🩰', color: 'from-blue-500 to-cyan-500' },
  { id: 'jazz', name: 'Jazz', emoji: '✨', color: 'from-yellow-500 to-orange-500' },
  { id: 'latin', name: 'Latin', emoji: '💃', color: 'from-red-500 to-pink-500' },
  { id: 'kpop', name: 'K-Pop', emoji: '🇰🇷', color: 'from-purple-500 to-blue-500' },
  { id: 'country', name: 'Country', emoji: '🤠', color: 'from-amber-600 to-yellow-500' },
];

const SAMPLE_LESSONS: DanceLesson[] = [
  {
    id: '1',
    title: 'Stage Presence Basics',
    style: 'pop',
    difficulty: 'beginner',
    duration: '5 min',
    instructorName: 'Maya',
    instructorAvatar: '👩‍🎤',
    moves: [
      { name: 'Power Stance', instruction: 'Stand with feet shoulder-width apart, hands on hips, chin up!', duration: 8, targetPose: TARGET_POSES.power_stance },
      { name: 'T-Pose', instruction: 'Extend both arms out to the sides at shoulder height', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'Arms Up Victory', instruction: 'Raise both arms straight up above your head!', duration: 8, targetPose: TARGET_POSES.arms_up },
      { name: 'Arms Extended', instruction: 'Extend arms out to sides, palms down', duration: 8, targetPose: TARGET_POSES.arms_extended },
    ],
    thumbnail: '🎤',
    isPremium: false,
  },
  {
    id: '2',
    title: 'Pop Star Choreography',
    style: 'pop',
    difficulty: 'intermediate',
    duration: '10 min',
    instructorName: 'Carlos',
    instructorAvatar: '🕺',
    moves: [
      { name: 'Power Pose', instruction: 'Start in power stance - own the stage!', duration: 6, targetPose: TARGET_POSES.power_stance },
      { name: 'T-Pose Hold', instruction: 'Arms out like a T - feel the energy!', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'Victory Arms', instruction: 'Arms up high - celebrate!', duration: 6, targetPose: TARGET_POSES.arms_up },
      { name: 'Drop & Pose', instruction: 'Squat down with attitude!', duration: 8, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '⭐',
    isPremium: true,
  },
  {
    id: '3',
    title: 'Hip-Hop Foundations',
    style: 'hiphop',
    difficulty: 'beginner',
    duration: '8 min',
    instructorName: 'Jaylen',
    instructorAvatar: '🧢',
    moves: [
      { name: 'Bounce Ready', instruction: 'Power stance - get ready to bounce!', duration: 8, targetPose: TARGET_POSES.power_stance },
      { name: 'Wide Arms', instruction: 'Spread those arms wide!', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'Low Squat', instruction: 'Drop it low with bent knees!', duration: 10, targetPose: TARGET_POSES.squat },
      { name: 'Victory Pose', instruction: 'Arms up - you made it!', duration: 8, targetPose: TARGET_POSES.arms_up },
    ],
    thumbnail: '🔥',
    isPremium: false,
  },
  {
    id: '4',
    title: 'Latin Fire',
    style: 'latin',
    difficulty: 'beginner',
    duration: '7 min',
    instructorName: 'Sofia',
    instructorAvatar: '💃',
    moves: [
      { name: 'Salsa Ready', instruction: 'Power stance with attitude!', duration: 8, targetPose: TARGET_POSES.power_stance },
      { name: 'Open Arms', instruction: 'Arms wide - feel the rhythm!', duration: 8, targetPose: TARGET_POSES.arms_extended },
      { name: 'Reach High', instruction: 'Arms up to the sky!', duration: 8, targetPose: TARGET_POSES.arms_up },
      { name: 'Low & Fierce', instruction: 'Squat with fire!', duration: 8, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '💃',
    isPremium: false,
  },
  {
    id: '5',
    title: 'K-Pop Dance Cover',
    style: 'kpop',
    difficulty: 'advanced',
    duration: '15 min',
    instructorName: 'Min-Ji',
    instructorAvatar: '🌟',
    moves: [
      { name: 'Idol Stance', instruction: 'Sharp power stance - camera ready!', duration: 6, targetPose: TARGET_POSES.power_stance },
      { name: 'Point Choreography', instruction: 'T-pose with sharp arms!', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'High Energy', instruction: 'Arms up - maximum energy!', duration: 6, targetPose: TARGET_POSES.arms_up },
      { name: 'Ending Pose', instruction: 'Squat into your iconic ending!', duration: 10, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '🇰🇷',
    isPremium: true,
  },
  {
    id: '6',
    title: 'Line Dance Basics',
    style: 'country',
    difficulty: 'beginner',
    duration: '6 min',
    instructorName: 'Dusty',
    instructorAvatar: '🤠',
    moves: [
      { name: 'Boot Stomp Stance', instruction: 'Stand tall, feet apart - like you own the honky tonk!', duration: 8, targetPose: TARGET_POSES.power_stance },
      { name: 'Lasso Arms', instruction: 'Swing that arm up like you\'re ropin\' a steer!', duration: 8, targetPose: TARGET_POSES.arms_up },
      { name: 'Wide Country Stance', instruction: 'Arms out wide - feel the open plains!', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'Cowboy Dip', instruction: 'Bend those knees - tip your hat to the crowd!', duration: 8, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '🤠',
    isPremium: false,
  },
  {
    id: '7',
    title: 'Honky Tonk Moves',
    style: 'country',
    difficulty: 'intermediate',
    duration: '8 min',
    instructorName: 'Jolene',
    instructorAvatar: '👢',
    moves: [
      { name: 'Two-Step Ready', instruction: 'Power stance - get ready to shuffle!', duration: 6, targetPose: TARGET_POSES.power_stance },
      { name: 'Hoedown Arms', instruction: 'Arms extended - clap on the beat!', duration: 8, targetPose: TARGET_POSES.arms_extended },
      { name: 'Yeehaw Reach', instruction: 'Throw those arms up and holler!', duration: 6, targetPose: TARGET_POSES.arms_up },
      { name: 'Boot Scoot Squat', instruction: 'Low and steady - slide them boots!', duration: 10, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '👢',
    isPremium: true,
  },
  {
    id: '8',
    title: 'Country Star Finale',
    style: 'country',
    difficulty: 'advanced',
    duration: '10 min',
    instructorName: 'Wyatt',
    instructorAvatar: '⭐',
    moves: [
      { name: 'Stage Entrance', instruction: 'Walk out strong - own that stage!', duration: 6, targetPose: TARGET_POSES.power_stance },
      { name: 'Guitar Hero Pose', instruction: 'Arms out like you\'re strummin\' a guitar!', duration: 8, targetPose: TARGET_POSES.t_pose },
      { name: 'Crowd Pleaser', instruction: 'Arms high - the crowd goes wild!', duration: 8, targetPose: TARGET_POSES.arms_up },
      { name: 'Take a Bow', instruction: 'Squat down low - tip that hat!', duration: 8, targetPose: TARGET_POSES.squat },
    ],
    thumbnail: '⭐',
    isPremium: true,
  },
];

interface DanceCoachModeProps {
  userTier?: 'FREE' | 'PRO' | 'SUPERSTAR' | 'DIAMOND';
}

const DanceCoachMode: React.FC<DanceCoachModeProps> = ({ userTier = 'FREE' }) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<DanceLesson | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [moveTimer, setMoveTimer] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [poseScore, setPoseScore] = useState(0);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [poseLoaded, setPoseLoaded] = useState(false);
  const [loadingPose, setLoadingPose] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState<boolean[]>([]);
  
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isDiamond = userTier === 'DIAMOND';
  const canAccessPremium = userTier === 'SUPERSTAR' || userTier === 'DIAMOND';

  const filteredLessons = selectedStyle 
    ? SAMPLE_LESSONS.filter(l => l.style === selectedStyle)
    : SAMPLE_LESSONS;

  // Load MediaPipe Pose
  useEffect(() => {
    const loadMediaPipe = async () => {
      if (poseLoaded || loadingPose) return;
      setLoadingPose(true);
      
      try {
        // Check if scripts already loaded
        if (!(window as any).Pose) {
          // Load MediaPipe scripts
          const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = src;
              script.crossOrigin = 'anonymous';
              script.onload = () => resolve();
              script.onerror = reject;
              document.head.appendChild(script);
            });
          };

          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        }
        
        // Wait a bit for scripts to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if ((window as any).Pose) {
          setPoseLoaded(true);
          console.log('✅ MediaPipe Pose loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
      } finally {
        setLoadingPose(false);
      }
    };

    loadMediaPipe();
  }, [poseLoaded, loadingPose]);

  // Initialize pose detection when camera starts
  const initializePose = useCallback(async () => {
    if (!poseLoaded || !(window as any).Pose) {
      console.log('Pose not loaded yet');
      return;
    }

    const Pose = (window as any).Pose;
    
    poseRef.current = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    poseRef.current.onResults((results: PoseResults) => {
      if (results.poseLandmarks) {
        setLandmarks(results.poseLandmarks);
        drawPose(results.poseLandmarks);
        
        // Score the current pose if playing
        if (isPlaying && selectedLesson) {
          const currentMove = selectedLesson.moves[currentMoveIndex];
          if (currentMove?.targetPose) {
            const { score, passed } = scorePose(results.poseLandmarks, currentMove.targetPose);
            setPoseScore(score);
            setCheckpointStatus(passed);
            generateFeedback(score, passed, currentMove.targetPose);
          }
        }
      }
    });

    console.log('✅ Pose detection initialized');
  }, [poseLoaded, isPlaying, selectedLesson, currentMoveIndex]);

  // Draw pose skeleton on canvas
  const drawPose = useCallback((poseLandmarks: PoseLandmark[]) => {
    const canvas = canvasRef.current;
    const video = cameraRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections (skeleton lines)
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 3;
    
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = poseLandmarks[start];
      const endPoint = poseLandmarks[end];
      
      if (startPoint && endPoint && 
          (startPoint.visibility || 0) > 0.5 && 
          (endPoint.visibility || 0) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw landmarks (joints)
    poseLandmarks.forEach((landmark, index) => {
      if ((landmark.visibility || 0) > 0.5) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          6,
          0,
          2 * Math.PI
        );
        
        // Color based on body part
        if (index <= 10) {
          ctx.fillStyle = '#FF00FF'; // Head - pink
        } else if (index <= 22) {
          ctx.fillStyle = '#00FF00'; // Arms/torso - green
        } else {
          ctx.fillStyle = '#FFFF00'; // Legs - yellow
        }
        
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, []);

  // Score the current pose against target
  const scorePose = (poseLandmarks: PoseLandmark[], targetPose: TargetPose): { score: number; passed: boolean[] } => {
    let totalScore = 0;
    const passed: boolean[] = [];

    targetPose.checkpoints.forEach((checkpoint) => {
      try {
        const checkPassed = checkpoint.check(poseLandmarks);
        passed.push(checkPassed);
        if (checkPassed) {
          totalScore += checkpoint.weight * 100;
        }
      } catch {
        passed.push(false);
      }
    });

    return { score: Math.round(totalScore), passed };
  };

  // Generate feedback based on score
  const generateFeedback = (score: number, passed: boolean[], targetPose: TargetPose) => {
    if (score >= 80) {
      setCurrentFeedback('🔥 Perfect! Hold it!');
    } else if (score >= 60) {
      setCurrentFeedback('👍 Good! Keep going!');
    } else {
      // Find first failed checkpoint for specific feedback
      const failedIndex = passed.findIndex(p => !p);
      if (failedIndex >= 0 && targetPose.checkpoints[failedIndex]) {
        setCurrentFeedback(`💡 ${targetPose.checkpoints[failedIndex].description}`);
      } else {
        setCurrentFeedback('📍 Match the pose!');
      }
    }
  };

  // Start camera and pose detection
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraEnabled(true);
        
        // Wait for video to be ready
        cameraRef.current.onloadedmetadata = async () => {
          await cameraRef.current?.play();
          await initializePose();
          startPoseDetection();
        };
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCurrentFeedback('⚠️ Camera access required for pose detection');
    }
  };

  // Continuous pose detection loop
  const startPoseDetection = () => {
    const detectFrame = async () => {
      if (cameraRef.current && poseRef.current && cameraEnabled) {
        try {
          await poseRef.current.send({ image: cameraRef.current });
        } catch (e) {
          // Ignore frame errors
        }
      }
      animationRef.current = requestAnimationFrame(detectFrame);
    };
    detectFrame();
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCameraEnabled(false);
    setLandmarks(null);
  };

  // Start lesson
  const startLesson = (lesson: DanceLesson) => {
    if (lesson.isPremium && !canAccessPremium) {
      setShowUpgrade(true);
      return;
    }
    setSelectedLesson(lesson);
    setCurrentMoveIndex(0);
    setScores([]);
    setOverallScore(null);
    setPoseScore(0);
    setCheckpointStatus([]);
  };

  // Start playing (with countdown)
  const startPlaying = async () => {
    if (!cameraEnabled) {
      await startCamera();
    }
    
    // Countdown
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);
    setIsPlaying(true);
    setMoveTimer(selectedLesson?.moves[0]?.duration || 10);
  };

  // Timer for moves
  useEffect(() => {
    if (!isPlaying || !selectedLesson) return;

    timerRef.current = setInterval(() => {
      setMoveTimer(prev => {
        if (prev <= 1) {
          // Save score for this move
          setScores(s => [...s, poseScore]);
          
          // Move to next
          if (currentMoveIndex < selectedLesson.moves.length - 1) {
            setCurrentMoveIndex(i => i + 1);
            setPoseScore(0);
            setCheckpointStatus([]);
            return selectedLesson.moves[currentMoveIndex + 1]?.duration || 10;
          } else {
            // Lesson complete
            setIsPlaying(false);
            const allScores = [...scores, poseScore];
            const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
            setOverallScore(avg);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedLesson, currentMoveIndex, poseScore, scores]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-3">
          🕺 Dance Coach
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          AI-powered pose detection scores your moves in real-time!
        </p>
        {!poseLoaded && (
          <div className="mt-2 text-sm text-yellow-400 animate-pulse">
            {loadingPose ? '⏳ Loading AI pose detection...' : '🤖 AI ready to load'}
          </div>
        )}
        {poseLoaded && (
          <div className="mt-2 text-sm text-green-400">
            ✅ AI Pose Detection Ready
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md border border-purple-500/50">
            <div className="text-center">
              <div className="text-6xl mb-4">👑</div>
              <h2 className="text-2xl font-bold text-white mb-2">Premium Lesson</h2>
              <p className="text-gray-400 mb-6">Upgrade to Superstar or Diamond to access this lesson!</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson View */}
      {selectedLesson ? (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedLesson(null);
              setIsPlaying(false);
              stopCamera();
              setOverallScore(null);
              setScores([]);
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            ← Back to Lessons
          </button>

          {/* Lesson Complete Screen */}
          {overallScore !== null && (
            <div className="glass-panel p-8 rounded-2xl text-center border-2 border-purple-500/50 animate-fade-in">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">Lesson Complete!</h2>
              <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreBg(overallScore)} bg-clip-text text-transparent mb-4`}>
                {overallScore}%
              </div>
              <p className="text-gray-400 mb-6">
                {overallScore >= 80 ? 'Amazing performance! You nailed it!' :
                 overallScore >= 60 ? 'Good job! Keep practicing!' :
                 'Keep working on it - you\'ll get there!'}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setOverallScore(null);
                    setScores([]);
                    setCurrentMoveIndex(0);
                    setPoseScore(0);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => {
                    setSelectedLesson(null);
                    stopCamera();
                    setOverallScore(null);
                    setScores([]);
                  }}
                  className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                >
                  📚 More Lessons
                </button>
              </div>
            </div>
          )}

          {/* Active Lesson */}
          {overallScore === null && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Camera + Pose */}
              <div className="space-y-4">
                <div className="glass-panel p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
                    <span className="text-sm text-gray-400">
                      Move {currentMoveIndex + 1}/{selectedLesson.moves.length}
                    </span>
                  </div>

                  {/* Camera View with Skeleton Overlay */}
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <video
                      ref={cameraRef}
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                    />

                    {/* Countdown Overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-9xl font-bold text-white animate-pulse">
                          {countdown}
                        </div>
                      </div>
                    )}

                    {/* Camera Off State */}
                    {!cameraEnabled && countdown === null && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📷</div>
                          <p className="text-gray-400">Camera will activate when you start</p>
                        </div>
                      </div>
                    )}

                    {/* Live Score Overlay */}
                    {isPlaying && cameraEnabled && (
                      <>
                        {/* Timer */}
                        <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-full">
                          <span className="text-2xl font-bold text-white">{moveTimer}s</span>
                        </div>

                        {/* Score */}
                        <div className="absolute top-4 right-4 bg-black/60 px-4 py-2 rounded-full">
                          <span className={`text-2xl font-bold ${getScoreColor(poseScore)}`}>
                            {poseScore}%
                          </span>
                        </div>

                        {/* Feedback */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-xl font-bold text-white text-center">
                            {currentFeedback}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Start/Stop Button */}
                  {!isPlaying ? (
                    <button
                      onClick={startPlaying}
                      disabled={countdown !== null || !poseLoaded}
                      className={`w-full mt-4 py-4 rounded-xl font-bold text-xl transition transform ${
                        poseLoaded 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105' 
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {poseLoaded ? '▶️ START LESSON' : '⏳ Loading AI...'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        const avg = scores.length > 0 
                          ? Math.round([...scores, poseScore].reduce((a, b) => a + b, 0) / (scores.length + 1))
                          : poseScore;
                        setOverallScore(avg);
                      }}
                      className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xl"
                    >
                      ⏹️ STOP
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Current Move + Progress */}
              <div className="space-y-4">
                {/* Current Move Card */}
                <div className="glass-panel p-6 rounded-2xl border-2 border-neonPink/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neonPink to-purple-500 flex items-center justify-center text-2xl">
                      {currentMoveIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedLesson.moves[currentMoveIndex]?.name}
                      </h3>
                      <p className="text-sm text-neonPink">Current Move</p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-300 mb-4">
                    {selectedLesson.moves[currentMoveIndex]?.instruction}
                  </p>

                  {/* Pose Checkpoints */}
                  {isPlaying && selectedLesson.moves[currentMoveIndex]?.targetPose && (
                    <div className="space-y-2 border-t border-gray-700 pt-4">
                      <p className="text-xs text-gray-500 uppercase font-bold">Checkpoints</p>
                      {selectedLesson.moves[currentMoveIndex].targetPose.checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={checkpointStatus[idx] ? 'text-green-400' : 'text-gray-500'}>
                            {checkpointStatus[idx] ? '✓' : '○'}
                          </span>
                          <span className={checkpointStatus[idx] ? 'text-green-400' : 'text-gray-400'}>
                            {cp.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Move Progress */}
                <div className="glass-panel p-4 rounded-2xl">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Move Progress</h3>
                  <div className="space-y-2">
                    {selectedLesson.moves.map((move, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-2 rounded-lg transition ${
                          idx === currentMoveIndex ? 'bg-neonPink/20 border border-neonPink/50' :
                          idx < currentMoveIndex ? 'bg-green-500/10' : 'bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === currentMoveIndex ? 'bg-neonPink text-black' :
                          idx < currentMoveIndex ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {idx < currentMoveIndex ? '✓' : idx + 1}
                        </div>
                        <span className={idx === currentMoveIndex ? 'text-white font-semibold' : 'text-gray-400'}>
                          {move.name}
                        </span>
                        {scores[idx] !== undefined && (
                          <span className={`ml-auto font-bold ${getScoreColor(scores[idx])}`}>
                            {scores[idx]}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skeleton Legend */}
                <div className="glass-panel p-4 rounded-2xl">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Skeleton Guide</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF00FF]"></div>
                      <span className="text-gray-400">Head</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#00FF00]"></div>
                      <span className="text-gray-400">Arms & Torso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FFFF00]"></div>
                      <span className="text-gray-400">Legs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-[#00FFFF]"></div>
                      <span className="text-gray-400">Connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Style Filter */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-300 mb-4">Choose Your Style</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedStyle(null)}
                className={`px-4 py-2 rounded-full transition ${!selectedStyle ? 'bg-white text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                All Styles
              </button>
              {DANCE_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-4 py-2 rounded-full transition flex items-center gap-2 ${
                    selectedStyle === style.id ? `bg-gradient-to-r ${style.color} text-white font-bold` : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{style.emoji}</span>
                  <span>{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => {
              const style = DANCE_STYLES.find(s => s.id === lesson.style);
              const isLocked = lesson.isPremium && !canAccessPremium;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => startLesson(lesson)}
                  className={`relative group bg-black/40 backdrop-blur-md rounded-2xl p-6 border transition-all hover:scale-[1.02] text-left ${
                    isLocked ? 'border-gray-700 opacity-80' : 'border-purple-500/30 hover:border-purple-500/60'
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
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style?.color || 'from-gray-600 to-gray-700'} flex items-center justify-center`}>
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
                    <span>📚 {lesson.moves.length} moves</span>
                  </div>

                  <div className="flex items-center gap-1 text-purple-400 text-xs">
                    <span>🤖</span>
                    <span>AI Pose Detection & Scoring</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feature Highlight */}
          <div className="mt-12 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-8 border border-purple-500/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl">🤖</div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  Real-Time AI Pose Detection
                </h2>
                <p className="text-gray-300 mb-4">
                  Our AI tracks 33 body points and scores your poses in real-time!
                </p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>🦴 Full skeleton tracking overlay</li>
                  <li>📊 Live scoring as you move</li>
                  <li>💡 Instant feedback on form</li>
                  <li>🎯 Checkpoint-based pose matching</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DanceCoachMode;

