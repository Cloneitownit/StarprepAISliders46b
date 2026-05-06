# StarPrepAI — Setup Guide

## 🚀 Quick Deploy

### 1. Push to GitHub
Upload all files to your GitHub repo (replace existing files).

### 2. Set Vercel Environment Variables
Go to **Vercel → Your Project → Settings → Environment Variables** and add:

| Variable | Required | Get it from |
|----------|----------|-------------|
| `KIE_API_KEY` | ✅ YES | https://kie.ai → Dashboard → API Keys |
| `REPLICATE_API_TOKEN` | ✅ YES | https://replicate.com/account/api-tokens |
| `UPLOADCARE_PUBLIC_KEY` | ✅ YES | https://uploadcare.com → Dashboard → API Keys |
| `UPLOADCARE_SECRET_KEY` | Optional | Same Uploadcare dashboard |

### 3. Redeploy
After adding env vars, click **Redeploy** in Vercel (use "Redeploy with existing build cache" unchecked).

---

## 🔑 Why Environment Variables?

API keys are **no longer hardcoded** in source files. They're read from `process.env.*` at runtime, which means:
- Keys never get committed to GitHub
- Keys survive redeployments
- You set them ONCE in Vercel and forget about it
- No more empty `""` strings breaking everything

---

## 🎤 How Voice Cloning Works

1. User records voice sample → uploaded to **Uploadcare** (public URL)
2. User records 4 words → transcribed by **Replicate Whisper**
3. Words → lyrics via **Kie.ai** lyrics API (with creative fallback)
4. Lyrics → full song via **Kie.ai** music generation (Suno V5)
5. Song + voice sample → **Seed-VC** (HuggingFace) converts vocals to user's voice
6. If Seed-VC fails → **Replicate RVC** fallback (Squidward preset voice)

### ⚠️ CRITICAL: UPLOADCARE_PUBLIC_KEY
Without this, voice samples get saved as data URLs which Seed-VC **cannot access**.
Voice cloning will silently fall back to AI vocals every time.
**This is the #1 reason voice cloning wasn't working before.**

---

## 📁 API Files (all in `/api/`)

| File | Purpose | Env Vars Used |
|------|---------|---------------|
| `upload-audio.js` | Upload audio → get public URL | `UPLOADCARE_PUBLIC_KEY`, `REPLICATE_API_TOKEN` |
| `transcribe.js` | Speech-to-text (Whisper) | `REPLICATE_API_TOKEN` |
| `generate-lyrics.js` | 4 words → full song lyrics | `KIE_API_KEY` |
| `start-song.js` | Start Kie.ai song generation | `KIE_API_KEY` |
| `check-song.js` | Poll for song completion | `KIE_API_KEY` |
| `clone-voice.js` | Voice conversion (Seed-VC + RVC) | `REPLICATE_API_TOKEN` |
| `separate-stems.js` | Split vocals/instrumentals | `REPLICATE_API_TOKEN` |
| `check-training.js` | Legacy (always returns complete) | None |
| `get-upload-config.js` | Check which services are configured | All (read-only check) |

---

## 🧪 Testing

After deploying, visit: `https://your-app.vercel.app/api/get-upload-config`

You should see:
```json
{ "uploadcare": true, "replicate": true, "kie": true }
```

If any are `false`, the corresponding env var is missing.

---

## 💰 Cost Estimate Per Song

| Service | Cost |
|---------|------|
| Kie.ai song generation | ~$0.05-0.10 |
| Replicate Whisper transcription | ~$0.01 |
| Uploadcare file hosting | Free tier (1GB) |
| Seed-VC voice cloning | FREE (HuggingFace) |
| Replicate RVC fallback | ~$0.034 (only if Seed-VC fails) |
| **Total per song** | **~$0.06-0.15** |
