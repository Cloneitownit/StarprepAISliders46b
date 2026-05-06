// api/check-song.js — Poll Kie.ai for song generation status
// Uses process.env.KIE_API_KEY (set in Vercel dashboard)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    return res.status(500).json({ error: 'KIE_API_KEY not configured in Vercel environment variables' });
  }

  try {
    const taskId = req.query.taskId || req.body?.taskId;
    if (!taskId) return res.status(400).json({ error: 'taskId required' });

    const r = await fetch(
      `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
      { headers: { Authorization: `Bearer ${KIE_API_KEY}` } }
    );
    const result = await r.json();

    if (result.code !== 200) {
      return res.status(200).json({ success: true, taskId, status: 'PROCESSING', ready: false });
    }

    const data = result.data;
    const status = data?.status;

    // Failure
    if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED') {
      return res.status(200).json({
        success: false, taskId, status: 'FAILED', ready: false,
        error: data.errorMessage || 'Generation failed',
      });
    }

    // Success
    if (status === 'SUCCESS' || status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS') {
      const track = data.response?.sunoData?.[0] || data.response?.data?.[0];
      const audioUrl = track?.audioUrl || track?.audio_url;
      if (audioUrl) {
        console.log('✅ Song ready:', audioUrl);
        return res.status(200).json({
          success: true, taskId, status: 'SUCCESS', ready: true, audioUrl,
          title: track.title || 'StarPrep Song',
          lyrics: track.prompt || '',
          duration: track.duration || 60,
          style: track.tags || 'Pop',
        });
      }
    }

    // Still processing
    return res.status(200).json({ success: true, taskId, status: status || 'PROCESSING', ready: false });
  } catch (error) {
    console.error('❌ check-song error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const config = { maxDuration: 300 };
