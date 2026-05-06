// api/proxy-audio.js — v3 Audio proxy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  var url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url query parameter is required' });

  var ALLOWED_DOMAINS = [
    // Kie.ai CDN
    'cdn.kie.ai', 'storage.kie.ai', 'kie.ai',
    'cdn1.suno.ai', 'cdn2.suno.ai', 'audio.suno.ai', 'cdn.suno.com', 'suno.com',
    // Replicate outputs
    'replicate.delivery', 'pbxt.replicate.delivery', 'tjzk.replicate.delivery',
    'delivery.replicate.com', 'api.replicate.com',
    // Kie.ai output CDN
    'tempfile.aiquickdraw.com',
    // HuggingFace (kept as fallback)
    'huggingface.co', 'hf.co', 'hf.space',
    'cdn-lfs.huggingface.co', 'cdn-lfs-us-1.huggingface.co',
    // AWS S3 (Replicate stores outputs here)
    'amazonaws.com',
  ];

  var parsedUrl;
  try { parsedUrl = new URL(url); }
  catch (e) { return res.status(400).json({ error: 'Invalid URL' }); }

  var hostname = parsedUrl.hostname;
  var isAllowed = ALLOWED_DOMAINS.some(function(domain) {
    return hostname === domain || hostname.endsWith('.' + domain);
  });

  if (!isAllowed) {
    console.warn('proxy-audio: blocked domain:', hostname);
    return res.status(403).json({ error: 'Domain not allowed: ' + hostname });
  }

  try {
    var fetchHeaders = {};
    if (req.headers.range) fetchHeaders['Range'] = req.headers.range;
    fetchHeaders['User-Agent'] = 'StarPrepAI/1.0';

    // api.replicate.com requires Authorization — without it returns 401
    var isReplicateApi = hostname === 'api.replicate.com' || hostname.endsWith('.api.replicate.com');
    if (isReplicateApi && process.env.REPLICATE_API_TOKEN) {
      fetchHeaders['Authorization'] = 'Bearer ' + process.env.REPLICATE_API_TOKEN;
      console.log('proxy-audio: added Replicate auth for', hostname);
    }

    var audioResponse = await fetch(url, { headers: fetchHeaders });
    if (!audioResponse.ok && audioResponse.status !== 206) {
      return res.status(audioResponse.status).json({
        error: 'Upstream returned ' + audioResponse.status,
      });
    }

    var contentType   = audioResponse.headers.get('content-type')   || 'audio/mpeg';
    var contentLength = audioResponse.headers.get('content-length');
    var acceptRanges  = audioResponse.headers.get('accept-ranges');
    var contentRange  = audioResponse.headers.get('content-range');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (acceptRanges)  res.setHeader('Accept-Ranges', acceptRanges);
    if (contentRange)  res.setHeader('Content-Range', contentRange);

    res.status(audioResponse.status);
    var buffer = await audioResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('proxy-audio fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to proxy audio' });
  }
}
