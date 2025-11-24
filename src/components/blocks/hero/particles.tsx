"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";

export const Particles = () => {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setIsMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Normalize to -1 to 1
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;

      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Parallax transforms for different layers
  const bgX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const bgY = useTransform(mouseY, [-1, 1], [-20, 20]);

  const midX = useTransform(mouseX, [-1, 1], [-40, 40]);
  const midY = useTransform(mouseY, [-1, 1], [-40, 40]);

  const fgX = useTransform(mouseX, [-1, 1], [-70, 70]);
  const fgY = useTransform(mouseY, [-1, 1], [-70, 70]);

  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const random = Math.random();

      // Define layers for depth perception
      let layer: 'bg' | 'mid' | 'fg';
      let sizeRange;
      let opacityRange;
      let blur;
      let durationRange;
      let blendMode = 'normal';

      if (random > 0.8) {
        // Foreground (Bokeh) - Large, blurry, slow, few
        layer = 'fg';
        sizeRange = [8, 16];
        opacityRange = [0.1, 0.25];
        blur = 'blur(3px)';
        durationRange = [30, 45];
        blendMode = 'screen';
      } else if (random > 0.4) {
        // Midground (Embers) - Medium, crisp, standard speed
        layer = 'mid';
        sizeRange = [3, 6];
        opacityRange = [0.4, 0.8];
        blur = 'blur(0.5px)';
        durationRange = [15, 25];
        blendMode = 'screen';
      } else {
        // Background (Dust) - Small, faint, slow, many
        layer = 'bg';
        sizeRange = [1, 3];
        opacityRange = [0.1, 0.4];
        blur = 'blur(0px)';
        durationRange = [40, 60];
      }

      // Color palette refinement
      let colorClass;
      const colorRandom = Math.random();
      if (colorRandom > 0.6) {
        colorClass = "bg-amber-400/80 dark:bg-amber-200/80"; // Gold
      } else if (colorRandom > 0.3) {
        colorClass = "bg-orange-400/80 dark:bg-orange-200/80"; // Orange
      } else {
        colorClass = "bg-rose-400/80 dark:bg-rose-200/80"; // Rose
      }

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
        duration: Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0],
        delay: Math.random() * -20,
        opacity: Math.random() * (opacityRange[1] - opacityRange[0]) + opacityRange[0],
        color: colorClass,
        blur,
        layer,
        blendMode
      };
    });
  }, []);

  const shootingStars = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 10 + 5, // Start after 5-15s
      duration: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 50, // Top half only
    }));
  }, []);

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background Layer */}
      <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0">
        {particles.filter(p => p.layer === 'bg').map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${particle.color}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              filter: particle.blur,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, particle.opacity, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: 0,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      {/* Midground Layer */}
      <motion.div style={{ x: midX, y: midY }} className="absolute inset-0">
        {particles.filter(p => p.layer === 'mid').map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${particle.color}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              filter: particle.blur,
              boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
              mixBlendMode: 'screen'
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, Math.sin(particle.id) * 40, 0],
              opacity: [0, particle.opacity, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: 0,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      {/* Foreground Layer */}
      <motion.div style={{ x: fgX, y: fgY }} className="absolute inset-0">
        {particles.filter(p => p.layer === 'fg').map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${particle.color}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              filter: particle.blur,
              mixBlendMode: 'screen'
            }}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.cos(particle.id) * 60, 0],
              opacity: [0, particle.opacity, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: 0,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      {/* Shooting Stars */}
      {shootingStars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute h-0.5 w-[100px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            rotate: 45,
            filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))",
          }}
          animate={{
            x: [0, 300],
            y: [0, 300],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 15 + 10,
            delay: star.delay,
            ease: "easeIn",
          }}
        />
      ))}

      {/* Enhanced Ambient Glows */}
      <motion.div
        className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[10%] w-[700px] h-[700px] bg-orange-400/10 dark:bg-orange-400/5 rounded-full blur-[140px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default Particles;
