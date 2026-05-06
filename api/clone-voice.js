// api/clone-voice.js — Singing voice conversion via Replicate RVC
// WITH TUNABLE SLIDERS - accepts parameters from frontend
//
// Keys needed: REPLICATE_API_TOKEN

export const config = { api: { bodyParser: { sizeLimit: '10mb' } }, maxDuration: 60 };

export default async function handler(req, res) {
  console.log('🔔 clone-voice (with sliders) invoked:', req.method);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok', 
      version: 'with-sliders',
      replicateKey: process.env.REPLICATE_API_TOKEN ? 'set' : 'MISSING',
    });
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const body = req.body || {};
    const songUrl = body.songUrl || null;
    const trainedModelUrl = body.trainedModelUrl || null;
    
    // TUNABLE PARAMETERS FROM FRONTEND SLIDERS
    // If not provided, use sensible defaults
    const pitchShift = typeof body.pitchShift === 'number' ? body.pitchShift : 0;
    const indexRate = typeof body.indexRate === 'number' ? body.indexRate : 0.75;
    const rmsMixRate = typeof body.rmsMixRate === 'number' ? body.rmsMixRate : 0.2;
    const protect = typeof body.protect === 'number' ? body.protect : 0.3;
    const filterRadius = typeof body.filterRadius === 'number' ? body.filterRadius : 4;
    
    console.log('=================================================');
    console.log('CLONE VOICE — WITH SLIDER CONTROLS');
    console.log('Song URL:', songUrl ? songUrl.substring(0, 80) : 'NONE');
    console.log('Trained model URL:', trainedModelUrl ? trainedModelUrl.substring(0, 80) : 'NONE');
    console.log('--- TUNING SETTINGS ---');
    console.log('Pitch Shift:', pitchShift, 'semitones');
    console.log('Index Rate:', indexRate);
    console.log('RMS Mix Rate:', rmsMixRate);
    console.log('Protect:', protect);
    console.log('Filter Radius:', filterRadius);
    console.log('=================================================');
    
    const TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!TOKEN) {
      return res.status(500).json({ success: false, error: 'REPLICATE_API_TOKEN not set in Vercel' });
    }
    
    if (!songUrl) {
      return res.status(400).json({ success: false, error: 'songUrl is required' });
    }
    
    if (!trainedModelUrl) {
      return res.status(200).json({
        success: false,
        needsTraining: true,
        error: 'No trained voice model found. Please complete voice training first.',
      });
    }
    
    console.log('🎤 Starting RVC inference with custom tuning...');
    
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '0a9c7c558af4c0f20667c1bd1260ce32a2879944a0b9e44e1398660c077b1550',
        input: {
          song_input: songUrl,
          rvc_model: 'CUSTOM',
          custom_rvc_model_download_url: trainedModelUrl,
          custom_rvc_model_download_name: 'custom_voice',
          
          // PITCH — from slider
          pitch_change: 'no-change',
          pitch_change_all: pitchShift,
          pitch_detection_algo: 'rmvpe',
          
          // TUNING — from sliders
          index_rate: indexRate,
          filter_radius: filterRadius,
          rms_mix_rate: rmsMixRate,
          protect: protect,
          
          output_format: 'mp3',
          
          // Volume — unchanged
          main_vocals_volume_change: 0,
          backup_vocals_volume_change: 0,
          instrumental_volume_change: 0,
          
          // Minimal reverb
          reverb_room_size: 0.1,
          reverb_wetness: 0.05,
          reverb_dryness: 0.95,
          reverb_damping: 0.7,
        },
      }),
    });
    
    const startBody = await startRes.text();
    console.log('Replicate response:', startRes.status, startBody.substring(0, 300));
    
    if (!startRes.ok) {
      return res.status(200).json({
        success: false,
        error: 'RVC inference failed to start: ' + startBody,
      });
    }
    
    const prediction = JSON.parse(startBody);
    console.log('✅ RVC inference started | jobId:', prediction.id, '| status:', prediction.status);
    
    if (prediction.status === 'succeeded' && prediction.output) {
      const out = typeof prediction.output === 'string' ? prediction.output : prediction.output[0];
      return res.status(200).json({
        success: true,
        method: 'replicate-rvc',
        status: 'succeeded',
        clonedAudioUrl: out,
        audioUrl: out,
      });
    }
    
    return res.status(200).json({
      success: true,
      method: 'replicate-rvc',
      status: 'started',
      jobId: prediction.id,
    });
    
  } catch (err) {
    console.error('❌ clone-voice error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
}
