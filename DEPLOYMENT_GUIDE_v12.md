# StarPrepAI v12 — Voice Cloning Fix Package

## What Was Broken (3 Bugs)

### Bug 1: Vocals Fall Back to Stock (VoiceSetup.tsx)
`VoiceSetup.tsx` (used inside SongWriterMode) **never saved `starprep_voice_base64`** to localStorage. So when `clone-voice.js` ran, it had NO reference audio → all tiers failed → returned the original AI song with no voice cloning.

### Bug 2: Poor Cloning Quality (VoiceCloneMode.tsx)  
`VoiceCloneMode.tsx` saved voice recordings as raw **webm** base64, but `clone-voice.js` uploaded it to Seed-VC labeled as `reference.wav`. Seed-VC can't properly decode webm data labeled as WAV → garbage output or silent failure.

### Bug 3: HuggingFace Auth Missing (clone-voice.js)
Gradio API calls to HuggingFace Seed-VC spaces had **no authentication headers**. Many HF spaces now require Bearer token auth → uploads/predictions silently fail with 401/403.

---

## What's Fixed

| File | Fix |
|------|-----|
| `src/components/VoiceSetup.tsx` | Now saves WAV base64 to `starprep_voice_base64` in localStorage |
| `src/components/VoiceCloneMode.tsx` | Converts webm→WAV before saving base64 (uses existing `convertBlobToWavBase64`) |
| `api/clone-voice.js` | v12: HF Bearer auth, magic-byte format detection, correct MIME types on uploads |
| `src/services/musicGenService.ts` | Sends `referenceAudioType` to backend, better status messages showing clone method |

---

## Deployment Steps

### 1. Add HF_TOKEN to Vercel Environment Variables (CRITICAL!)

1. Go to https://huggingface.co/settings/tokens
2. Create a new **Read** token (free)
3. Go to your Vercel dashboard → StarPrepAI → Settings → Environment Variables
4. Add: `HF_TOKEN` = `hf_xxxxxxxxxxxxxxxxxxxxx`
5. Click **Save**

### 2. Deploy the Files

**Option A: Replace files manually in your repo**
- Replace these 4 files with the fixed versions:
  - `api/clone-voice.js`
  - `src/components/VoiceSetup.tsx`
  - `src/components/VoiceCloneMode.tsx`
  - `src/services/musicGenService.ts`
- Push to GitHub → Vercel auto-deploys

**Option B: Upload the whole zip**
- Download this zip and extract over your existing project
- Push to GitHub → Vercel auto-deploys

### 3. Re-record Your Voice (One Time)

Because the old voice data was saved in webm format, you need to re-record once:
1. Go to Voice Clone mode
2. Click "Record New Sample" (if you already had one)
3. Record your voice (it now auto-converts to WAV)
4. The new WAV base64 will work correctly with Seed-VC

### 4. Test

1. Go to Song Writer
2. Record your 4 words
3. Toggle "Use Voice Clone" ON
4. Click Generate
5. Watch the status messages — you should see "Voice cloned with Seed-VC! 🎤"
6. Check Vercel Function Logs for detailed diagnostics

---

## Environment Variables Checklist

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `KIE_API_KEY` | ✅ Yes | Song generation via Kie.ai |
| `REPLICATE_API_TOKEN` | ✅ Yes | Stem separation (Demucs) + RVC fallback |
| `HF_TOKEN` | ⭐ Strongly recommended | Seed-VC voice cloning via HuggingFace |
| `ANTHROPIC_API_KEY` | ✅ Yes | Lyrics generation via Claude |

---

## Diagnostic Log Guide

In Vercel Function Logs, look for:
- `🎤 VOICE CLONE REQUEST (v12)` — Confirms new version is deployed
- `HF_TOKEN: SET (hf_xxxxx...)` — Confirms auth token is configured
- `Reference from base64: XXXXX bytes | Detected format: audio/wav` — Confirms WAV format
- `✅ TIER 2 SUCCESS` — Seed-VC worked!
- `🔑 HINT: Set HF_TOKEN` — Means auth is needed but missing
