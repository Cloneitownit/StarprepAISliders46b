// api/check-clone.js — Poll Replicate for RVC voice cloning job status (v1)

export const config = { api: { bodyParser: false }, maxDuration: 30 };

export default async function handler(req, res) {
  console.log('🔔 check-clone v1 invoked:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var jobId = req.query.jobId;

    console.log('Checking clone job:', jobId);

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    var TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!TOKEN) {
      return res.status(500).json({ error: 'REPLICATE_API_TOKEN not set' });
    }

    var pollRes = await fetch('https://api.replicate.com/v1/predictions/' + jobId, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!pollRes.ok) {
      var errText = await pollRes.text();
      console.error('Replicate poll error:', pollRes.status, errText);
      return res.status(200).json({
        status: 'error',
        error: 'Failed to check job status: ' + errText,
      });
    }

    var prediction = await pollRes.json();
    console.log('Prediction status:', prediction.status);

    if (prediction.status === 'succeeded') {
      var audioUrl = null;
      if (prediction.output) {
        if (typeof prediction.output === 'string') {
          audioUrl = prediction.output;
        } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
          audioUrl = prediction.output[0];
        } else if (prediction.output.audio) {
          audioUrl = prediction.output.audio;
        }
      }
      console.log('✅ Clone succeeded, audioUrl:', audioUrl);
      return res.status(200).json({
        status: 'succeeded',
        audioUrl: audioUrl,
        clonedAudioUrl: audioUrl,
      });
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      console.error('❌ Clone failed:', prediction.error);
      return res.status(200).json({
        status: 'failed',
        error: prediction.error || 'Voice cloning failed',
      });
    }

    // Still processing
    return res.status(200).json({
      status: prediction.status,
    });

  } catch (err) {
    console.error('❌ check-clone error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}

