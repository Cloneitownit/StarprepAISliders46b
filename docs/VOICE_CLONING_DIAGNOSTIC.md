# Voice Cloning Diagnostic & Troubleshooting Guide

## System Overview

Your app uses **Seed-VC** (zero-shot voice cloning) from Hugging Face Spaces for instant voice cloning without training. Here's how it works:

### Architecture Flow

```
User Records Voice → Upload to Uploadcare → Save URL in localStorage
                                              ↓
When Generating Song: Generate Base Song (Suno) → Apply Voice Clone (Seed-VC) → Final Output
```

## Current Implementation Analysis

### ✅ What's Working Well

1. **Zero-Shot Approach**: Using Seed-VC eliminates training wait time
2. **Multiple Endpoint Fallback**: Tries different Gradio API formats
3. **Graceful Degradation**: Falls back to AI vocals if cloning fails
4. **localStorage Integration**: Saves voice samples for reuse
5. **Gender-Based Pitch Adjustment**: Auto-adjusts pitch based on gender

### 🔍 Potential Issues & Solutions

## Issue #1: Hugging Face Spaces API Reliability

**Problem**: The Seed-VC Hugging Face Space may be:
- Sleeping (cold start)
- Rate limited
- Updated (API changed)
- Down temporarily

**Diagnostic Steps**:

```bash
# Test if the space is running
curl -X POST https://plachta-seed-vc.hf.space/call/voice_conversion \
  -H "Content-Type: application/json" \
  -d '{"data":["test"]}'
```

**Solutions**:

1. **Add Space Wakeup Call** (in `/api/clone-voice.js`):
```javascript
// Before main request, wake up the space
await fetch('https://plachta-seed-vc.hf.space/', { method: 'GET' });
await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
```

2. **Implement Longer Timeout**:
```javascript
// In start-clone.js and clone-voice.js
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

const response = await fetch(endpoint, {
  signal: controller.signal,
  // ... rest of config
});
```

3. **Add Alternative Voice Cloning Service**:
   - Consider adding RVC (Retrieval-based Voice Conversion) as backup
   - Or use ElevenLabs API for premium users

## Issue #2: CORS and URL Access

**Problem**: Voice sample URLs must be publicly accessible

**Diagnostic**:
```javascript
// Add this to clone-voice.js after line 26
console.log('Testing URL accessibility...');
const testResponse = await fetch(voiceModelUrl, { method: 'HEAD' });
console.log('URL accessible:', testResponse.ok);
```

**Solutions**:

1. **Verify Uploadcare URLs are public**:
```javascript
// In VoiceCloneMode.tsx, after upload
const testUrl = await fetch(audioUrl, { method: 'HEAD' });
if (!testUrl.ok) {
  console.error('Uploaded URL not accessible!');
  // Retry with different settings
}
```

2. **Enable Uploadcare CORS**:
   - Make sure Uploadcare public key is configured correctly
   - Verify `UPLOADCARE_STORE: '1'` is set (permanent storage)

## Issue #3: Audio Format Compatibility

**Problem**: Seed-VC may not accept all audio formats

**Current Format**: `audio/webm`

**Diagnostic**:
```javascript
// Check what format the blob is
console.log('Blob type:', combinedBlob.type);
console.log('Blob size:', combinedBlob.size);
```

**Solutions**:

1. **Convert to MP3/WAV** before upload:
```javascript
// Add to VoiceCloneMode.tsx
import { convertToMP3 } from './audioConverter';

// Before upload
const mp3Blob = await convertToMP3(combinedBlob);
```

2. **Use FFmpeg.wasm for conversion**:
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

```javascript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

async function convertWebmToMp3(webmBlob) {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  
  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
  await ffmpeg.exec(['-i', 'input.webm', '-codec:a', 'libmp3lame', 'output.mp3']);
  
  const data = await ffmpeg.readFile('output.mp3');
  return new Blob([data.buffer], { type: 'audio/mp3' });
}
```

## Issue #4: Polling Implementation

**Problem**: The current polling in `check-clone.js` may timeout or miss results

**Improvements**:

1. **Add Exponential Backoff**:
```javascript
// In check-clone.js
let pollCount = 0;
const maxPolls = 60; // 2 minutes max

async function pollWithBackoff() {
  while (pollCount < maxPolls) {
    const delay = Math.min(1000 * Math.pow(1.5, pollCount), 5000); // Max 5s
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // ... check status
    pollCount++;
  }
}
```

2. **WebSocket Support** (if Gradio supports it):
```javascript
// Instead of polling, try WebSocket
const ws = new WebSocket('wss://plachta-seed-vc.hf.space/queue/join');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.msg === 'process_completed') {
    // Handle result
  }
};
```

## Issue #5: Frontend Integration

**Problem**: Users may not see errors or progress

**Solutions**:

1. **Better Error Display** in `SongWriterMode.tsx`:
```javascript
const [cloneError, setCloneError] = useState<string | null>(null);

// In handleGenerateAudio
if (useVoiceClone) {
  try {
    url = await generateClonedTrack(...);
  } catch (err) {
    setCloneError(err.message);
    // Offer to retry or use AI vocals
  }
}
```

2. **Progress Indicators**:
```javascript
// Add to musicGenService.ts
export async function generateClonedTrack(
  song: SongResult,
  referenceAudio: File | Blob,
  voiceModel: string,
  onProgress?: (status: string, progress: number) => void, // Add progress %
  gender: string = 'f'
): Promise<string> {
  if (onProgress) onProgress('Starting...', 0);
  
  const baseSongUrl = await generateTrackAudio(song, (status) => {
    onProgress?.(status, 50); // Base song is 50%
  }, gender);
  
  if (onProgress) onProgress('Cloning voice...', 75);
  // ... clone
  
  if (onProgress) onProgress('Complete!', 100);
}
```

## Issue #6: Voice Sample Quality

**Problem**: Poor quality recordings = poor cloning results

**Solutions**:

1. **Audio Quality Check** in `VoiceTraining.tsx`:
```javascript
// After recording, analyze audio
function analyzeAudioQuality(blob: Blob): Promise<{ quality: number, issues: string[] }> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const issues = [];
      const channelData = audioBuffer.getChannelData(0);
      
      // Check for clipping
      const maxAmplitude = Math.max(...channelData.map(Math.abs));
      if (maxAmplitude > 0.95) issues.push('Audio clipping detected');
      
      // Check for silence
      const avgAmplitude = channelData.reduce((sum, val) => sum + Math.abs(val), 0) / channelData.length;
      if (avgAmplitude < 0.01) issues.push('Audio too quiet');
      
      const quality = Math.min(100, (avgAmplitude / maxAmplitude) * 100);
      resolve({ quality, issues });
    };
    
    reader.readAsArrayBuffer(blob);
  });
}
```

2. **Minimum Recording Length**:
```javascript
// In VoiceTraining.tsx
const MIN_RECORDING_SECONDS = 10;
const MAX_RECORDING_SECONDS = 30;

// Validate before processing
if (totalDuration < MIN_RECORDING_SECONDS) {
  alert('Recording too short! Please record at least 10 seconds.');
  return;
}
```

## Testing Checklist

### Basic Functionality
- [ ] Voice recording starts and stops properly
- [ ] Audio uploads to Uploadcare successfully
- [ ] Voice sample URL is saved in localStorage
- [ ] Base song generates successfully
- [ ] Voice cloning API call succeeds
- [ ] Final cloned audio plays correctly

### Error Scenarios
- [ ] What happens if Seed-VC is down?
- [ ] What happens if upload fails?
- [ ] What happens if voice sample URL is invalid?
- [ ] Does it gracefully fall back to AI vocals?

### User Experience
- [ ] Progress indicators work correctly
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] User can retry on failure

## Debugging Tools

### 1. Enhanced Logging

Add this to `api/clone-voice.js`:

```javascript
// At the start
console.log('═══════════════════════════════════════');
console.log('VOICE CLONE REQUEST');
console.log('Timestamp:', new Date().toISOString());
console.log('Song URL:', songUrl?.substring(0, 100));
console.log('Voice URL:', referenceAudioUrl?.substring(0, 100));
console.log('Gender:', gender);
console.log('Pitch:', pitchShift);
console.log('═══════════════════════════════════════');

// After each step
console.log('✓ Step 1 complete');
console.log('✓ Step 2 complete');

// At the end
console.log('═══════════════════════════════════════');
console.log('VOICE CLONE RESULT');
console.log('Success:', !!outputUrl);
console.log('Output URL:', outputUrl?.substring(0, 100));
console.log('Duration:', Date.now() - startTime, 'ms');
console.log('═══════════════════════════════════════');
```

### 2. Frontend Debug Panel

Add to `VoiceCloneMode.tsx`:

```javascript
const [debugMode, setDebugMode] = useState(false);

// In render
{debugMode && (
  <div className="mt-4 p-4 bg-black/60 rounded-lg text-xs font-mono">
    <h4 className="font-bold mb-2">Debug Info</h4>
    <pre className="whitespace-pre-wrap">
      Voice Sample URL: {localStorage.getItem('starprep_voice_sample_url')}
      Voice Model URL: {localStorage.getItem('starprep_voice_model_url')}
      Gender: {localStorage.getItem('starprep_voice_gender')}
      Setup Complete: {localStorage.getItem('starprep_voice_setup_complete')}
    </pre>
  </div>
)}

<button 
  onClick={() => setDebugMode(!debugMode)}
  className="text-xs text-gray-500"
>
  {debugMode ? 'Hide' : 'Show'} Debug Info
</button>
```

### 3. Network Monitoring

```javascript
// Add to browser console while testing
// Monitor all fetch calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('🌐 FETCH:', args[0]);
  const response = await originalFetch(...args);
  console.log('📥 RESPONSE:', response.status, args[0]);
  return response;
};
```

## Recommended Improvements

### Priority 1: Reliability

1. **Add retry logic** for failed API calls
2. **Implement health check** for Seed-VC before attempting clone
3. **Add timeout handling** for long-running operations
4. **Store backup voice samples** in case primary fails

### Priority 2: User Experience

1. **Show real-time progress** during cloning
2. **Preview voice before generating song**
3. **Allow voice sample re-recording** without losing data
4. **Compare AI vocals vs cloned vocals** side-by-side

### Priority 3: Quality

1. **Audio quality validation** before upload
2. **Sample multiple voice recordings** and use best quality
3. **Add noise reduction** preprocessing
4. **Optimize pitch shift settings** per user

## Common Issues & Quick Fixes

### "Voice cloning unavailable - using AI vocals"

**Causes**:
- Seed-VC space is sleeping
- Network timeout
- Invalid audio format
- CORS issues

**Quick Fix**:
```javascript
// In clone-voice.js, add retry with delay
for (let retry = 0; retry < 3; retry++) {
  try {
    // ... clone logic
    break; // Success
  } catch (err) {
    if (retry < 2) {
      console.log(`Retry ${retry + 1}/3 in 5 seconds...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}
```

### "Failed to upload audio"

**Causes**:
- File too large
- Network issues
- Invalid Uploadcare key

**Quick Fix**:
```javascript
// Compress audio before upload
const compressedBlob = await compressAudio(combinedBlob, 0.5); // 50% quality
```

### "Original recording not found"

**Cause**: `audioBlob` not passed correctly

**Quick Fix**:
```javascript
// In SongWriterMode.tsx
if (!audioBlob && referenceMethod === 'ORIGINAL') {
  // Try to get from localStorage or force upload method
  setReferenceMethod('UPLOAD');
  setAudioError('Please upload a voice sample to use voice cloning');
  return;
}
```

## Performance Optimization

### 1. Parallel Processing

```javascript
// Generate base song and upload voice sample in parallel
const [baseSongUrl, voiceUrl] = await Promise.all([
  generateTrackAudio(song, onProgress, gender),
  uploadVoiceSample(referenceAudio)
]);
```

### 2. Caching

```javascript
// Cache successful clones
const cacheKey = `clone_${songUrl}_${voiceUrl}`;
const cached = localStorage.getItem(cacheKey);
if (cached) return cached;

// After successful clone
localStorage.setItem(cacheKey, clonedUrl);
```

### 3. Progressive Enhancement

```javascript
// Start playing base song while cloning
const baseSongUrl = await generateTrackAudio(...);
setGeneratedAudioUrl(baseSongUrl); // User can listen while waiting

// Clone in background
const clonedUrl = await cloneVoice(...);
setGeneratedAudioUrl(clonedUrl); // Update when ready
```

## Next Steps

1. **Test each endpoint** individually using the diagnostics above
2. **Add comprehensive logging** to track where failures occur
3. **Implement retry logic** for transient failures
4. **Consider alternative services** as backup
5. **Gather user feedback** on cloning quality

## Support & Resources

- **Seed-VC Documentation**: https://huggingface.co/spaces/Plachta/Seed-VC
- **Gradio API Docs**: https://www.gradio.app/guides/getting-started-with-the-python-client
- **Uploadcare Docs**: https://uploadcare.com/docs/
- **Your Vercel Logs**: Check your Vercel dashboard for API errors

---

**Created**: $(date)
**Last Updated**: $(date)
**Status**: Active Development
