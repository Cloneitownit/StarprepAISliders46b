// api/upload-voice.js — Upload voice audio to Supabase Storage
//
// Updated to work with new Supabase publishable key format (sb_publishable_...)
// Uses apikey header instead of Bearer token

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('🎤 upload-voice.js invoked (v2 - new key format)');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return res.status(500).json({ 
      error: 'Missing Supabase credentials',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
  }

  console.log('🔑 Key format:', supabaseKey.substring(0, 15) + '...');

  try {
    // Collect raw body chunks
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`📦 Received ${buffer.length} bytes`);

    if (buffer.length < 1000) {
      return res.status(400).json({ error: 'Audio file too small' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `voices/user_${timestamp}_${random}.wav`;

    // Upload to Supabase Storage
    const uploadUrl = `${supabaseUrl}/storage/v1/object/audio/${filename}`;
    console.log(`📤 Uploading to: ${uploadUrl}`);

    // Use apikey header for new sb_publishable_ format
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'audio/wav',
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Supabase upload failed:', uploadResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Supabase upload failed', 
        status: uploadResponse.status,
        details: errorText 
      });
    }

    // Return the public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/audio/${filename}`;
    console.log(`✅ Upload successful: ${publicUrl}`);

    return res.status(200).json({
      success: true,
      audioUrl: publicUrl,
      filename: filename,
    });

  } catch (error) {
    console.error('❌ upload-voice error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
}
