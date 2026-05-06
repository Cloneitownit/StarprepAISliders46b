import React, { useState, useEffect, useRef, useCallback } from "react";

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', lat: 39, lng: -98 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lat: 54, lng: -2 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lat: 56, lng: -106 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', lat: -25, lng: 134 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', lat: -14, lng: -51 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', lat: 36, lng: 138 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', lat: 36, lng: 128 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', lat: 51, lng: 10 },
  { code: 'FR', name: 'France', flag: '🇫🇷', lat: 46, lng: 2 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', lat: 23, lng: -102 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', lat: 10, lng: 8 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', lat: -30, lng: 25 },
  { code: 'IN', name: 'India', flag: '🇮🇳', lat: 21, lng: 78 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', lat: 13, lng: 122 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', lat: 62, lng: 15 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', lat: 42, lng: 12 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', lat: 40, lng: -4 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', lat: 4, lng: -72 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', lat: 0, lng: 38 },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', lat: 18, lng: -77 },
];

function latLngToSphere(lat: number, lng: number, radius: number, rotationDeg: number) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = ((lng + rotationDeg) * Math.PI) / 180;
  const x = radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = -radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);
  return { x, y, z };
}

const getOnlineUsers = () => COUNTRIES.map(c => ({
  ...c,
  onlineCount: Math.floor(Math.random() * 50) + 1,
}));

interface EarthBackgroundProps {
  onFlagClick?: (countryCode: string) => void;
}

const EarthBackground: React.FC<EarthBackgroundProps> = ({ onFlagClick }) => {
  const [showFlags, setShowFlags] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [countriesData] = useState(getOnlineUsers());
  const rotationRef = useRef(0);
  
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const velocity = useRef(0);
  const dragStartX = useRef(0);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const earthImgRef = useRef<HTMLDivElement>(null);

  const earthRadius = 220;

  useEffect(() => {
    let animFrame: number;
    let frameCount = 0;
    const animate = () => {
      if (!isDragging.current) {
        if (Math.abs(velocity.current) > 0.01) {
          velocity.current *= 0.97;
          rotationRef.current = (rotationRef.current + velocity.current) % 360;
        } else {
          velocity.current = 0;
          rotationRef.current = (rotationRef.current + 0.15) % 360;
        }
      }
      if (earthImgRef.current) {
        earthImgRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      frameCount++;
      if (frameCount % 3 === 0) {
        setRotation(rotationRef.current);
      }
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!showFlags) return;
    isDragging.current = true;
    hasDragged.current = false;
    lastMouseX.current = e.clientX;
    dragStartX.current = e.clientX;
    velocity.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [showFlags]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMouseX.current;
    if (Math.abs(e.clientX - dragStartX.current) > 5) {
      hasDragged.current = true;
    }
    velocity.current = deltaX * 0.4;
    rotationRef.current = (rotationRef.current + deltaX * 0.4) % 360;
    setRotation(rotationRef.current);
    lastMouseX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom = (scrollTop + windowHeight) >= (docHeight - 250);
      setShowFlags(nearBottom);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "#000000", zIndex: 0 }} />
      
      {/* ===== STAR MASCOT — BEHIND the earth, peeking above ===== */}
      {/* Just the star with real Ray Bans photo and a smirk. No arms. Clean. */}
      {showFlags && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -82%)",
            width: "320px",
            height: "320px",
            zIndex: 1,  // Behind earth (zIndex 2)
            pointerEvents: "none",
            animation: "mascotFadeIn 1s ease",
          }}
        >
          <svg viewBox="0 0 320 320" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <radialGradient id="starGradient" cx="50%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#FFF0A0" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#DAA520" />
                <stop offset="100%" stopColor="#B8860B" />
              </radialGradient>
              <filter id="starGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 5-pointed star */}
            <polygon
              points="160,10 182,115 290,115 202,170 230,275 160,210 90,275 118,170 30,115 138,115"
              fill="url(#starGradient)"
              filter="url(#starGlow)"
              stroke="#DAA520"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner highlight */}
            <polygon
              points="160,35 178,113 270,113 198,165 222,260 160,205 98,260 122,165 50,113 142,113"
              fill="rgba(255,255,200,0.15)"
            />

            {/* Glowing orbs on point tips */}
            {/* Top */}
            <circle cx="160" cy="8" r="10" fill="#FFD700" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="8" r="5" fill="#FFF8DC" opacity="0.7" />
            {/* Top-right */}
            <circle cx="292" cy="113" r="9" fill="#FFD700" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.55;0.85" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="292" cy="113" r="4" fill="#FFF8DC" opacity="0.6" />
            {/* Bottom-right */}
            <circle cx="232" cy="277" r="9" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.5;0.8" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="232" cy="277" r="4" fill="#FFF8DC" opacity="0.6" />
            {/* Bottom-left */}
            <circle cx="88" cy="277" r="9" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.5;0.8" dur="3.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="88" cy="277" r="4" fill="#FFF8DC" opacity="0.6" />
            {/* Top-left */}
            <circle cx="28" cy="113" r="9" fill="#FFD700" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.55;0.85" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="113" r="4" fill="#FFF8DC" opacity="0.6" />

            {/* Confident smirk */}
            <path d="M 140 195 Q 158 205 172 203 Q 180 201 186 195" fill="none" stroke="#8B6914" strokeWidth="2.5" strokeLinecap="round" />

            {/* ===== RAY-BAN ORIGINAL WAYFARERS — SVG drawn ===== */}
            {/* Dark tortoiseshell frames, green G-15 lenses, wider at top */}
            
            {/* Left lens — trapezoidal, wider top */}
            <path d="M 118,142 Q 118,134 126,134 L 155,134 Q 159,134 159,142 L 159,158 Q 159,166 154,168 L 128,168 Q 118,168 118,160 Z"
              fill="rgba(15,40,15,0.82)" />
            <path d="M 118,142 Q 118,134 126,134 L 155,134 Q 159,134 159,142 L 159,158 Q 159,166 154,168 L 128,168 Q 118,168 118,160 Z"
              fill="none" stroke="#1a0f05" strokeWidth="4" />
            {/* Left lens shine */}
            <ellipse cx="133" cy="145" rx="5" ry="2.5" fill="rgba(255,255,255,0.13)" transform="rotate(-15 133 145)" />
            
            {/* Right lens */}
            <path d="M 161,142 Q 161,134 169,134 L 195,134 Q 202,134 202,142 L 202,158 Q 202,166 197,168 L 171,168 Q 161,168 161,160 Z"
              fill="rgba(15,40,15,0.82)" />
            <path d="M 161,142 Q 161,134 169,134 L 195,134 Q 202,134 202,142 L 202,158 Q 202,166 197,168 L 171,168 Q 161,168 161,160 Z"
              fill="none" stroke="#1a0f05" strokeWidth="4" />
            {/* Right lens shine */}
            <ellipse cx="178" cy="145" rx="5" ry="2.5" fill="rgba(255,255,255,0.13)" transform="rotate(-15 178 145)" />
            
            {/* Bridge — keyhole style */}
            <path d="M 159 148 Q 160 143 161 148" stroke="#1a0f05" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            
            {/* Temple arms — thick, angling back */}
            <path d="M 118 143 L 96 139 Q 85 137 80 140" stroke="#1a0f05" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 202 143 L 224 139 Q 235 137 240 140" stroke="#1a0f05" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            
            {/* Thicker top frame edge — Wayfarer signature */}
            <path d="M 119 136 L 158 134" stroke="#1a0f05" strokeWidth="1.5" opacity="0.5" />
            <path d="M 162 134 L 201 136" stroke="#1a0f05" strokeWidth="1.5" opacity="0.5" />
          </svg>
        </div>
      )}

      {/* Earth + Flags */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%)`,
          width: "500px",
          height: "500px",
          zIndex: 2,
          cursor: showFlags ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
          touchAction: showFlags ? 'none' : 'auto',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={earthImgRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "inset -40px -40px 80px rgba(0,0,0,0.7), 0 0 100px rgba(37, 99, 235, 0.5)",
            opacity: 0.6,
          }}
        />

        {showFlags && COUNTRIES.map((country) => {
          const countryData = countriesData.find(c => c.code === country.code);
          const pos = latLngToSphere(country.lat, country.lng, earthRadius, rotation);
          const isFront = pos.z > 0;
          const depthScale = 0.5 + (pos.z / earthRadius) * 0.5;

          return (
            <button
              key={country.code}
              onClick={(e) => { e.stopPropagation(); if (!hasDragged.current && onFlagClick) onFlagClick(country.code); }}
              style={{
                position: "absolute",
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: `translate(-50%, -100%) scale(${depthScale})`,
                opacity: isFront ? depthScale : 0,
                pointerEvents: isFront ? "auto" : "none",
                transition: "opacity 0.3s ease",
                zIndex: isFront ? 10 : 0,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
              }}
              title={`${country.name} - ${countryData?.onlineCount || 0} online`}
            >
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "2px",
                height: "22px",
                background: "linear-gradient(to top, rgba(255,255,255,0.2), rgba(255,255,255,0.7))",
                borderRadius: "1px",
              }} />
              <div style={{ transform: "translateY(-20px)" }}>
                <span style={{ 
                  fontSize: "22px",
                  display: "block",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                }}>
                  {country.flag}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showFlags && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 3,
            animation: "fadeIn 1s ease",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            borderRadius: "16px",
            padding: "14px 28px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "white",
            fontFamily: "serif",
            margin: "0 0 4px 0",
          }}>
            Connect with{' '}
            <span style={{
              background: "linear-gradient(to right, #ff0080, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>StarPrep Stars</span>
            {' '}around the world
          </p>
          <p style={{ color: "#aaa", fontSize: "11px", margin: 0 }}>
            Grab the earth to spin · Click a flag to connect 🌍
          </p>
        </div>
      )}
      
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            fontSize: `${Math.random() * 18 + 14}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.15 + 0.05,
            animation: `float ${Math.random() * 10 + 15}s infinite ease-in-out`,
            zIndex: 1
          }}
        >
          {['🎵', '🎶', '🎼'][Math.floor(Math.random() * 3)]}
        </div>
      ))}
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(5deg); }
          50% { transform: translate(-15px, -60px) rotate(-5deg); }
          75% { transform: translate(25px, -30px) rotate(3deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes mascotFadeIn {
          from { opacity: 0; transform: translate(-50%, -82%) scale(0.85); }
          to { opacity: 1; transform: translate(-50%, -82%) scale(1); }
        }
      `}</style>
    </>
  );
};

export default EarthBackground;
