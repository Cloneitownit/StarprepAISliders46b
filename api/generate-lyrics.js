// api/generate-lyrics.js — Generate song lyrics from 4 words
// v29 FIX: Added verbose Kie status logging to diagnose why lyrics fall back

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { words, style = 'Pop' } = req.body;
    if (!words) return res.status(400).json({ error: 'Words required' });

    console.log('📝 Lyrics from:', words, '| Style:', style);

    const KIE_API_KEY = process.env.KIE_API_KEY;

    if (KIE_API_KEY) {
      try {
        const result = await generateWithKie(words, style, KIE_API_KEY);
        if (result && result.lyrics && result.lyrics.trim().length > 50) {
          console.log('✅ Kie lyrics generated!');
          return res.status(200).json(result);
        }
        console.log('⚠️ Kie lyrics too short or empty, using fallback');
      } catch (e) { console.log('⚠️ Kie lyrics failed:', e.message); }
    } else {
      console.log('⚠️ No KIE_API_KEY set — skipping Kie, using fallback');
    }

    const { title, lyrics } = generateCreativeLyrics(words, style);
    console.log('✅ Fallback lyrics generated:', title);
    return res.status(200).json({ success: true, lyrics, title, isThemePrompt: false });

  } catch (error) {
    console.error('❌ Lyrics error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

async function generateWithKie(words, style, apiKey) {
  const shortWords = words.length > 80 ? words.substring(0, 80) : words;
  const prompt = `${style} song. Chorus lyrics: "${shortWords}".`;

  console.log('🎵 Calling Kie lyrics API... prompt length:', prompt.length);
  const r = await fetch('https://api.kie.ai/api/v1/lyrics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, callBackUrl: 'https://httpbin.org/post' }),
  });

  const result = await r.json();
  console.log('Kie lyrics create response:', JSON.stringify(result).substring(0, 300));

  if (!r.ok || result.code !== 200) throw new Error(result.msg || 'Kie lyrics create error');

  const taskId = result.data?.taskId;
  if (!taskId) {
    console.log('⚠️ No taskId in Kie lyrics response');
    return null;
  }

  console.log('🎵 Kie lyrics taskId:', taskId, '— polling...');

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const sr = await fetch(`https://api.kie.ai/api/v1/lyrics/record-info?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const s = await sr.json();
    const st = s.data?.status;

    if (i < 5 || i % 10 === 0) {
      console.log(`Kie lyrics poll [${i + 1}/60]: status=${st} | data keys=${Object.keys(s.data || {}).join(',')}`);
    }

    if (s.code === 200 && s.data) {
      if (st === 'SUCCESS' || st === 'TEXT_SUCCESS' || st === 'COMPLETE' || st === 'COMPLETED') {
        // Kie returns response.data as an array of lyric variations
        const responseData = s.data.response?.data;
        const lyrics = (Array.isArray(responseData) && responseData[0]?.text)
          ? responseData[0].text
          : s.data.response?.text || s.data.response?.lyrics || s.data.text || s.data.lyrics;
        const title = (Array.isArray(responseData) && responseData[0]?.title)
          ? responseData[0].title
          : s.data.response?.title || s.data.title || generateTitle(words);
        if (lyrics) {
          console.log('✅ Kie lyrics received, length:', lyrics.length);
          return { success: true, lyrics, title };
        }
        console.log('⚠️ Kie success status but no lyrics. Full data:', JSON.stringify(s.data).substring(0, 500));
      }
      if (st === 'GENERATE_AUDIO_FAILED' || st === 'CREATE_TASK_FAILED' || st === 'FAILED') {
        throw new Error('Kie lyrics generation failed: ' + st);
      }
    }
  }

  console.log('⚠️ Kie lyrics timed out after 60s');
  return null;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }

function generateTitle(words) {
  const wl = words.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (wl.length >= 2) {
    const templates = [
      `${cap(wl[0])} ${cap(wl[1])}`,
      `The ${cap(wl[0])} Song`,
      `${cap(wl[wl.length - 1])} Tonight`,
      `Chasing ${cap(wl[0])}`,
      `${cap(wl[0])} & ${cap(wl[wl.length - 1])}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  return cap(words.split(/\s+/)[0] || 'My') + ' Song';
}

function generateCreativeLyrics(userWords, style) {
  const words = userWords.trim();
  const title = generateTitle(words);

  const templateIndex = Math.floor(Math.random() * 3);
  let lyrics;

  if (templateIndex === 0) {
    lyrics = `[Verse 1]
I've been searching for the right words to say
Something real that won't just fade away
Then it hit me like a melody
${words} — that's what set me free

[Pre-Chorus]
Every time I close my eyes I hear it
A voice inside that says don't fear it

[Chorus]
${words}
That's the sound of everything I feel
${words}
This is more than words, this love is real
Singing out loud, letting the world know
${words} — I won't let you go

[Verse 2]
Used to hide behind a quiet smile
Kept my dreams locked up for a while
But something changed when I found my voice
${words} — now I've made my choice

[Pre-Chorus]
Every time I close my eyes I hear it
A voice inside that says don't fear it

[Chorus]
${words}
That's the sound of everything I feel
${words}
This is more than words, this love is real
Singing out loud, letting the world know
${words} — I won't let you go

[Bridge]
When the spotlight hits and the crowd goes still
I'll stand up tall on that stage and I will
Sing these words like they're all I've got
Give it everything, give my best shot

[Final Chorus]
${words}
That's the anthem playing in my heart
${words}
Knew it from the very start
Singing out loud, letting the world know
${words} — watch me steal the show`;

  } else if (templateIndex === 1) {
    lyrics = `[Verse 1]
Late at night with the stars above
Thinking about what I'm dreaming of
Four little words that changed my fate
${words} — and it feels so great

[Pre-Chorus]
Can you hear it, can you feel the beat?
My heart is racing, won't accept defeat

[Chorus]
Oh-oh-oh, ${words}
Screaming from the rooftops, let 'em hear
Oh-oh-oh, ${words}
This is my moment, this is my year
No more waiting, I'm taking the stage
${words} — I'm turning the page

[Verse 2]
Woke up different, woke up strong
Knew exactly where I belong
With a microphone and a dream so bright
${words} — I was born for this light

[Pre-Chorus]
Can you hear it, can you feel the beat?
My heart is racing, won't accept defeat

[Chorus]
Oh-oh-oh, ${words}
Screaming from the rooftops, let 'em hear
Oh-oh-oh, ${words}
This is my moment, this is my year
No more waiting, I'm taking the stage
${words} — I'm turning the page

[Bridge]
They said I couldn't, said I won't
But here I am and I still don't
Care what they think, I know my truth
${words} — that's all the proof

[Final Chorus]
Oh-oh-oh, ${words}
The whole world's gonna know my name
Oh-oh-oh, ${words}
Nothing's ever gonna be the same
I found my voice, I found my way
${words} — I'm here to stay`;

  } else {
    lyrics = `[Verse 1]
Picture this: a stage, a dream
Brighter than it's ever been
I open my mouth and out comes gold
${words} — a story to be told

[Pre-Chorus]
Feel the rhythm, feel the fire
Every note takes me higher

[Chorus]
${words}, yeah
That's the magic in my soul
${words}, hey
Music making me feel whole
I'm alive, I'm on fire tonight
${words} — everything feels right

[Verse 2]
Started small in my bedroom mirror
Singing soft so no one would hear
But now I'm ready, now I'm free
${words} — the whole world's gonna see

[Pre-Chorus]
Feel the rhythm, feel the fire
Every note takes me higher

[Chorus]
${words}, yeah
That's the magic in my soul
${words}, hey
Music making me feel whole
I'm alive, I'm on fire tonight
${words} — everything feels right

[Bridge]
Take my hand, let's chase the stars
Doesn't matter who we are
When the music plays we come alive
${words} — this is how we thrive

[Final Chorus]
${words}, yeah
That's the magic running through my veins
${words}, hey
Dancing in the spotlight, no more chains
I'm alive, I'm a supernova tonight
${words} — shining oh so bright`;
  }

  return { title, lyrics };
}

export const config = { maxDuration: 300 };
