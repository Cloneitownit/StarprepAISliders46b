import { SongResult } from '../types';

// API is on the same domain (Vercel serverless functions)
const API_BASE_URL = '';

/**
 * Converts a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a song from audio input
 * 1. Uploads the audio to get a URL
 * 2. Transcribes the audio (4 words)
 * 3. Generates lyrics from the words
 * 4. Saves lyrics to localStorage for JudgeMode
 * 5. Returns the song data
 */
export async function generateSongFromAudio(blob: Blob): Promise<SongResult> {
  console.log('🎤 Processing audio for song generation...');
  console.log('   Blob size:', blob.size, 'bytes');
  console.log('   Blob type:', blob.type);

  // Step 1: Convert audio to base64
  const audioBase64 = await blobToBase64(blob);
  console.log('   Base64 length:', audioBase64.length);

  // Step 2: Upload audio to get a URL
  console.log('📤 Uploading audio...');
  let audioUrl = '';
  
  try {
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        audioBase64,
        fileName: `recording-${Date.now()}.webm`,
        contentType: blob.type || 'audio/webm'
      }),
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      audioUrl = uploadResult.url;
      console.log('✅ Audio uploaded:', audioUrl.substring(0, 50) + '...');
    } else {
      console.error('❌ Upload failed:', await uploadResponse.text());
      throw new Error('Failed to upload audio');
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw new Error('Failed to upload audio');
  }

  // Step 3: Transcribe the audio
  // v14 FIX: Pass the hosted audioUrl from upload step (not raw base64)
  // Replicate Whisper works much better with hosted URLs than data URIs
  console.log('🎧 Transcribing audio...');
  let transcription = '';
  
  try {
    const transcribeResponse = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl, audioBase64 }),
    });

    if (transcribeResponse.ok) {
      const transcribeResult = await transcribeResponse.json();
      transcription = transcribeResult.transcription || transcribeResult.text || transcribeResult.words || '';
      console.log('✅ Transcription:', transcription);
    } else {
      const errText = await transcribeResponse.text();
      console.error('❌ Transcription failed:', errText);
      throw new Error('Failed to transcribe audio');
    }
  } catch (error) {
    console.error('❌ Transcription error:', error);
    throw new Error('Failed to transcribe audio. Please try speaking clearly.');
  }

  if (!transcription || transcription.trim().length === 0) {
    throw new Error('No words detected in audio. Please try again and speak clearly.');
  }

  // Step 4: Generate lyrics from the words
  console.log('📝 Generating lyrics from:', transcription);
  console.log('🎯 YOUR 4 WORDS ARE:', transcription);
  
  try {
    const lyricsResponse = await fetch(`${API_BASE_URL}/api/generate-lyrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        words: transcription,
        style: 'Pop',
      }),
    });

    if (!lyricsResponse.ok) {
      console.error('❌ Lyrics generation failed:', await lyricsResponse.text());
      throw new Error('Failed to generate lyrics');
    }

    const lyricsResult = await lyricsResponse.json();
    const isThemePrompt = lyricsResult.isThemePrompt || false;
    // v28: If it's a theme prompt, don't show the raw prompt to the user
    const displayLyrics = isThemePrompt 
      ? `🎵 AI is writing a creative song inspired by: "${transcription}"\n\n(Full lyrics will be generated with the music!)`
      : (lyricsResult.lyrics || lyricsResult.data?.lyrics || '');
    const lyrics = lyricsResult.lyrics || lyricsResult.data?.lyrics || '';
    const title = lyricsResult.title || lyricsResult.data?.title || 'Your Song';
    
    console.log('✅ Lyrics generated! Title:', title);

    // ═══════════════════════════════════════════════════════════════
    // v13 FIX: Save lyrics to localStorage for JudgeMode
    // This allows the Judge to know what song the user should be singing
    // ═══════════════════════════════════════════════════════════════
    try {
      localStorage.setItem('starprep_last_song_lyrics', lyrics);
      localStorage.setItem('starprep_last_song_title', title);
      localStorage.setItem('starprep_last_detected_words', transcription);
      console.log('💾 Saved lyrics to localStorage for Judge mode');
    } catch (e) {
      console.warn('Could not save lyrics to localStorage:', e);
    }

    return {
      title: title,
      genre: 'Pop',
      detectedWords: transcription,
      vocalAnalysis: `Song created from your words: "${transcription}". This track is designed to showcase your vocal range.`,
      lyrics: displayLyrics,       // v28: Clean display for user
      rawLyrics: lyrics,           // v28: Raw prompt for Kie music generation
      chords: 'C - G - Am - F (I - V - vi - IV)',
      structure: 'Verse - Chorus - Verse - Chorus - Bridge - Outro',
    };

  } catch (error) {
    console.error('❌ Lyrics generation error:', error);
    throw error;
  }
}

/**
 * Generates audio track from song lyrics using Kie.ai (Suno V5)
 * Step 1: POST /api/start-song  → returns taskId immediately
 * Step 2: Poll GET /api/check-song?taskId=xxx until audioUrl is ready
 */
export async function generateSongAudio(lyrics: string, style: string): Promise<string> {
  console.log('🎵 Generating audio track with Kie.ai...');

  try {
    const startResponse = await fetch(`${API_BASE_URL}/api/start-song`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lyrics,
        style: style || 'pop, professional vocals, high quality, radio-ready',
        title: 'StarPrep Song',
        vocalGender: 'f',
      }),
    });

    if (!startResponse.ok) {
      const err = await startResponse.json().catch(() => ({}));
      throw new Error(err.error || `start-song failed: ${startResponse.status}`);
    }

    const startResult = await startResponse.json();
    if (!startResult.success || !startResult.taskId) {
      throw new Error(startResult.error || 'No taskId returned from start-song');
    }

    const taskId = startResult.taskId;
    console.log('✅ Song generation started, taskId:', taskId);

    const maxAttempts = 120;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const checkResponse = await fetch(`${API_BASE_URL}/api/check-song?taskId=${taskId}`);
      const checkResult = await checkResponse.json();

      console.log(`🔍 Poll ${attempt}: status=${checkResult.status}`);

      if (checkResult.ready && checkResult.audioUrl) {
        console.log('✅ Audio generated:', checkResult.audioUrl);
        
        // v13: Save song URL for JudgeMode
        try {
          localStorage.setItem('starprep_last_song_url', checkResult.audioUrl);
        } catch (e) { /* ignore */ }
        
        return checkResult.audioUrl;
      }

      if (checkResult.status === 'FAILED') {
        throw new Error(checkResult.error || 'Song generation failed');
      }
    }

    throw new Error('Song generation timed out after 4 minutes. Please try again.');
  } catch (error) {
    console.error('❌ Audio generation failed:', error);
    throw error;
  }
}

/**
 * Clones a voice and applies it to a song using Replicate RVC
 */
export async function cloneVoice(audioBlob: Blob, songUrl: string): Promise<string> {
  console.log('🎤 Cloning voice...');
  
  try {
    const audioBase64 = await blobToBase64(audioBlob);
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, fileName: 'voice-sample.webm' }),
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload voice sample');
    }

    const uploadResult = await uploadResponse.json();
    const voiceSampleUrl = uploadResult.url;

    // Read tuning settings from localStorage (set by VoiceCloneMode sliders)
    const tuningStr = localStorage.getItem('starprep_voice_tuning');
    const tuning = tuningStr ? JSON.parse(tuningStr) : {};

    const response = await fetch(`${API_BASE_URL}/api/clone-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        voiceSampleUrl,
        songUrl,
        pitchShift:   tuning.pitchShift ?? -5,
        indexRate:    tuning.indexRate ?? 0.75,
        rmsMixRate:   tuning.rmsMixRate ?? 0.2,
        protect:      tuning.protect ?? 0.3,
        filterRadius: tuning.filterRadius ?? 4,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clone voice');
    }

    const result = await response.json();
    console.log('✅ Voice cloned!', result.clonedAudioUrl);
    
    return result.clonedAudioUrl || result.audioUrl;
  } catch (error) {
    console.error('❌ Voice cloning failed:', error);
    throw error;
  }
}

/**
 * Synthesizes speech - redirects to clone voice (kept for backward compatibility)
 */
export async function synthesizeVoice(_text: string, _voiceId: string): Promise<string> {
  console.log('🔊 Voice synthesis not available in new API');
  throw new Error('Voice synthesis has been replaced with voice cloning');
}
