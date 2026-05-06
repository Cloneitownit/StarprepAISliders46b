// api/get-upload-token.js — Generate client upload token for direct browser uploads
//
// This allows the browser to upload directly to Vercel Blob storage,
// bypassing the 4.5MB serverless function payload limit.
//
// Keys needed: BLOB_READ_WRITE_TOKEN

import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  console.log('🔑 get-upload-token invoked:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload
        console.log('📦 Generating token for:', pathname);
        return {
          allowedContentTypes: ['audio/wav', 'audio/wave', 'audio/x-wav'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('✅ Upload completed:', blob.url);
      },
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Upload token error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate upload token' });
  }
}
