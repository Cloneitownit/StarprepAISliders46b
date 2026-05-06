# StarPrepAI v13 — Complete Fix Package

## Files Changed (replace these in your project)

### API Endpoints (drop into `/api/`)
| File | What Was Wrong | What's Fixed |
|------|---------------|-------------|
| `api/transcribe.js` | Used deprecated versioned Whisper hash (`3ab86df6...`). Broke when Replicate updated the model. | Uses model-based endpoint (`/v1/models/.../predictions`). Adds fallback to `openai/whisper` if fast-whisper fails. Better base64 handling. |
| `api/generate-lyrics.js` | Fallback lyrics were a generic hardcoded template that barely used the user's 4 words. Same boring song every time. | User's exact 4 words are now the **chorus hook** — they appear in every chorus. 3 different templates rotate randomly so songs aren't identical. |
| `api/separate-stems.js` | When Demucs returned 4 stems (drums, bass, vocals, other), it used the **original song** as "instrumental" — meaning AI vocals bled through into the final mix. | Returns individual stem URLs (drums, bass, other) so the frontend can mix them into a **clean instrumental** without AI vocal bleed. |

### Frontend Services (drop into `/src/services/`)
| File | What Was Wrong | What's Fixed |
|------|---------------|-------------|
| `src/services/musicGenService.ts` | Only mixed 2 tracks (vocals + instrumental). When stems came back as 4 separate URLs, used the vocal-contaminated original as instrumental. | New `mixStemsTogether()` function properly combines drums + bass + other + cloned vocals via Web Audio API. Clean instrumental, no AI vocal bleed. |
| `src/services/claudeService.ts` | Didn't save lyrics/song URL for JudgeMode. | Saves lyrics, title, and detected words to localStorage so the Judge knows what song the user should be singing. |

### Frontend Components (drop into `/src/components/`)
| File | What Was Wrong | What's Fixed |
|------|---------------|-------------|
| `src/components/JudgeMode.tsx` | **Completely fake**. Scores were `Math.random()` — no AI analysis at all. "Golden Ticket" at 90%. | **Real AI analysis**: Transcribes what user actually sang via Whisper, compares to reference lyrics, analyzes audio energy/dynamics. **Silver Ticket at 95%**. Shows what the AI heard. Plays reference song. |
| `src/components/SongWriterMode.tsx` | Didn't persist audio URL for Judge. | Saves generated audio URL and lyrics to localStorage after generation. |

---

## Root Causes of Ron's Issues

### "Voice cloning returns crappy voice with no music"
**Cause**: When Demucs split the song into 4 stems (drums, bass, vocals, other), the code used the ORIGINAL full song as the "instrumental" track. This meant the AI singer's voice was still in the instrumental, so when the cloned voice was mixed back in, you got TWO voices fighting each other = crappy sound.

**Fix**: The stem separator now returns individual stem URLs. The frontend downloads drums, bass, and other stems separately and mixes them with the cloned vocals using Web Audio API. No more AI vocal bleed.

### "Words are always the same / stock words"
**Cause**: When Kie.ai lyrics API failed (network timeout, rate limit, etc.), the fallback `generateCreativeLyrics()` produced the same generic template every time. The user's 4 words were buried in filler.

**Fix**: The user's exact 4 words now appear as the **chorus hook** in every chorus (the most repeated part of the song). Three different template structures rotate randomly.

### "Transcription broke after cloning fix"
**Cause**: `transcribe.js` used a hardcoded version hash (`vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c`). This versioned endpoint broke when Replicate updated or deprecated that specific version.

**Fix**: Now uses the model-based endpoint (`/v1/models/vaibhavs10/incredibly-fast-whisper/predictions`) which always points to the latest version. Added `openai/whisper` as a fallback.

### "Judge gives random scores, no real analysis"
**Cause**: `analyzePerformance()` was literally `setTimeout(3000)` + `Math.random()`. Zero AI involvement. The threshold was "Golden Ticket" at 90%.

**Fix**: Now sends the recording to Whisper for real transcription, compares detected words to reference lyrics, analyzes audio energy consistency (proxy for pitch control), dynamic range (expression), and activity ratio (timing). **Silver Ticket** at **95%**.

---

## How to Deploy

1. Replace the 7 files listed above in your project
2. `git add . && git commit -m "v13 complete fix"`  
3. Push to Vercel: `git push`
4. Verify these env vars are set in Vercel:
   - `REPLICATE_API_TOKEN` (required for transcription + stem separation)
   - `KIE_API_KEY` (required for song generation)
   - `HF_TOKEN` (required for Seed-VC voice cloning)

No new dependencies. No new env vars. Just drop in the files and deploy.
