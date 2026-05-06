// api/check-training.js — Check RVC training status from Supabase (v91)
//
// Frontend polls this every 10 seconds.
// Instead of hitting Replicate directly (which was causing issues),
// we now read from Supabase — the webhook already updated it when done.
//
// Returns:
//   { status: 'training', progress: '...' }
//   { status: 'ready', modelUrl: 'https://...' }
//   { status: 'failed', message: '...' }

import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var userId       = req.query.userId       || null;
  var predictionId = req.query.predictionId || null;

  if (!userId && !predictionId) {
    return res.status(400).json({ error: 'userId or predictionId required' });
  }

  try {
    // ── Check Supabase first ───────────────────────────────────────────────
    // Webhook already updated status when Replicate finished
    if (process.env.SUPABASE_URL && userId) {
      var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

      var { data, error } = await supabase
        .from('voice_models')
        .select('status, model_url, prediction_id')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        console.log('Supabase status for', userId, ':', data.status);

        if (data.status === 'ready' && data.model_url) {
          return res.status(200).json({
            status:   'ready',
            modelUrl: data.model_url,
            userId,
          });
        }

        if (data.status === 'failed') {
          return res.status(200).json({
            status:  'error',
            message: 'Voice model training failed. Please try again.',
          });
        }

        // Still training — also check Replicate logs for progress message
        predictionId = predictionId || data.prediction_id;
      }
    }

    // ── Fallback: Poll Replicate directly for progress logs ───────────────
    if (predictionId && process.env.REPLICATE_API_TOKEN) {
      var replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

      try {
        var prediction = await replicate.predictions.get(predictionId);
        console.log('Replicate status:', prediction.status);

        if (prediction.status === 'succeeded') {
          var modelUrl = null;
          if (typeof prediction.output === 'string') modelUrl = prediction.output;
          else if (Array.isArray(prediction.output)) modelUrl = prediction.output[0];
          else if (prediction.output?.url) modelUrl = prediction.output.url;

          // Update Supabase if webhook missed it
          if (modelUrl && userId && process.env.SUPABASE_URL) {
            var supabase2 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            await supabase2.from('voice_models').update({ status: 'ready', model_url: modelUrl }).eq('user_id', userId);
          }

          return res.status(200).json({ status: 'ready', modelUrl, predictionId });
        }

        if (prediction.status === 'failed' || prediction.status === 'canceled') {
          return res.status(200).json({ status: 'error', message: prediction.error || 'Training failed' });
        }

        // Still running — get last log line for progress display
        var logs    = prediction.logs || '';
        var lastLog = logs.split('\n').filter(Boolean).slice(-1)[0] || 'Training in progress...';

        return res.status(200).json({ status: 'training', progress: lastLog, predictionId });

      } catch (repErr) {
        console.warn('Replicate poll error:', repErr.message);
      }
    }

    // Default: still training
    return res.status(200).json({ status: 'training', progress: 'Training in progress...' });

  } catch (err) {
    console.error('check-training error:', err.message);
    return res.status(200).json({ status: 'training', progress: 'Checking status...' });
  }
}
