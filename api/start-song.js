// api/start-song.js — Start AND check Kie.ai song generation (v21 MERGED)
// Merged check-song.js into this file to stay under Vercel's 12 function limit
//
// POST /api/start-song — start generation, returns taskId
// GET  /api/start-song?taskId=xxx — check status, returns audioUrl when ready

const GENRE_STYLES = {
  pop: 'Pop, Catchy Hook, Upbeat, Polished Vocals, Bright Synths, Driving Beat, Emotional, Radio-Ready Production, Crisp Percussion, Layered Harmonies, Backing Vocals, Vocal Ad-libs, Modern Pop, Top 40',
  rock: 'Rock, Electric Guitar Riffs, Driving Drums, Powerful Vocals, Energetic, Raw, Stadium Anthem, Distortion, Power Chords, Dynamic Build, Arena Rock, Guitar Solo, Backing Vocals, Gang Vocals',
  'r&b': 'R&B, Smooth Groove, Soulful Vocals, Neo-Soul, Warm Sub Bass, Sultry, Melodic Runs, Lush Vocal Harmonies, Backing Vocals, Vocal Stacks, Ad-libs, Slow Jam, Intimate, Silk-Smooth Production, 808 Kick, Reverb Vocals, Sensual, Late Night Vibes, Contemporary R&B',
  rnb: 'R&B, Smooth Groove, Soulful Vocals, Neo-Soul, Warm Sub Bass, Sultry, Melodic Runs, Lush Vocal Harmonies, Backing Vocals, Vocal Stacks, Ad-libs, Slow Jam, Intimate, Silk-Smooth Production, 808 Kick, Reverb Vocals, Sensual, Late Night Vibes, Contemporary R&B',
  hiphop: 'Hip-Hop, Trap Beat, 808 Bass, Confident Delivery, Hard-Hitting, Rhythmic Flow, Dark, Atmospheric, Hi-Hats, Snare Rolls, Modern Trap, Bouncy, Ad-libs, Backing Vocals, Vocal Chants',
  'hip-hop': 'Hip-Hop, Trap Beat, 808 Bass, Confident Delivery, Hard-Hitting, Rhythmic Flow, Dark, Atmospheric, Hi-Hats, Snare Rolls, Modern Trap, Bouncy, Ad-libs, Backing Vocals, Vocal Chants',
  rap: 'Rap, Aggressive Flow, 808 Bass, Trap Hi-Hats, Hard-Hitting, Rhythmic, Confident, Street, Fast Bars, Punchy Kick, Ad-libs, Hype Vocals',
  country: 'Country, Acoustic Guitar, Warm Vocals, Storytelling, Twangy, Heartfelt, Nashville Sound, Steel Guitar, Fiddle, Authentic, Americana, Vocal Harmonies, Backing Vocals',
  jazz: 'Jazz, Smooth Jazz, Saxophone Solo, Piano Chords, Walking Bass, Improvisation, Warm, Late Night, Sophisticated, Swing, Brass Section, Vocal Harmonies, Scat Vocals',
  electronic: 'Electronic, EDM, Synthesizer, Drop, Build-Up, Euphoric, Dance, Pulsing Bass, Festival, Side-Chain Compression, Arpeggiator, Vocal Chops, Backing Vocals',
  edm: 'Electronic, EDM, Big Room, Festival, Euphoric Drop, Synthesizer, Dance, High Energy, Build-Up, Bass Drop, Vocal Chops, Backing Vocals',
  soul: 'Soul, Gospel Influence, Powerful Vocals, Emotional, Warm, Organ, Horns, Vintage, Passionate, Motown, Vocal Runs, Rich Arrangement, Backing Vocals, Vocal Harmonies, Call and Response',
  funk: 'Funk, Groovy, Slap Bass, Wah Guitar, Tight Drums, Danceable, Syncopated, Brass Section, Clavinet, Rhythmic, Backing Vocals, Vocal Ad-libs',
  latin: 'Latin, Reggaeton, Tropical, Percussion, Sensual, Rhythmic, Brass, Dance, Passionate, Dembow Beat, Backing Vocals, Vocal Chants',
  indie: 'Indie, Alternative, Dreamy, Lo-Fi, Authentic Vocals, Reverb, Atmospheric, Intimate, Vulnerable, Shoegaze, Layered Vocals, Vocal Harmonies',
  classical: 'Classical, Orchestral, Strings, Piano, Cinematic, Emotional, Grand, Dynamic, Sweeping, Symphony, Choir, Vocal Harmonies',
  blues: 'Blues, Electric Guitar, Soulful, Gritty Vocals, 12-Bar, Expressive, Raw, Emotional Bends, Harmonica, Backing Vocals, Call and Response',
  reggae: 'Reggae, Offbeat, Island Vibes, Warm Bass, Laid Back, Groovy, Positive, Ska Influence, Dub, Backing Vocals, Vocal Harmonies',
  metal: 'Metal, Heavy, Double Bass Drums, Distorted Guitar, Powerful Vocals, Aggressive, Epic, Intense, Breakdown, Gang Vocals, Backing Vocals',
  ballad: 'Ballad, Piano, Emotional, Powerful Vocals, Slow Build, Heartfelt, Orchestral Strings, Intimate, Sweeping Crescendo, Tender, Backing Vocals, Lush Harmonies',
  gospel: 'Gospel, Choir, Uplifting, Powerful Vocals, Organ, Inspirational, Spiritual, Harmonies, Joyful, Call and Response, Backing Vocals, Vocal Stacks',
  disco: 'Disco, Funky, Four-on-the-Floor, Strings, Groovy Bass, Dance, Retro, Shimmering, Euphoric, Studio 54, Backing Vocals, Vocal Harmonies',
};

const GENRE_NEGATIVE_TAGS = {
  pop: 'Heavy Metal, Screaming, Death Growl, Distortion',
  rock: 'Soft, Gentle, Lo-Fi, Whisper',
  'r&b': 'Heavy Metal, Punk, Screaming, Country Twang',
  rnb: 'Heavy Metal, Punk, Screaming, Country Twang',
  hiphop: 'Country, Acoustic, Folk, Classical',
  'hip-hop': 'Country, Acoustic, Folk, Classical',
  rap: 'Country, Folk, Classical, Gentle',
  country: 'EDM, Trap, Distortion, Screaming',
  jazz: 'Heavy Metal, EDM, Screaming, Distortion',
  electronic: 'Acoustic, Country, Folk, Unplugged',
  ballad: 'Fast, Aggressive, Screaming, Trap',
  default: 'Mumbling, Off-Key, Monotone, Low Quality',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KIE_API_KEY = process.env.KIE_API_KEY;
  if (!KIE_API_KEY) {
    return res.status(500).json({ error: 'KIE_API_KEY not configured in Vercel environment variables' });
  }

  // ── GET: Check song status (was check-song.js) ────────────────────────────
  if (req.method === 'GET') {
    try {
      const taskId = req.query.taskId;
      if (!taskId) return res.status(400).json({ error: 'taskId required' });

      const r = await fetch(
        `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
        { headers: { Authorization: `Bearer ${KIE_API_KEY}` } }
      );
      const result = await r.json();

      if (result.code !== 200) {
        return res.status(200).json({ success: true, taskId, status: 'PROCESSING', ready: false });
      }

      const data   = result.data;
      const status = data?.status;

      if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED') {
        return res.status(200).json({
          success: false, taskId, status: 'FAILED', ready: false,
          error: data.errorMessage || 'Generation failed',
        });
      }

      if (status === 'SUCCESS' || status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS') {
        const track    = data.response?.sunoData?.[0] || data.response?.data?.[0];
        const audioUrl = track?.audioUrl || track?.audio_url;
        if (audioUrl) {
          console.log('✅ Song ready:', audioUrl);
          return res.status(200).json({
            success: true, taskId, status: 'SUCCESS', ready: true, audioUrl,
            title:    track.title    || 'StarPrep Song',
            lyrics:   track.prompt   || '',
            duration: track.duration || 60,
            style:    track.tags     || 'Pop',
          });
        }
      }

      return res.status(200).json({ success: true, taskId, status: status || 'PROCESSING', ready: false });

    } catch (error) {
      console.error('❌ check-song error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // ── POST: Start song generation ────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        prompt, lyrics, style = 'Pop', title = 'StarPrep Song',
        instrumental = false, vocalGender = 'f',
      } = req.body;

      if (!prompt && !lyrics) return res.status(400).json({ error: 'Prompt or lyrics required' });

      console.log('🎵 Starting Kie.ai generation...');

      let finalLyrics = (lyrics || prompt || '').substring(0, 4900);

      const isRawUserInput = (finalLyrics.trim().length < 100 && !finalLyrics.includes('[Verse') && !finalLyrics.includes('[Chorus'))
        || finalLyrics.startsWith('Write a creative');

      const useCustomMode = !instrumental;

      if (isRawUserInput) {
        if (!finalLyrics.startsWith('Write a creative')) {
          finalLyrics = `Write a creative ${style} song inspired by the theme: "${finalLyrics.trim()}". Make it a complete, original song with verses, chorus, and bridge.`;
        }
      }

      var genreKey     = (style || 'pop').toLowerCase().replace(/[^a-z&-]/g, '').trim();
      var richStyle    = GENRE_STYLES[genreKey]    || GENRE_STYLES['pop'];
      var negativeTags = GENRE_NEGATIVE_TAGS[genreKey] || GENRE_NEGATIVE_TAGS['default'];

      const genderNorm = (vocalGender || 'f').toLowerCase();
      const isMale     = genderNorm === 'm' || genderNorm === 'male';
      if (!instrumental) {
        if (isMale) {
          richStyle    = 'Male Vocalist, Deep Male Voice, Baritone, ' + richStyle;
          negativeTags = negativeTags + ', Female Vocals, Soprano, High-Pitched Voice';
        } else {
          richStyle    = 'Female Vocalist, ' + richStyle;
          negativeTags = negativeTags + ', Male Vocals, Baritone, Deep Voice';
        }
      }

      const generateBody = {
        model:        'V5',
        customMode:   useCustomMode,
        instrumental,
        style:        richStyle,
        title,
        prompt:       finalLyrics,
        negativeTags,
        styleWeight:  0.85,
        callBackUrl:  'https://httpbin.org/post',
      };
      if (!instrumental && genderNorm) generateBody.vocalGender = genderNorm;

      const r = await fetch('https://api.kie.ai/api/v1/generate', {
        method:  'POST',
        headers: { Authorization: `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(generateBody),
      });

      const result = await r.json();
      console.log('   Response code:', result.code, '| msg:', result.msg);

      if (!r.ok || result.code !== 200) {
        throw new Error(`Kie.ai: ${result.msg || JSON.stringify(result)}`);
      }

      const taskId = result.data?.taskId || result.taskId;
      if (!taskId) throw new Error('No task ID returned from Kie.ai');

      console.log('   ✅ Task started:', taskId);
      return res.status(200).json({ success: true, taskId, status: 'PROCESSING' });

    } catch (error) {
      console.error('❌ start-song error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const config = { maxDuration: 300 };
