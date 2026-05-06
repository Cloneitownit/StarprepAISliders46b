// api/upload-voice.js — Server-side Vercel Blob upload (v95)
//
// Simpler approach: browser sends WAV binary → server uploads to Vercel Blob → returns URL
// A 15-20 sec WAV @ 48kHz mono = ~2MB — well under Vercel's 4.5MB limit
// No client token dance, no CORS issues with blob.vercel-storage.com
//
// IMPORTANT: Set BLOB_READ_WRITE_TOKEN in Vercel environment variables

import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false }, maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Collect raw binary body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    console.log(`📦 Received audio: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Get filename from header or generate one
    const filename = req.headers['x-filename'] || `voices/voice_${Date.now()}.wav`;

    // Upload to Vercel Blob server-side — no CORS issues
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'audio/wav',
    });

    console.log('✅ Uploaded to Vercel Blob:', blob.url);
    return res.status(200).json({ url: blob.url });

  } catch (err) {
    console.error('upload-voice error:', err);
    return res.status(500).json({ error: err.message });
  }
}
