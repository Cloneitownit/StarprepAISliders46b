import React, { useState } from 'react';

const LyricComposerMode: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('happy');
  const [genre, setGenre] = useState('pop');
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState('');

  const moods = [
    { id: 'happy', label: '😊 Happy', color: 'bg-yellow-500' },
    { id: 'sad', label: '😢 Sad', color: 'bg-blue-500' },
    { id: 'love', label: '❤️ Love', color: 'bg-pink-500' },
    { id: 'angry', label: '😤 Angry', color: 'bg-red-500' },
    { id: 'chill', label: '😎 Chill', color: 'bg-green-500' },
    { id: 'hype', label: '🔥 Hype', color: 'bg-orange-500' },
  ];

  const genres = [
    { id: 'pop', label: '🎤 Pop' },
    { id: 'rnb', label: '🎵 R&B' },
    { id: 'hiphop', label: '🎧 Hip-Hop' },
    { id: 'rock', label: '🎸 Rock' },
    { id: 'country', label: '🤠 Country' },
    { id: 'ballad', label: '🎹 Ballad' },
  ];

  const generateLyrics = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic for your song!');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: topic,
          style: `${genre} ${mood}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLyrics(data.lyrics || 'Failed to generate lyrics');
        setTitle(data.title || 'Untitled');
      } else {
        // Fallback to local generation
        generateLocalLyrics();
      }
    } catch (error) {
      console.error('Error generating lyrics:', error);
      generateLocalLyrics();
    }

    setIsGenerating(false);
  };

  const generateLocalLyrics = () => {
    const moodWords = {
      happy: ['sunshine', 'smile', 'dancing', 'joy', 'bright'],
      sad: ['tears', 'rain', 'lonely', 'missing', 'gone'],
      love: ['heart', 'forever', 'together', 'yours', 'soul'],
      angry: ['fire', 'storm', 'break', 'fight', 'strong'],
      chill: ['waves', 'breeze', 'easy', 'flow', 'smooth'],
      hype: ['rise', 'top', 'unstoppable', 'winning', 'legend'],
    };

    const words = moodWords[mood as keyof typeof moodWords] || moodWords.happy;
    const randomWord = () => words[Math.floor(Math.random() * words.length)];

    const generatedLyrics = `[Verse 1]
${topic}, it's all I think about
With ${randomWord()} in my heart, there is no doubt
Every moment feels so ${randomWord()} and true
All because I'm thinking of ${topic} and you

[Chorus]
${topic}, ${topic}
You're the ${randomWord()} in my sky
${topic}, ${topic}
With you I feel so ${randomWord()} and high

[Verse 2]
Walking through this life with ${randomWord()} ahead
Every word you say stays in my head
${topic} keeps me going every day
Nothing's gonna take this ${randomWord()} away

[Chorus]
${topic}, ${topic}
You're the ${randomWord()} in my sky
${topic}, ${topic}
With you I feel so ${randomWord()} and high

[Bridge]
Can you feel it? Can you see?
${topic} means everything to me
Let the ${randomWord()} take control
You've captured my ${randomWord()} and my soul

[Outro]
${topic}... forever in my heart
${topic}... this is just the start`;

    setTitle(topic.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    setLyrics(generatedLyrics);
  };

  const copyLyrics = () => {
    navigator.clipboard.writeText(lyrics);
    alert('Lyrics copied to clipboard!');
  };

  const downloadLyrics = () => {
    const content = `${title}\n\n${lyrics}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_lyrics.txt`;
    a.click();
  };

  const resetComposer = () => {
    setLyrics('');
    setTitle('');
    setTopic('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          ✍️ Lyric Composer
        </h1>
        <p className="text-gray-300">
          Tell us your topic and we'll write you a hit song!
        </p>
      </div>

      {!lyrics ? (
        <div className="space-y-6">
          {/* Topic Input */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
            <label className="block text-lg font-bold text-purple-400 mb-3">
              📝 What's your song about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., summer love, my dog can't swim, chasing dreams..."
              className="w-full bg-black/40 border border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Mood Selection */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
            <label className="block text-lg font-bold text-purple-400 mb-3">
              🎭 Pick your mood
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`p-3 rounded-xl transition-all ${
                    mood === m.id
                      ? `${m.color} text-white scale-105`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Selection */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
            <label className="block text-lg font-bold text-purple-400 mb-3">
              🎵 Choose your genre
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`p-3 rounded-xl transition-all ${
                    genre === g.id
                      ? 'bg-purple-500 text-white scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={generateLyrics}
              disabled={isGenerating || !topic.trim()}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl hover:scale-105 transition transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">✨</span> Composing...
                </span>
              ) : (
                '✨ Compose My Song!'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-purple-400">🎵 {title}</h2>
            <p className="text-gray-400 mt-2">
              {genre.toUpperCase()} • {mood.toUpperCase()}
            </p>
          </div>

          {/* Lyrics Display */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
            <pre className="whitespace-pre-wrap text-gray-200 font-sans text-lg leading-relaxed">
              {lyrics}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={copyLyrics}
              className="px-6 py-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition flex items-center gap-2"
            >
              📋 Copy
            </button>
            <button
              onClick={downloadLyrics}
              className="px-6 py-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition flex items-center gap-2"
            >
              💾 Download
            </button>
            <button
              onClick={resetComposer}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition transform flex items-center gap-2"
            >
              ✨ New Song
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyricComposerMode;
