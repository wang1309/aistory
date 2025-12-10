"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SimpleFlower = ({ className, color }: { className?: string; color: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="currentColor"
    style={{ color }}
  >
    <g transform="translate(50,50)">
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-25"
          rx="12"
          ry="20"
          transform={`rotate(${angle})`}
          fill="currentColor"
        />
      ))}
      <circle cx="0" cy="0" r="10" fill="white" fillOpacity="0.8" />
    </g>
  </svg>
);

const COLORS = [
  "#FFB7B2", // Soft Pink
  "#FFDAC1", // Peach
  "#E2F0CB", // Mint
  "#B5EAD7", // Pastel Green
  "#C7CEEA", // Periwinkle
  "#FF9AA2", // Salmon Pink
  "#A0E7E5", // Tiffany Blue
  "#FBE7C6", // Pastel Yellow
];

interface Flower {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
  color: string;
  rotation: number;
  swayAmount: number;
}

export default function FloatingFlowers({ count = 40 }: { count?: number }) {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const newFlowers = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // 0-100%
      duration: 10 + Math.random() * 20, // 10-30s duration
      delay: -Math.random() * 30, // Negative delay to ensure distributed start positions
      size: 15 + Math.random() * 20, // 15-35px
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      swayAmount: 20 + Math.random() * 50, // Sway amplitude
    }));
    setFlowers(newFlowers);
  }, [count]);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {flowers.map((flower) => (
        <motion.div
          key={flower.id}
          initial={{ 
            y: "-10vh", 
            x: 0, 
            rotate: flower.rotation, 
            opacity: 0 
          }}
          animate={{
            y: "110vh",
            x: [0, flower.swayAmount, -flower.swayAmount, 0],
            rotate: flower.rotation + 360 + (Math.random() * 180),
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: flower.duration,
            repeat: Infinity,
            delay: flower.delay,
            ease: "linear",
            opacity: {
                times: [0, 0.1, 0.8, 0.95, 1], // Stay visible longer
                duration: flower.duration,
                repeat: Infinity,
                delay: flower.delay,
            },
            x: {
                repeat: Infinity,
                duration: flower.duration / 4, // Sway faster
                ease: "easeInOut",
                repeatType: "mirror",
                delay: flower.delay,
            },
            y: {
                duration: flower.duration,
                repeat: Infinity,
                ease: "linear",
                delay: flower.delay,
            },
            rotate: {
                duration: flower.duration,
                repeat: Infinity,
                ease: "linear",
                delay: flower.delay,
            }
          }}
          className="absolute top-0"
          style={{
            left: `${flower.left}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            color: flower.color,
          }}
        >
          <SimpleFlower color={flower.color} className="w-full h-full drop-shadow-sm opacity-90" />
        </motion.div>
      ))}
    </div>
  );
}
