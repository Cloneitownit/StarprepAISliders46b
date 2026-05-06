import { SongResult } from '../types';

const API_BASE_URL = '';

function proxyUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url;
  return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
}

/**
 * Poll for song completion
 */
async function pollForSong(taskId: string, onProgress?: (status: string) => void): Promise<string> {
  const maxAttempts = 240; // 8 minutes
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    if (onProgress) {
      if (attempts < 10) onProgress('Starting generation...');
      else if (attempts < 30) onProgress('AI is composing your song...');
      else if (attempts < 60) onProgress('Adding vocals and mixing...');
      else if (attempts < 120) onProgress('Still working — complex songs take longer...');
      else onProgress('Almost done, hang tight...');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/start-song?taskId=${taskId}`);
      const result = await response.json();

      console.log(`🔍 Poll ${attempts}: status=${result.status}`);

      if (result.ready && result.audioUrl) {
        console.log('✅ Song ready:', result.audioUrl);
        return result.audioUrl;
      }

      if (result.status === 'FAILED') {
        throw new Error(result.error || 'Song generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Poll error:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Song generation is taking longer than usual. Please try again.');
}

/**
 * Generate AI song via Kie.ai
 */
export async function generateTrackAudio(
  song: SongResult,
  onProgress?: (status: string) => void,
  vocalGender: string = 'f'
): Promise<string> {
  console.log('🎵 Generating audio for:', song.title);

  const startResponse = await fetch(`${API_BASE_URL}/api/start-song`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lyrics: song.rawLyrics || song.lyrics,
      style: song.genre || 'Pop',
      title: song.title || 'StarPrep Song',
      vocalGender,
    }),
  });

  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error((err as any).error || `Server error: ${startResponse.status}`);
  }

  const startResult = await startResponse.json();
  if (!startResult.success || !startResult.taskId) {
    throw new Error(startResult.error || 'Failed to start song generation');
  }

  console.log('✅ Song generation started, taskId:', startResult.taskId);
  return pollForSong(startResult.taskId, onProgress);
}

/**
 * Generate instrumental (karaoke) track via Kie.ai
 */
export async function generateInstrumentalTrack(
  song: SongResult,
  onProgress?: (status: string) => void
): Promise<string> {
  console.log('🎵 Generating instrumental for:', song.title);

  const startResponse = await fetch(`${API_BASE_URL}/api/start-song`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lyrics: song.rawLyrics || song.lyrics,
      style: song.genre || 'Pop',
      title: song.title || 'StarPrep Song (Instrumental)',
      instrumental: true,
    }),
  });

  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error((err as any).error || `Server error: ${startResponse.status}`);
  }

  const startResult = await startResponse.json();
  if (!startResult.success || !startResult.taskId) {
    throw new Error(startResult.error || 'Failed to start instrumental generation');
  }

  console.log('✅ Instrumental started, taskId:', startResult.taskId);
  return pollForSong(startResult.taskId, onProgress);
}

/**
 * MAIN PIPELINE: Generate a song in the user's cloned voice
 *
 * SIMPLIFIED v86 PIPELINE (matches Replicate docs exactly):
 *
 *   Step 1 — Generate base song via Kie.ai  →  full song URL (AI singer)
 *   Step 2 — Clone voice via Replicate RVC  →  RVC handles its OWN stem separation internally.
 *            We send the FULL song. RVC strips out the AI vocals, converts them
 *            to the user's trained voice, and remixes the result with the instrumental.
 *            Output = complete song with user's voice. No manual mixing needed.
 *   Step 3 — Return the RVC output URL (proxied for CORS)
 *
 * We no longer call Demucs separately — that was causing double stem separation
 * (Demucs first, then RVC again internally), losing quality at each step.
 */
export async function generateClonedTrack(
  song: SongResult,
  referenceAudio: File | Blob,
  voiceModel: string,
  onProgress?: (status: string) => void,
  gender: string = 'f'
): Promise<string> {
  console.log('🎤 generateClonedTrack v86 — RVC pipeline');
  console.log('   Song:', song.title);

  let fallbackSongUrl: string | null = song.audioUrl || null;

  try {
    const savedGender       = localStorage.getItem('starprep_voice_gender') || gender;
    const trainedModelUrl   = localStorage.getItem('starprep_voice_model_url') || null;

    console.log('   Trained model URL:', trainedModelUrl ? trainedModelUrl.substring(0, 60) : 'NONE');
    console.log('   Gender:', savedGender);

    if (!trainedModelUrl) {
      throw new Error('No trained voice model found. Please complete voice training first.');
    }

    // ── Step 1: Generate the AI song via Kie.ai ──────────────────────────
    if (onProgress) onProgress('🎵 Step 1/2: Generating your song...');
    console.log('📝 Step 1: Generating base song...');

    const baseSongUrl = await generateTrackAudio(song, onProgress, savedGender);
    fallbackSongUrl = baseSongUrl;
    console.log('✅ Base song URL:', baseSongUrl.substring(0, 80));

    // ── Step 2: Clone voice via Replicate RVC ────────────────────────────
    // Send the FULL song URL — RVC handles stem separation internally.
    // It strips out the AI vocals, converts them to the user's voice,
    // and outputs a complete song. No Demucs needed.
    if (onProgress) onProgress('🎤 Step 2/2: Cloning your voice onto the song...');
    console.log('🎤 Step 2: Starting RVC voice conversion...');

    // Read tuning settings from localStorage (set by VoiceCloneMode sliders)
    const tuningStr = localStorage.getItem('starprep_voice_tuning');
    const tuning = tuningStr ? JSON.parse(tuningStr) : {};
    console.log('🎚️ Using tuning settings:', tuning);

    const cloneResponse = await fetch(`${API_BASE_URL}/api/clone-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songUrl:         baseSongUrl,    // FULL song — RVC separates stems itself
        trainedModelUrl: trainedModelUrl,
        gender:          savedGender,
        pitchShift:      tuning.pitchShift ?? 0,
        indexRate:       tuning.indexRate ?? 0.75,
        rmsMixRate:      tuning.rmsMixRate ?? 0.2,
        protect:         tuning.protect ?? 0.3,
        filterRadius:    tuning.filterRadius ?? 4,
      }),
    });

    if (!cloneResponse.ok) {
      const err = await cloneResponse.json().catch(() => ({}));
      throw new Error((err as any).error || 'Voice cloning request failed');
    }

    const cloneResult = await cloneResponse.json();
    console.log('Clone API result:', cloneResult.status, '| method:', cloneResult.method);

    if (!cloneResult.success) {
      if (cloneResult.needsTraining) {
        throw new Error('Voice model not ready. Please complete voice training first.');
      }
      throw new Error(cloneResult.error || 'Voice cloning failed');
    }

    // If RVC completed immediately, return the output
    if (cloneResult.status === 'succeeded' && (cloneResult.clonedAudioUrl || cloneResult.audioUrl)) {
      const url = cloneResult.clonedAudioUrl || cloneResult.audioUrl;
      console.log('✅ RVC completed immediately:', url.substring(0, 80));
      if (onProgress) onProgress('🎉 Your cloned song is ready!');
      return proxyUrl(url);
    }

    // RVC started async — poll check-clone
    if (cloneResult.status === 'started' && cloneResult.jobId) {
      console.log('⏳ RVC started async — polling check-clone, jobId:', cloneResult.jobId);
      if (onProgress) onProgress('🎤 Cloning your voice... (1-3 minutes)');

      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise(r => setTimeout(r, 3000));

        const elapsed = attempt * 3;
        if (onProgress) onProgress(`🎤 Cloning your voice... (${elapsed}s)`);

        try {
          const pollRes = await fetch(
            `${API_BASE_URL}/api/check-clone?jobId=${cloneResult.jobId}&method=replicate-rvc`
          );
          const pollData = await pollRes.json();

          console.log(`   Poll ${attempt + 1}: ${pollData.status}`);

          if (pollData.status === 'succeeded') {
            const clonedUrl = pollData.clonedAudioUrl || pollData.audioUrl;
            if (clonedUrl) {
              console.log('✅ RVC cloning complete:', clonedUrl.substring(0, 80));
              if (onProgress) onProgress('🎉 Your cloned song is ready!');
              return proxyUrl(clonedUrl);
            }
          }

          if (pollData.status === 'failed') {
            console.warn('⚠️ RVC cloning failed:', pollData.error);
            throw new Error(pollData.error || 'Voice cloning failed');
          }
        } catch (pollErr) {
          console.warn('Poll error (will retry):', pollErr);
        }
      }

      throw new Error('Voice cloning timed out. Please try again.');
    }

    throw new Error('Unexpected response from voice cloning API');

  } catch (error) {
    console.error('❌ generateClonedTrack error:', error);

    // Fallback: play the AI-generated song without cloning
    if (fallbackSongUrl) {
      console.log('🎵 Falling back to AI song (no voice cloning)');
      if (onProgress) onProgress('🎵 Playing AI version — voice cloning unavailable');
      return fallbackSongUrl;
    }

    throw error;
  }
}

/**
 * Generate a full AI song (standalone, not part of clone pipeline)
 */
export async function generateFullSong(
  lyrics: string,
  style: string,
  _duration: number = 60,
  onProgress?: (status: string) => void,
  vocalGender: string = 'f'
): Promise<string> {
  console.log('🎵 generateFullSong...');

  const startResponse = await fetch(`${API_BASE_URL}/api/start-song`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lyrics,
      style: style || 'pop, professional vocals, high quality',
      title: 'StarPrep Song',
      vocalGender,
    }),
  });

  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error((err as any).error || 'Song generation failed');
  }

  const startResult = await startResponse.json();
  if (!startResult.success || !startResult.taskId) {
    throw new Error(startResult.error || 'Failed to start generation');
  }

  return pollForSong(startResult.taskId, onProgress);
}

/**
 * Separate vocals from instrumentals for karaoke mode
 * (kept for karaoke/judge mode — NOT used in the voice clone pipeline anymore)
 */
export async function separateStems(audioUrl: string): Promise<{ vocalsUrl: string; instrumentalUrl: string }> {
  console.log('🎵 separateStems for karaoke...');

  const response = await fetch(`${API_BASE_URL}/api/separate-stems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).error || 'Stem separation failed');
  }

  const result = await response.json();
  console.log('✅ Stems separated!');

  return {
    vocalsUrl:       result.vocalsUrl,
    instrumentalUrl: result.instrumentalUrl,
  };
}

// ── audioBufferToWav kept for any component that still imports it ─────────────

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels   = buffer.numberOfChannels;
  const sampleRate    = buffer.sampleRate;
  const length        = buffer.length;
  const bytesPerSample = 2;
  const dataSize      = length * numChannels * bytesPerSample;
  const totalSize     = 44 + dataSize;

  const ab   = new ArrayBuffer(totalSize);
  const view = new DataView(ab);

  const ws = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, totalSize - 8, true);
  ws(8, 'WAVE'); ws(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  ws(36, 'data'); view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}
