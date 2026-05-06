import React, { useRef, useEffect, useCallback } from 'react';

/**
 * StarWarp — Full-screen canvas starfield that goes to WARP SPEED on demand.
 * 
 * Usage:
 *   const warpRef = useRef<{ trigger: () => void }>(null);
 *   <StarWarp ref={warpRef} />
 *   <button onClick={() => warpRef.current?.trigger()}>Go!</button>
 */

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number; // previous z for streak
}

export interface StarWarpHandle {
  trigger: () => void;
}

const STAR_COUNT = 600;
const IDLE_SPEED = 0.3;
const WARP_SPEED = 35;
const WARP_DURATION_MS = 1200;

const StarWarp = React.forwardRef<StarWarpHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const speedRef = useRef(IDLE_SPEED);
  const targetSpeedRef = useRef(IDLE_SPEED);
  const animFrameRef = useRef<number>(0);
  const warpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize stars
  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const z = Math.random() * width;
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z,
        pz: z,
      });
    }
    starsRef.current = stars;
  }, []);

  // Trigger warp
  const trigger = useCallback(() => {
    targetSpeedRef.current = WARP_SPEED;
    if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
    warpTimeoutRef.current = setTimeout(() => {
      targetSpeedRef.current = IDLE_SPEED;
    }, WARP_DURATION_MS);
  }, []);

  // Expose trigger via ref
  React.useImperativeHandle(ref, () => ({ trigger }), [trigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Listen for global warp trigger events from any button
    const handleWarpEvent = () => trigger();
    window.addEventListener('starwarp', handleWarpEvent);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) {
        initStars(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Ease speed toward target
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.08;
      const speed = speedRef.current;
      const isWarping = speed > 2;

      // Trail effect: darken previous frame
      ctx.fillStyle = isWarping ? 'rgba(0, 0, 8, 0.15)' : 'rgba(0, 0, 8, 0.35)';
      ctx.fillRect(0, 0, w, h);

      for (const star of starsRef.current) {
        star.pz = star.z;
        star.z -= speed;

        // Reset star if it passes camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w * 2;
          star.y = (Math.random() - 0.5) * h * 2;
          star.z = w;
          star.pz = w;
        }

        // Project to 2D
        const sx = (star.x / star.z) * cx + cx;
        const sy = (star.y / star.z) * cy + cy;
        const px = (star.x / star.pz) * cx + cx;
        const py = (star.y / star.pz) * cy + cy;

        // Size based on depth
        const size = Math.max(0.5, (1 - star.z / w) * 3);

        if (isWarping) {
          // Draw streak lines during warp
          const brightness = Math.min(1, (1 - star.z / w) * 1.5);
          const hue = 300 + (star.z / w) * 60; // pink to purple gradient
          ctx.strokeStyle = `hsla(${hue}, 100%, 75%, ${brightness})`;
          ctx.lineWidth = size * 0.8;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          // Draw dots during idle
          const brightness = (1 - star.z / w) * 0.8 + 0.2;
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Warp glow overlay at center during warp
      if (isWarping) {
        const glowIntensity = Math.min(0.15, (speed - 2) / WARP_SPEED * 0.15);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
        gradient.addColorStop(0, `rgba(236, 72, 153, ${glowIntensity})`); // neonPink
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${glowIntensity * 0.5})`); // blue
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('starwarp', handleWarpEvent);
      cancelAnimationFrame(animFrameRef.current);
      if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
});

StarWarp.displayName = 'StarWarp';
export default StarWarp;
