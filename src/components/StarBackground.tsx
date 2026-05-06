import React from "react";

const StarBackground: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        zIndex: 1,
        pointerEvents: "none"
      }}
    >
      {/* Twinkling Stars */}
      {Array.from({ length: 500 }).map((_, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: "absolute",
            width: Math.random() * 3 + 1 + "px",
            height: Math.random() * 3 + 1 + "px",
            backgroundColor: "white",
            borderRadius: "50%",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.8 + 0.2,
            boxShadow: "0 0 2px white",
            animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`
          }}
        />
      ))}
      
      {/* Shooting Stars */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`shoot-${i}`}
          style={{
            position: "absolute",
            width: "3px",
            height: "3px",
            backgroundColor: "white",
            boxShadow: "0 0 8px 3px rgba(255,255,255,0.9)",
            borderRadius: "50%",
            top: Math.random() * 50 + "%",
            left: Math.random() * 100 + "%",
            animation: `shoot ${Math.random() * 3 + 4}s infinite linear`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
      
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes shoot {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-300px, 300px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StarBackground;
