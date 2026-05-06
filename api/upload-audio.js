// api/upload-audio.js — Just return base64 (NO external uploads needed)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) {} }
    if (!body) return res.status(400).json({ error: 'Empty request' });

    const audioBase64 = body.audioBase64 || body.audio;
    if (!audioBase64) return res.status(400).json({ error: 'No audio data' });

    const mimeType = body.contentType || body.type || 'audio/webm';
    const name = body.fileName || `audio-${Date.now()}.webm`;
    
    console.log(`📤 Audio: ${name}`);
    console.log('✅ Returning base64 (no upload service needed)');

    // Just return the base64 as a data URL
    // Voice cloning works with this!
    const dataUrl = `data:${mimeType};base64,${audioBase64}`;
    
    return res.status(200).json({
      success: true,
      url: dataUrl,
      hosted: false,
      service: 'base64'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };


