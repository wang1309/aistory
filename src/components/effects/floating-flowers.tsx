"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PETAL_PATHS = [
  "M20 2C24 8 38 14 36 24C34 32 26 38 20 38C14 38 6 32 4 24C2 14 16 8 20 2Z",
  "M20 0C26 8 34 18 32 34C30 46 22 50 20 50C18 50 10 46 8 34C6 18 14 8 20 0Z",
  "M18 2C28 4 34 14 34 26C34 36 26 42 18 42C10 42 2 36 2 26C2 14 8 4 18 2Z",
];

const COLORS = [
  "oklch(0.85 0.06 350)",
  "oklch(0.87 0.05 25)",
  "oklch(0.88 0.04 330)",
  "oklch(0.86 0.06 10)",
  "oklch(0.90 0.03 350)",
  "oklch(0.85 0.05 340)",
];

const LAYERS = [
  { sizeMin: 8, sizeMax: 14, durMin: 22, durMax: 32, opacity: 0.25 },
  { sizeMin: 13, sizeMax: 22, durMin: 15, durMax: 24, opacity: 0.45 },
  { sizeMin: 18, sizeMax: 28, durMin: 10, durMax: 17, opacity: 0.65 },
];

const RADIUS = 140;
const FORCE = 30;
const LERP_IN = 0.07;
const DECAY = 0.93;

interface Petal {
  id: number;
  left: number;
  fallDur: number;
  delay: number;
  size: number;
  color: string;
  rot0: number;
  spinDur: number;
  swayX: number;
  swayDur: number;
  shape: number;
  layer: number;
}

export default function FloatingFlowers({ count = 24 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [show, setShow] = useState(false);
  const wrapRefs = useRef(new Map<number, HTMLDivElement>());
  const mouse = useRef({ x: -9999, y: -9999 });
  const offsets = useRef(new Map<number, { x: number; y: number }>());

  const setRef = useCallback(
    (id: number) => (el: HTMLDivElement | null) => {
      if (el) wrapRefs.current.set(id, el);
      else wrapRefs.current.delete(id);
    },
    [],
  );

  // Generate petals
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const r = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    setPetals(
      Array.from({ length: count }, (_, i) => {
        const layer = i % 3;
        const c = LAYERS[layer];
        return {
          id: i,
          left: r(0, 100),
          fallDur: r(c.durMin, c.durMax),
          delay: -r(0, 30),
          size: r(c.sizeMin, c.sizeMax),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rot0: r(0, 360),
          spinDur: r(6, 14),
          swayX: r(12, 45),
          swayDur: r(3, 6),
          shape: Math.floor(Math.random() * 3),
          layer,
        };
      }),
    );
    requestAnimationFrame(() => setShow(true));
  }, [count]);

  // Mouse / touch interaction
  useEffect(() => {
    if (!show || petals.length === 0) return;

    const onMove = (x: number, y: number) => {
      mouse.current = { x, y };
    };

    const handleMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    let raf: number;

    const tick = () => {
      const { x: mx, y: my } = mouse.current;

      // Batch reads
      const rects = new Map<number, DOMRect>();
      wrapRefs.current.forEach((el, id) => {
        rects.set(id, el.getBoundingClientRect());
      });

      // Calculate offsets + write
      wrapRefs.current.forEach((el, id) => {
        const rect = rects.get(id);
        if (!rect || rect.width === 0) return;

        const px = rect.left + rect.width / 2;
        const py = rect.top + rect.height / 2;
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let cur = offsets.current.get(id) || { x: 0, y: 0 };

        if (dist < RADIUS && dist > 1) {
          const f = (1 - dist / RADIUS) * FORCE;
          const tx = (dx / dist) * f;
          const ty = (dy / dist) * f;
          cur = {
            x: cur.x + (tx - cur.x) * LERP_IN,
            y: cur.y + (ty - cur.y) * LERP_IN,
          };
        } else {
          cur = { x: cur.x * DECAY, y: cur.y * DECAY };
          if (Math.abs(cur.x) < 0.1 && Math.abs(cur.y) < 0.1) {
            cur = { x: 0, y: 0 };
          }
        }

        offsets.current.set(id, cur);
        el.style.transform = `translate(${cur.x}px,${cur.y}px)`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(raf);
    };
  }, [show, petals]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <style>{`
        @keyframes pf {
          0%   { transform:translateY(-10vh);opacity:0 }
          8%   { opacity:var(--po,.5) }
          88%  { opacity:var(--po,.5) }
          100% { transform:translateY(110vh);opacity:0 }
        }
        @keyframes ps {
          0%,100% { transform:translate(0,0) }
          30%     { transform:translate(calc(var(--sx)*.7),-6px) }
          70%     { transform:translate(calc(var(--sx)*-.9),4px) }
        }
        @keyframes pr { to { rotate:360deg } }
      `}</style>

      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            animation: `pf ${p.fallDur}s linear ${p.delay}s infinite`,
            "--po": LAYERS[p.layer].opacity,
          } as React.CSSProperties}
        >
          <div ref={setRef(p.id)} style={{ willChange: "transform" }}>
            <div
              style={{
                animation: `ps ${p.swayDur}s ease-in-out ${p.delay}s infinite`,
                "--sx": `${p.swayX}px`,
              } as React.CSSProperties}
            >
              <div
                style={{
                  animation: `pr ${p.spinDur}s linear ${p.delay}s infinite`,
                  width: p.size,
                  height: p.size,
                }}
              >
                <svg
                  viewBox="0 0 40 50"
                  fill="currentColor"
                  className="w-full h-full"
                  style={{ color: p.color, transform: `rotate(${p.rot0}deg)` }}
                >
                  <path d={PETAL_PATHS[p.shape]} />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
