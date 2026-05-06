// api/upload-voice.js — Server-side Supabase Storage upload
//
// Uses Supabase Storage instead of Vercel Blob (FREE!)
// Handles up to 25MB files (3 min @ 48kHz mono WAV ≈ 17MB)
//
// Keys needed: SUPABASE_URL, SUPABASE_ANON_KEY

export const config = { 
  api: { 
    bodyParser: false,
    responseLimit: false,
  }, 
  maxDuration: 60,
  memory: 1024,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase credentials');
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Check content length before reading
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (contentLength > maxSize) {
      console.error(`❌ File too large: ${(contentLength / 1024 / 1024).toFixed(2)}MB > 25MB limit`);
      return res.status(413).json({ 
        error: 'File too large. Please record a shorter sample (under 2 minutes).',
        size: contentLength,
        maxSize 
      });
    }

    // Collect raw binary body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    console.log(`📦 Received audio: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Get filename from header or generate one
    const filename = req.headers['x-filename'] || `voice_${Date.now()}.wav`;
    const storagePath = `voices/${filename}`;

    // Upload to Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/audio/${storagePath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'audio/wav',
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('❌ Supabase upload failed:', uploadRes.status, errorText);
      return res.status(500).json({ 
        error: 'Upload failed: ' + errorText 
      });
    }

    // Get public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audio/${storagePath}`;
    
    console.log('✅ Uploaded to Supabase:', publicUrl);
    return res.status(200).json({ url: publicUrl });

  } catch (err) {
    console.error('upload-voice error:', err);
    return res.status(500).json({ error: err.message });
  }
}
