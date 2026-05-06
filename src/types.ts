
export enum AppMode {
  HOME = 'HOME',
  VOICE_CLONE = 'VOICE_CLONE', // Train Your Voice
  SONG_WRITER = 'SONG_WRITER', // Audio -> Song
  LYRIC_COMPOSER = 'LYRIC_COMPOSER', // Lyrics -> Composition
  JUDGE = 'JUDGE', // Audio -> Score
  VOCAL_COACH = 'VOCAL_COACH', // Audio -> Exercises
  SINGING_LESSONS = 'SINGING_LESSONS', // AI Singing Lessons
  DANCE_COACH = 'DANCE_COACH', // AI Dance Lessons
  IDOL_PREP = 'IDOL_PREP', // Audio -> Idol Readiness & Song Choices
  STAGE_PRESENCE = 'STAGE_PRESENCE', // Audio -> Charisma & Stage Command
  DUET = 'DUET', // Call & Response Singing
  BRANDING = 'BRANDING', // Identity Generation
  SHOP = 'SHOP', // Merch & Microphone Shop
}

export type AppLanguage = 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO' | 'AR' | 'HI' | 'NL' | 'PL' | 'TR';

export type SubscriptionTier = 'FREE' | 'PRO' | 'SUPERSTAR' | 'DIAMOND';

export interface User {
  id: string;
  name: string;
  tier: SubscriptionTier;
  xp: number; // Experience points for mic rewards
}

export interface JudgeResult {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  toneAnalysis: string;
  agtReady: boolean;
}

export interface IdolResult {
  score: number;
  readinessLevel: string; // e.g. "Hollywood Week", "Live Shows"
  feedback: string;
  vocalIdentity: string;
  songRecommendations: string[];
  goldenTicket: boolean;
}

export interface VocalCoachResult {
  analysis: string;
  exercises: {
    name: string;
    description: string;
    duration: string;
  }[];
  focusArea: string;
  pitchScore: number;
  pitchCurve: {
    time: number;
    user: number;
    ideal: number;
  }[];
}

export interface StagePresenceResult {
  charismaScore: number; // 0-100
  energyLevel: string; // "Low", "Moderate", "High", "Electric"
  feedback: string;
  tips: string[];
}

export interface SongResult {
  title: string;
  genre: string;
  detectedWords?: string;
  vocalAnalysis?: string; // The AI's description of the voice it learned
  lyrics: string;
  rawLyrics?: string;    // v28: Theme prompt for Kie (when lyrics are display-only)
  chords: string;
  structure: string;
  audioUrl?: string;
}

export interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export interface DuetPartner {
  id: string;
  name: string;
  style: string;
  description: string;
  color: string;
  voiceId?: string; // Optional ID for TTS
}

export interface DuetMessage {
  id: string;
  sender: 'USER' | 'AI';
  lyrics: string;
  audioUrl?: string;
}

export interface DuetResponse {
  userLyrics: string; // Transcribed
  aiLyrics: string; // Generated
}

export interface BrandResult {
  stageName: string;
  fashionStyle: string;
  fandomName: string;
  genre: string;
  albumTitle: string;
  albumConcept: string;
  socialBio: string;
  colorPalette: string[];
}