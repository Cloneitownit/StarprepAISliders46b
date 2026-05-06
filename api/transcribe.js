// api/transcribe.js — Transcribe audio with Replicate Whisper
// v16 FIX: Use POST /v1/predictions with VERSION HASH (not /v1/models/.../predictions)
//   The /v1/models/{owner}/{name}/predictions endpoint ONLY works for Replicate "official" models.
//   Whisper models are COMMUNITY models — they need the versioned /v1/predictions endpoint.
//   Source: https://replicate.com/docs/topics/models/official-models
// Uses process.env.REPLICATE_API_TOKEN (set in Vercel dashboard)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN not configured' });
  }

  try {
    const { audioUrl, audioBase64 } = req.body;
    if (!audioUrl && !audioBase64) return res.status(400).json({ error: 'audioUrl or audioBase64 required' });

    // Build audio input — prefer hosted URL, fall back to data URI
    let hostedUrl = (audioUrl && !audioUrl.startsWith('data:')) ? audioUrl : null;
    let dataUri = null;
    if (audioBase64) {
      const clean = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, '');
      dataUri = 'data:audio/webm;base64,' + clean;
    }
    if (audioUrl && audioUrl.startsWith('data:')) {
      dataUri = dataUri || audioUrl;
    }

    console.log('🎧 Transcribe v16 — using /v1/predictions with version hashes');
    console.log('   Hosted URL:', hostedUrl ? hostedUrl.substring(0, 80) + '...' : 'none');
    console.log('   Data URI:', dataUri ? Math.round(dataUri.length / 1024) + ' KB' : 'none');

    // ═══════════════════════════════════════════════════════════
    // Models + version hashes (from replicate.com version pages)
    // ═══════════════════════════════════════════════════════════
    const MODELS = [
      {
        name: 'incredibly-fast-whisper',
        version: '3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c',
        makeInput: (audio) => ({ audio, task: 'transcribe', language: 'english', batch_size: 64 }),
      },
      {
        name: 'openai/whisper',
        version: '8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e',
        makeInput: (audio) => ({ audio, model: 'large-v3', language: 'en', translate: false }),
      },
    ];

    // Try each model with hosted URL first, then data URI
    const audioInputs = [];
    if (hostedUrl) audioInputs.push({ label: 'hosted-url', value: hostedUrl });
    if (dataUri) audioInputs.push({ label: 'data-uri', value: dataUri });

    let lastError = '';

    for (const model of MODELS) {
      for (const inp of audioInputs) {
        try {
          console.log('   🔄 ' + model.name + ' + ' + inp.label + '...');
          const text = await runWhisper(model.version, model.makeInput(inp.value), REPLICATE_API_TOKEN, model.name);
          if (text && text.trim().length > 0) {
            console.log('✅ SUCCESS (' + model.name + ' + ' + inp.label + '):', text);
            return res.status(200).json({ success: true, text, words: text, transcription: text });
          }
        } catch (e) {
          lastError = model.name + '+' + inp.label + ': ' + e.message;
          console.warn('   ⚠️ ' + lastError);
        }
      }
    }

    throw new Error('All transcription attempts failed. Last: ' + lastError);
  } catch (error) {
    console.error('❌ Transcribe error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const config = { api: { bodyParser: { sizeLimit: '25mb' } } };

/**
 * POST /v1/predictions with version hash — works for ALL models (community + official)
 */
async function runWhisper(versionHash, input, apiToken, modelName) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiToken,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({ version: versionHash, input }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('HTTP ' + response.status + ': ' + errText.slice(0, 200));
  }

  const prediction = await response.json();
  console.log('   📋 ' + modelName + ': status=' + prediction.status + ' id=' + prediction.id);

  // Sync mode — result already available
  if (prediction.status === 'succeeded' && prediction.output) {
    return extractText(prediction.output);
  }

  // Poll mode
  if (prediction.id && prediction.status !== 'failed') {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const sr = await fetch('https://api.replicate.com/v1/predictions/' + prediction.id, {
        headers: { Authorization: 'Bearer ' + apiToken },
      });
      if (!sr.ok) continue;
      const s = await sr.json();
      if (s.status === 'succeeded') return extractText(s.output);
      if (s.status === 'failed' || s.status === 'canceled') {
        throw new Error(modelName + ' failed: ' + (s.error || '').slice(0, 200));
      }
    }
    throw new Error(modelName + ' timed out');
  }

  if (prediction.status === 'failed') {
    throw new Error(prediction.error || modelName + ' failed');
  }

  throw new Error(modelName + ' no output');
}

function extractText(output) {
  if (typeof output === 'string') return output.trim();
  if (output?.text) return output.text.trim();
  if (output?.transcription) return output.transcription.trim();
  if (Array.isArray(output)) {
    return output.map(s => (typeof s === 'string' ? s : s.text || '')).join(' ').trim() || null;
  }
  if (output?.segments && Array.isArray(output.segments)) {
    return output.segments.map(s => s.text || '').join(' ').trim();
  }
  return null;
}
