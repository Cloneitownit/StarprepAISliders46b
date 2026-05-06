// api/separate-stems.js — v2 START ONLY (poll via check-stems.js)
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { audioUrl } = req.body;
  if (!audioUrl) return res.status(400).json({ error: 'audioUrl is required' });

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN not configured' });

  try {
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953',
        input: {
          audio: audioUrl,
          model: 'htdemucs_6s',
          two_stems: 'vocals',
          output_format: 'mp3',
          mp3_bitrate: 320,
          segment: 12,
          overlap: 0.25,
          shifts: 1,
          clip_mode: 'rescale',
          float32: false,
        },
      }),
    });

    if (!startResponse.ok) {
      const errText = await startResponse.text();
      console.error('Replicate start error:', errText);
      return res.status(500).json({ error: 'Failed to start stem separation', details: errText });
    }

    const result = await startResponse.json();
    console.log('Demucs started — status:', result.status, '| id:', result.id);

    if (!result.id) {
      return res.status(500).json({ error: 'No prediction ID returned', details: result });
    }

    // If Replicate returned instantly (rare), send full result now
    if (result.status === 'succeeded') {
      const parsed = parseOutput(result.output);
      return res.status(200).json({ success: true, predictionId: result.id, status: 'succeeded', ...parsed });
    }

    // Normal case — return predictionId for polling via check-stems
    return res.status(200).json({ success: true, predictionId: result.id, status: 'started' });

  } catch (err) {
    console.error('separate-stems error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

function parseOutput(output) {
  if (!output) throw new Error('No output from Demucs');
  let vocalsUrl = null, instrumentalUrl = null, bassUrl = null, drumsUrl = null, otherUrl = null;

  if (Array.isArray(output)) {
    vocalsUrl       = output.find(u => typeof u === 'string' && u.includes('vocals') && !u.includes('no_vocals')) ?? null;
    instrumentalUrl = output.find(u => typeof u === 'string' && u.includes('no_vocals')) ?? null;
    if (!instrumentalUrl) instrumentalUrl = output.find(u => typeof u === 'string' && !u.includes('vocals')) ?? output[1] ?? output[0];
  } else if (typeof output === 'object') {
    vocalsUrl       = output.vocals    || null;
    instrumentalUrl = output.no_vocals || null;
    bassUrl         = output.bass      || null;
    drumsUrl        = output.drums     || null;
    otherUrl        = output.other     || null;
    if (!instrumentalUrl) instrumentalUrl = otherUrl || bassUrl || drumsUrl || null;
  }

  return { vocalsUrl, instrumentalUrl, bassUrl: bassUrl||null, drumsUrl: drumsUrl||null, otherUrl: otherUrl||null };
}
