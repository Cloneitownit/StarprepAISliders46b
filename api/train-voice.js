// api/train-voice.js — Train RVC voice model on Replicate (v96)
//
// v96 — Fixed ZIP file naming to match Replicate's exact requirements
//   ✅ Receives Vercel Blob URL (not base64 — no size limit!)
//   ✅ Downloads WAV from Blob, creates ZIP with archiver
//   ✅ ZIP structure: dataset/starprep/split_0.wav (per Replicate/Gemini docs)
//   ✅ Uploads to Replicate Files API via Replicate SDK
//   ✅ Starts training with WEBHOOK so Vercel doesn't time out
//   ✅ Saves prediction to Supabase for status tracking
//   ✅ Webhook at /api/webhooks/replicate pings when training done

import Replicate from 'replicate';
import archiver from 'archiver';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: true, sizeLimit: '1mb' }, maxDuration: 60 };

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('🔔 train-voice v96 invoked:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok', version: 'v96',
      replicateKey: process.env.REPLICATE_API_TOKEN ? 'set' : 'MISSING',
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      blobToken: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'MISSING',
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var body      = req.body || {};
    var audioUrl  = body.audioUrl  || null;  // Vercel Blob URL — the WAV file
    var userId    = body.userId    || 'user_' + Date.now();

    console.log('audioUrl:', audioUrl ? audioUrl.substring(0, 80) : 'NONE');
    console.log('userId:', userId);

    if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN not set' });
    if (!process.env.SUPABASE_URL)        return res.status(500).json({ error: 'SUPABASE_URL not set' });
    if (!audioUrl) return res.status(400).json({ error: 'audioUrl is required — upload audio to Vercel Blob first' });

    // ── Step 1: Download WAV from Vercel Blob ─────────────────────────────
    // Vercel Blob public URLs don't need auth, but we include it just in case
    console.log('📥 Downloading WAV from Vercel Blob...');
    var dlRes = await fetch(audioUrl);
    if (!dlRes.ok) return res.status(400).json({ error: 'Failed to download audio from Blob: ' + dlRes.status });
    var wavArrayBuf = await dlRes.arrayBuffer();
    var wavBuf = Buffer.from(wavArrayBuf);
    console.log('✅ WAV downloaded:', wavBuf.length, 'bytes');

    // Verify RIFF WAV header
    var isWav = wavBuf.length > 4 &&
      wavBuf[0] === 0x52 && wavBuf[1] === 0x49 &&
      wavBuf[2] === 0x46 && wavBuf[3] === 0x46;
    console.log('WAV header:', isWav ? '✅ valid' : '⚠️ not a WAV file');

    // ── Step 2: Create ZIP with correct Replicate structure ───────────────
    // Per Replicate docs: dataset/<rvc_name>/split_<i>.wav
    // Gemini confirmed: files MUST be named split_0.wav, split_1.wav, etc.
    console.log('📦 Creating ZIP: dataset/starprep/split_0.wav ...');

    var zipBuffer = await new Promise(function(resolve, reject) {
      var chunks = [];
      var archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('data', function(chunk) { chunks.push(chunk); });
      archive.on('end', function() { resolve(Buffer.concat(chunks)); });
      archive.on('error', function(err) { reject(err); });
      archive.append(wavBuf, { name: 'dataset/starprep/split_0.wav' });
      archive.finalize();
    });

    console.log('✅ ZIP created:', zipBuffer.length, 'bytes');

    // ── Step 3: Upload ZIP to Replicate Files API ─────────────────────────
    console.log('📤 Uploading ZIP to Replicate Files API...');

    var upload = await replicate.files.create(zipBuffer, {
      filename: 'starprep_dataset_' + userId + '.zip',
      contentType: 'application/zip',
    });

    var datasetZipUrl = upload.urls.get;
    console.log('✅ Uploaded to Replicate Files:', datasetZipUrl.substring(0, 80));

    // ── Step 4: Start RVC training WITH WEBHOOK ───────────────────────────
    // Webhook fires when training is done — Vercel won't time out waiting
    // Replicate calls /api/webhooks/replicate?userId=xxx when complete
    var appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.APP_URL || 'https://starprepai46.vercel.app';

    var webhookUrl = appUrl + '/api/webhooks/replicate?userId=' + encodeURIComponent(userId);
    console.log('🔗 Webhook URL:', webhookUrl);
    console.log('🚀 Starting RVC training...');

    var prediction = await replicate.predictions.create({
      version: '920d08bcf911546897a4bf5a5b78cf0b387a79d74d847cc9523ced6603ac1b90',
      input: {
        dataset_zip: datasetZipUrl,
        sample_rate: '48000',
        version:     'v2',
        f0method:    'rmvpe_gpu',
        epoch:       50,
        batch_size:  '7',
      },
      webhook:               webhookUrl,
      webhook_events_filter: ['completed'],
    });

    console.log('✅ Training started! predictionId:', prediction.id, '| status:', prediction.status);

    // ── Step 5: Save to Supabase so frontend can poll status ──────────────
    var { error: dbErr } = await supabase
      .from('voice_models')
      .upsert({
        user_id:       userId,
        prediction_id: prediction.id,
        status:        'training',
        model_url:     null,
      }, { onConflict: 'user_id' });

    if (dbErr) {
      console.warn('⚠️ Supabase insert failed (non-fatal):', dbErr.message);
    } else {
      console.log('✅ Saved to Supabase');
    }

    return res.status(200).json({
      success:          true,
      predictionId:     prediction.id,
      userId:           userId,
      status:           'training',
      message:          'Voice model training started — Replicate will ping webhook when done (~10 min)',
      estimatedMinutes: 10,
    });

  } catch (err) {
    console.error('❌ train-voice v96 error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error in train-voice' });
  }
}
