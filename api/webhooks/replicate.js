// api/webhooks/replicate.js — Replicate webhook handler (v91)
//
// Replicate calls this URL when RVC training completes.
// We pass ?userId=xxx in the webhook URL so we know which user is done.
//
// Replicate sends a POST with the prediction result:
//   { id, status, output, error, ... }
//
// This handler:
//   1. Reads the prediction result
//   2. Extracts the trained model URL from output
//   3. Updates Supabase voice_models table → status: 'ready', model_url: '...'
//   4. Frontend polling /api/check-training sees 'ready' and saves model URL
//
// IMPORTANT: Always return 200 quickly — Replicate will retry if we don't respond fast

import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: true }, maxDuration: 30 };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('🔔 Replicate webhook received:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var userId     = req.query.userId || null;
    var body       = req.body || {};
    var status     = body.status || '';
    var output     = body.output || null;
    var predId     = body.id || null;
    var errorMsg   = body.error || null;

    console.log('Webhook payload:');
    console.log('  userId:', userId);
    console.log('  predictionId:', predId);
    console.log('  status:', status);
    console.log('  output:', JSON.stringify(output)?.substring(0, 100));
    console.log('  error:', errorMsg);

    if (!userId) {
      console.warn('⚠️ No userId in webhook query — cannot update Supabase');
      return res.status(200).json({ received: true, warning: 'No userId provided' });
    }

    // ── Training succeeded ─────────────────────────────────────────────────
    if (status === 'succeeded') {
      // Extract model URL from output
      // Replicate RVC training returns the model zip URL as output
      var modelUrl = null;
      if (typeof output === 'string') {
        modelUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        modelUrl = output[0];
      } else if (output && typeof output === 'object' && output.url) {
        modelUrl = output.url;
      }

      console.log('✅ Training succeeded! Model URL:', modelUrl ? modelUrl.substring(0, 80) : 'NONE');

      var { error: dbErr } = await supabase
        .from('voice_models')
        .update({ status: 'ready', model_url: modelUrl })
        .eq('user_id', userId);

      if (dbErr) {
        console.error('❌ Supabase update failed:', dbErr.message);
      } else {
        console.log('✅ Supabase updated → status: ready, model_url saved');
      }
    }

    // ── Training failed ────────────────────────────────────────────────────
    else if (status === 'failed' || status === 'canceled') {
      console.error('❌ Training failed:', errorMsg);

      var { error: dbErr2 } = await supabase
        .from('voice_models')
        .update({ status: 'failed' })
        .eq('user_id', userId);

      if (dbErr2) console.error('Supabase update error:', dbErr2.message);
    }

    // Always return 200 quickly so Replicate knows we got it
    return res.status(200).json({ received: true, status });

  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    // Still return 200 — otherwise Replicate keeps retrying
    return res.status(200).json({ received: true, error: err.message });
  }
}
