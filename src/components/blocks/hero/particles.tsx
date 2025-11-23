"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

export const Particles = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const random = Math.random();
      let colorClass;
      
      if (random > 0.6) {
        colorClass = "bg-amber-500 dark:bg-amber-200"; // Stronger gold
      } else if (random > 0.3) {
        colorClass = "bg-orange-400 dark:bg-orange-200"; // Stronger orange
      } else {
        colorClass = "bg-rose-400 dark:bg-rose-200"; // Warm rose hint
      }

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2, // 2px to 6px - larger
        duration: Math.random() * 20 + 10, // 10s to 30s
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8 - more visible
        color: colorClass,
      };
    });
  }, []);

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            filter: "blur(0px)", // Removed blur for crispness
            boxShadow: "0 0 4px rgba(251, 191, 36, 0.4)" // Add glow
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, particle.opacity, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Stronger ambient warmth */}
      <motion.div 
        className="absolute top-[20%] left-[15%] w-72 h-72 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-[60px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div 
        className="absolute bottom-[30%] right-[20%] w-96 h-96 bg-orange-400/20 dark:bg-orange-400/10 rounded-full blur-[80px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default Particles;
