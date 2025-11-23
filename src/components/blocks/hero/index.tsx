"use client";

import { memo, useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import Particles from "./particles";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";

import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

// Lazy load Prism component (client-side only for WebGL)
const Prism = dynamic(() => import("@/components/Prism"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background opacity-50" />
  ),
});

const Hero = memo(function Hero({ hero }: { hero: HeroType }) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { texts, highlightText } = useMemo(() => {
    const highlightText = hero.highlight_text;
    let texts = null;
    if (highlightText) {
      texts = hero.title?.split(highlightText, 2);
    }
    return { texts, highlightText };
  }, [hero.title, hero.highlight_text]);

  const descriptionHtml = useMemo(
    () => ({ __html: hero.description || "" }),
    [hero.description]
  );

  const prismProps = useMemo(
    () => ({
      animationType: hero.prism_background?.animationType || "rotate",
      timeScale: hero.prism_background?.timeScale ?? 0.5,
      height: hero.prism_background?.height ?? 3.5,
      baseWidth: hero.prism_background?.baseWidth ?? 5.5,
      scale: hero.prism_background?.scale ?? 3.6,
      hueShift: hero.prism_background?.hueShift ?? 0,
      colorFrequency: hero.prism_background?.colorFrequency ?? 1,
      noise: hero.prism_background?.noise ?? 0.5,
      glow: hero.prism_background?.glow ?? 1,
      bloom: hero.prism_background?.bloom ?? 1,
      suspendWhenOffscreen: true,
    }),
    [hero.prism_background]
  );

  if (hero.disabled) {
    return null;
  }

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[92vh] flex items-center justify-center py-24 lg:py-32 overflow-hidden"
    >
      {/* Background System */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {hero.prism_background?.enabled && isMounted ? (
          <>
            <div className="absolute inset-0 opacity-70">
              <Prism {...prismProps} />
            </div>
            <div className="absolute inset-0 bg-gradient-radial from-background/20 via-background/40 to-background/80" />
          </>
        ) : (
          <>
            {/* Standard Ethereal Tech Background */}
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05]" />
            <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
            
            {/* Aurora Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40 animate-blob" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[128px] opacity-30 animate-blob animation-delay-2000" />
            
            {/* Floating Particles */}
            <Particles />
          </>
        )}
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Badge */}
        {hero.show_badge && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-12"
          >
            <img
              src="/imgs/badges/phdaily.svg"
              alt="phdaily"
              className="h-12 object-cover transition-transform duration-300 hover:scale-110"
            />
          </motion.div>
        )}

        <div className="text-center flex flex-col items-center">
          {/* Announcement */}
          {hero.announcement.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                href={hero.announcement.url as any}
                className="group relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 md:py-2 text-sm font-medium transition-all hover:bg-muted/50"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-background/50 px-4 py-1.5 backdrop-blur-xl">
                  {hero.announcement.label && (
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20">
                      {hero.announcement.label}
                    </Badge>
                  )}
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                    {hero.announcement.title}
                  </span>
                  <Icon name="arrow-right" className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 max-w-5xl"
          >
            {texts && texts.length > 1 ? (
              <h1 className="text-balance text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block text-foreground">{texts[0]}</span>
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent pb-2">
                  {highlightText}
                </span>
                <span className="block text-foreground">{texts[1]}</span>
              </h1>
            ) : (
              <h1 className="text-balance text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl text-foreground">
                {hero.title}
              </h1>
            )}
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 max-w-3xl"
          >
            <p
              className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed font-light text-balance"
              dangerouslySetInnerHTML={descriptionHtml}
            />
          </motion.div>

          {/* Buttons */}
          {hero.buttons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              {hero.buttons.map((item, i) => {
                const isPrimary = item.variant === 'default' || i === 0;
                return (
                  <Link
                    key={i}
                    href={item.url as any}
                    target={item.target || ""}
                    className="group relative"
                  >
                    {isPrimary ? (
                      <Button
                        size="lg"
                        className="relative h-16 sm:h-20 rounded-full px-10 text-lg font-bold 
                          bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 
                          bg-[length:200%_auto] animate-gradient 
                          text-white 
                          shadow-[0_8px_32px_-8px_rgba(79,70,229,0.4)] 
                          hover:shadow-[0_16px_48px_-12px_rgba(79,70,229,0.6)] 
                          hover:scale-[1.02] active:scale-[0.98] 
                          border border-white/10 overflow-hidden
                          transition-all duration-500 group/btn"
                      >
                         {/* Deep Space Noise Texture */}
                         <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay pointer-events-none" />
                         
                         {/* Glass Gloss Top Highlight */}
                         <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
                         
                         {/* Dynamic Shimmer Effect */}
                         <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" />

                        <span className="relative flex items-center gap-3 z-10">
                          {item.icon && (
                            <div className="relative group-hover/btn:rotate-12 transition-transform duration-500">
                               <Icon name={item.icon} className="size-6 drop-shadow-md" />
                            </div>
                          )}
                          <span className="drop-shadow-sm">{item.title}</span>
                          <Icon name="arrow-right" className="size-5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                        </span>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-14 rounded-full px-8 text-base font-semibold border-2 hover:bg-muted/50 transition-all hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <Icon name={item.icon} className="size-5" />}
                          {item.title}
                        </span>
                      </Button>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          )}

          {/* Hero Image */}
          {hero.image?.src && (
            <motion.div
              style={{ y, opacity }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-20 relative w-full max-w-6xl perspective-1000"
            >
              {/* Ambient Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-3xl opacity-50" />
              
              {/* Prism Glass Container */}
              <div className="relative rounded-[2rem] bg-background/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/10 overflow-hidden ring-1 ring-white/20">
                {/* Specular Highlight */}
                <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none z-20" />
                
                <Image
                  src={hero.image.src}
                  alt={hero.image.alt || "illustration"}
                  width={1200}
                  height={675}
                  priority
                  quality={100}
                  className="relative w-full rounded-[1.9rem] shadow-inner"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
                
                {/* Sheen Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none z-10" />
              </div>
            </motion.div>
          )}

          {/* Tip */}
          {hero.tip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="mt-12"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <span className="text-base">✨</span>
                {hero.tip}
              </div>
            </motion.div>
          )}

          {/* Happy Users */}
          {hero.show_happy_users && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="mt-8"
            >
              <HappyUsers />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.hero) === JSON.stringify(nextProps.hero);
});

export default Hero;
