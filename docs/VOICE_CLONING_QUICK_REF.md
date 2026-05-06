# Voice Cloning Quick Reference Guide

## 🚨 Common Error Messages & Fixes

### "Voice cloning unavailable - using AI vocals"

**What it means**: The Seed-VC service couldn't process your request

**Quick fixes**:
1. Wait 10 seconds and try again (space might be sleeping)
2. Check if your voice sample URL is publicly accessible
3. Verify voice sample is in a compatible format (MP3, WAV, WebM)
4. Check Vercel logs for specific error details

**Long-term solution**: Implement the improved clone-voice.js with retry logic

---

### "Please upload a custom voice sample to proceed with cloning"

**What it means**: No voice sample was found in the expected location

**Quick fixes**:
1. Record a new voice sample in Voice Clone mode
2. Check localStorage: `starprep_voice_sample_url` should have a URL
3. Try uploading a voice file manually instead of using original recording

**Debug command** (browser console):
```javascript
console.log('Voice setup:', {
  complete: localStorage.getItem('starprep_voice_setup_complete'),
  sampleUrl: localStorage.getItem('starprep_voice_sample_url'),
  modelUrl: localStorage.getItem('starprep_voice_model_url'),
  gender: localStorage.getItem('starprep_voice_gender')
});
```

---

### "Original recording not found"

**What it means**: The `audioBlob` from your recording wasn't passed correctly

**Quick fixes**:
1. Switch to "Upload Sample" mode instead of "Use Input"
2. Record your voice again in SongWriter mode
3. Refresh the page and try again

---

### "Failed to upload audio"

**What it means**: Uploadcare upload failed

**Quick fixes**:
1. Check file size (should be under 10MB ideally)
2. Verify Uploadcare public key is configured
3. Check internet connection
4. Try smaller audio file

**Debug** (check upload config):
```bash
curl https://your-app.vercel.app/api/get-upload-config
```

---

### "URL not accessible" / CORS errors

**What it means**: The voice or song URL can't be fetched by Seed-VC

**Quick fixes**:
1. Ensure URLs are HTTPS (not HTTP or data URLs)
2. Check if URLs are publicly accessible (not behind login)
3. Verify Uploadcare URLs don't expire
4. Test URL in browser: should download/play directly

**Test in browser console**:
```javascript
fetch('YOUR_URL', { method: 'HEAD' })
  .then(r => console.log('Accessible:', r.ok))
  .catch(e => console.log('Error:', e));
```

---

## 🔧 Quick Diagnostic Commands

### Check Voice Setup Status
```javascript
// Paste in browser console
const voiceSetup = {
  complete: localStorage.getItem('starprep_voice_setup_complete'),
  sampleUrl: localStorage.getItem('starprep_voice_sample_url'),
  modelUrl: localStorage.getItem('starprep_voice_model_url'),
  gender: localStorage.getItem('starprep_voice_gender')
};
console.table(voiceSetup);
```

### Test Seed-VC Space
```javascript
// Paste in browser console
fetch('https://plachta-seed-vc.hf.space/')
  .then(r => console.log('Space status:', r.status, r.ok ? '✅' : '❌'))
  .catch(e => console.log('❌ Error:', e.message));
```

### Test Your API Endpoint
```bash
# Terminal command
curl -X POST https://your-app.vercel.app/api/clone-voice \
  -H "Content-Type: application/json" \
  -d '{"songUrl":"https://example.com/song.mp3","voiceSampleUrl":"https://example.com/voice.mp3"}'
```

### Monitor Network Requests
```javascript
// Paste in browser console - logs all fetch calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('🌐 Fetching:', args[0]);
  const response = await originalFetch(...args);
  console.log('📥 Response:', response.status, args[0]);
  return response;
};
```

---

## ⚡ Performance Tips

### 1. Pre-warm the Seed-VC Space
```javascript
// In your API or frontend, before cloning
await fetch('https://plachta-seed-vc.hf.space/');
await new Promise(r => setTimeout(r, 3000)); // Wait 3s
// Now proceed with cloning
```

### 2. Compress Voice Samples
```javascript
// Large files take longer to process
// Aim for 1-3 MB max
const targetBitrate = 128; // kbps
// Use audio compression before upload
```

### 3. Cache Successful Clones
```javascript
// After successful clone
const cacheKey = `clone_${songId}_${voiceId}`;
localStorage.setItem(cacheKey, clonedAudioUrl);

// Before cloning, check cache
const cached = localStorage.getItem(cacheKey);
if (cached) return cached;
```

---

## 📊 Success Metrics

### What "Good" Looks Like:
- ✅ Voice setup completes in < 30 seconds
- ✅ Base song generates in 60-90 seconds
- ✅ Voice cloning completes in 30-60 seconds
- ✅ Total time (record → final song) < 3 minutes
- ✅ Success rate > 80%

### What "Bad" Looks Like:
- ❌ Frequent "service unavailable" errors
- ❌ Cloning takes > 2 minutes
- ❌ Voice quality is poor/distorted
- ❌ Success rate < 50%

---

## 🎯 Optimization Checklist

### Before Launch:
- [ ] Test with 10+ different voice samples
- [ ] Test with different audio formats (MP3, WAV, WebM)
- [ ] Test with different file sizes (100KB - 10MB)
- [ ] Test with male and female voices
- [ ] Test fallback to AI vocals works
- [ ] Test error messages are user-friendly
- [ ] Verify Uploadcare quota is sufficient
- [ ] Check Vercel function timeout limits

### Post-Launch Monitoring:
- [ ] Monitor Vercel function logs daily
- [ ] Track success/failure rate
- [ ] Monitor average processing time
- [ ] Collect user feedback on quality
- [ ] Check Uploadcare usage/costs
- [ ] Monitor Seed-VC uptime

---

## 🆘 Emergency Fixes

### If Seed-VC Goes Down:
1. **Immediate**: Update `clone-voice.js` to return original song with clear message
2. **Short-term**: Set up status page to show "Voice cloning temporarily unavailable"
3. **Long-term**: Implement backup service (RVC, ElevenLabs, etc.)

```javascript
// Emergency fallback in clone-voice.js
const SEED_VC_ENABLED = process.env.SEED_VC_ENABLED !== 'false';

if (!SEED_VC_ENABLED) {
  return res.status(200).json({
    success: true,
    clonedAudioUrl: songUrl,
    audioUrl: songUrl,
    note: 'Voice cloning temporarily disabled for maintenance - using AI vocals',
  });
}
```

### If Uploadcare Quota Exceeded:
1. Implement client-side audio compression
2. Set up automatic cleanup of old uploads
3. Consider switching to alternative storage (S3, Cloudflare R2)

### If Processing Times Too Long:
1. Reduce max recording length
2. Implement audio compression
3. Add queue system for batch processing
4. Consider premium tier with faster processing

---

## 📚 Additional Resources

- **Seed-VC Space**: https://huggingface.co/spaces/Plachta/Seed-VC
- **Gradio API Docs**: https://www.gradio.app/guides/querying-gradio-apps-with-curl
- **Uploadcare Docs**: https://uploadcare.com/docs/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

## 🔍 Need More Help?

1. **Check Detailed Guide**: See `VOICE_CLONING_DIAGNOSTIC.md`
2. **Run Tests**: Use `test-voice-cloning.js`
3. **Enable Debug Mode**: Add `?debug=true` to URL
4. **Check Logs**: Vercel dashboard → Functions → Logs
5. **Community**: Ask in Seed-VC discussions on Hugging Face

---

**Last Updated**: $(date)
**Version**: 1.0
