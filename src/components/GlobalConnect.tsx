import React, { useState, useEffect, useRef } from 'react';

const COUNTRIES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  BR: 'Brazil', JP: 'Japan', KR: 'South Korea', DE: 'Germany', FR: 'France',
  MX: 'Mexico', NG: 'Nigeria', ZA: 'South Africa', IN: 'India', PH: 'Philippines',
  SE: 'Sweden', IT: 'Italy', ES: 'Spain', CO: 'Colombia', KE: 'Kenya', JM: 'Jamaica',
};

const FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', BR: '🇧🇷', JP: '🇯🇵',
  KR: '🇰🇷', DE: '🇩🇪', FR: '🇫🇷', MX: '🇲🇽', NG: '🇳🇬', ZA: '🇿🇦',
  IN: '🇮🇳', PH: '🇵🇭', SE: '🇸🇪', IT: '🇮🇹', ES: '🇪🇸', CO: '🇨🇴',
  KE: '🇰🇪', JM: '🇯🇲',
};

const SINGER_NAMES = [
  'Luna Star', 'DJ Phoenix', 'Melody Cruz', 'Ace Vocals', 'Nova Beat',
  'Crystal Voice', 'Blaze Harmony', 'Sky Note', 'Rhythm King', 'Velvet Soul',
  'Echo Dream', 'Spark Lyric', 'Storm Singer', 'Jade Tone', 'Flame Artist',
];
const GENRES = ['Pop', 'R&B', 'Hip-Hop', 'Rock', 'Country', 'Soul', 'Jazz', 'Latin', 'K-Pop', 'Afrobeat'];
const AVATARS = ['🎤', '🎵', '🎶', '🎸', '🎹', '🥁', '🎷', '🎺', '🎻', '⭐'];

interface GlobalConnectProps {
  countryCode: string;
  onClose: () => void;
}

const GlobalConnect: React.FC<GlobalConnectProps> = ({ countryCode, onClose }) => {
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('starprep_age_verified') === 'true');
  const [chatMessages, setChatMessages] = useState<{user: string; text: string; time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const countryName = COUNTRIES[countryCode] || countryCode;
  const flag = FLAGS[countryCode] || '🌍';
  const onlineCount = Math.floor(Math.random() * 50) + 5;

  const singers = useRef(
    Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
      id: `${countryCode}-${i}`,
      name: SINGER_NAMES[Math.floor(Math.random() * SINGER_NAMES.length)],
      genre: GENRES[Math.floor(Math.random() * GENRES.length)],
      online: Math.random() > 0.3,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    }))
  ).current;

  // Seed welcome messages
  useEffect(() => {
    if (ageVerified) {
      setChatMessages([
        { user: '🤖 StarBot', text: `Welcome to the ${countryName} room! 🎤 Connect, collab, and create!`, time: now() },
        { user: singers[0]?.name || 'Singer', text: `Hey! Anyone wanna collab on a track? 🎵`, time: now() },
      ]);
    }
  }, [ageVerified, countryName, singers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleAgeVerify = (isOver18: boolean) => {
    if (isOver18) {
      localStorage.setItem('starprep_age_verified', 'true');
      setAgeVerified(true);
    } else {
      onClose();
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { user: 'You', text: chatInput, time: now() }]);
    setChatInput('');
    // Simulated response
    setTimeout(() => {
      const randomSinger = singers[Math.floor(Math.random() * singers.length)];
      const responses = [
        `That's fire! 🔥 Let's make it happen!`,
        `I'm down to collab! What genre you thinking?`,
        `Nice! I just finished a track, wanna hear it?`,
        `Welcome! Where are you from?`,
        `Anyone else working on something right now? 🎤`,
        `Love this community! ⭐`,
      ];
      setChatMessages(prev => [...prev, {
        user: randomSinger?.name || 'Singer',
        text: responses[Math.floor(Math.random() * responses.length)],
        time: now(),
      }]);
    }, 1500 + Math.random() * 2000);
  };

  // Age gate
  if (!ageVerified) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}>
        <div style={{
          background: "#0a0a12", border: "1px solid #333", borderRadius: "16px",
          padding: "32px", maxWidth: "400px", width: "100%", textAlign: "center",
          boxShadow: "0 0 60px rgba(255,0,128,0.2)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h3 style={{ fontSize: "22px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>Age Verification</h3>
          <p style={{ color: "#999", marginBottom: "24px", fontSize: "13px", lineHeight: 1.5 }}>
            StarPrep Connect is a social feature for adults. You must be 18 or older to enter chat rooms and connect with other artists.
          </p>
          <p style={{ color: "white", fontWeight: 600, marginBottom: "24px" }}>Are you 18 years or older?</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button onClick={() => handleAgeVerify(true)} style={{
              padding: "12px 32px", background: "linear-gradient(to right, #22c55e, #059669)",
              color: "white", fontWeight: "bold", borderRadius: "12px", border: "none", cursor: "pointer",
            }}>Yes, I'm 18+</button>
            <button onClick={() => handleAgeVerify(false)} style={{
              padding: "12px 32px", background: "#374151",
              color: "#ccc", fontWeight: "bold", borderRadius: "12px", border: "none", cursor: "pointer",
            }}>No</button>
          </div>
        </div>
      </div>
    );
  }

  // Chat room
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "16px",
        borderBottom: "1px solid #222", background: "rgba(10,10,18,0.9)",
      }}>
        <button onClick={onClose} style={{
          color: "#999", cursor: "pointer", padding: "8px",
          background: "none", border: "none", fontSize: "16px",
        }}>← Back</button>
        <span style={{ fontSize: "30px", marginLeft: "8px" }}>{flag}</span>
        <div style={{ marginLeft: "12px" }}>
          <h3 style={{ color: "white", fontWeight: "bold", fontSize: "18px", margin: 0 }}>{countryName}</h3>
          <p style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600, margin: 0 }}>🟢 {onlineCount} artists online</p>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: "250px", borderRight: "1px solid #222", background: "#07070d",
          overflowY: "auto", flexDirection: "column",
          display: typeof window !== 'undefined' && window.innerWidth > 768 ? "flex" : "none",
        }}>
          <p style={{
            fontSize: "10px", color: "#555", padding: "12px 16px",
            textTransform: "uppercase", fontWeight: "bold",
            letterSpacing: "0.15em", borderBottom: "1px solid #222",
          }}>Artists in Room</p>
          {singers.map(singer => (
            <div key={singer.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer",
            }}>
              <span style={{ fontSize: "18px" }}>{singer.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "white", fontSize: "13px", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{singer.name}</p>
                <p style={{ color: "#555", fontSize: "10px", margin: 0 }}>{singer.genre}</p>
              </div>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: singer.online ? "#22c55e" : "#444",
                boxShadow: singer.online ? "0 0 6px rgba(34,197,94,0.8)" : "none",
              }} />
            </div>
          ))}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.user === 'You' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: "80%", borderRadius: "16px", padding: "8px 16px",
                  background: msg.user === 'You'
                    ? 'linear-gradient(to right, rgba(255,0,128,0.2), rgba(168,85,247,0.2))'
                    : msg.user === '🤖 StarBot'
                    ? 'linear-gradient(to right, rgba(0,243,255,0.15), rgba(59,130,246,0.15))'
                    : 'rgba(255,255,255,0.03)',
                  border: msg.user === 'You' ? '1px solid rgba(255,0,128,0.3)'
                    : msg.user === '🤖 StarBot' ? '1px solid rgba(0,243,255,0.3)' : '1px solid #222',
                }}>
                  <p style={{ fontSize: "10px", color: "#666", fontWeight: "bold", marginBottom: "4px" }}>{msg.user} · {msg.time}</p>
                  <p style={{ fontSize: "14px", color: "white", margin: 0 }}>{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: "16px", borderTop: "1px solid #222", background: "rgba(10,10,18,0.9)" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Say something to the room..."
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid #333", borderRadius: "12px",
                  padding: "12px 16px", color: "white", fontSize: "14px", outline: "none",
                }}
              />
              <button onClick={handleSendChat} style={{
                padding: "12px 24px",
                background: "linear-gradient(to right, #ff0080, #9333ea)",
                color: "white", fontWeight: "bold", borderRadius: "12px",
                border: "none", cursor: "pointer",
                boxShadow: "0 0 20px rgba(255,0,128,0.3)",
              }}>Send 🎤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalConnect;
