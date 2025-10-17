"use client";

import { memo, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";

import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

// Lazy load Prism component (client-side only for WebGL)
// This maintains SEO as Prism is purely visual and doesn't affect content indexing
const Prism = dynamic(() => import("@/components/Prism"), {
  ssr: false, // Prism uses WebGL which cannot be server-rendered
  loading: () => (
    <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-background opacity-50" />
  ),
});

const Hero = memo(function Hero({ hero }: { hero: HeroType }) {
  // Client-side mount detection for Prism
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize expensive text splitting operation
  const { texts, highlightText } = useMemo(() => {
    const highlightText = hero.highlight_text;
    let texts = null;
    if (highlightText) {
      texts = hero.title?.split(highlightText, 2);
    }
    return { texts, highlightText };
  }, [hero.title, hero.highlight_text]);

  // Memoize dangerouslySetInnerHTML object to prevent re-creation
  const descriptionHtml = useMemo(
    () => ({ __html: hero.description || "" }),
    [hero.description]
  );

  // Memoize Prism configuration props
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
      suspendWhenOffscreen: true, // Performance optimization
    }),
    [hero.prism_background]
  );

  if (hero.disabled) {
    return null;
  }

  return (
    <>
      <section className="relative min-h-[92vh] flex items-center justify-center py-24 lg:py-32 overflow-hidden">
        <div className="container px-4 sm:px-6 lg:px-8">
          {hero.prism_background?.enabled ? (
            <div className="pointer-events-none absolute inset-0 -z-10">
              {/* Prism Background - lazy loaded on client side */}
              {isMounted && (
                <div className="absolute inset-0 opacity-70">
                  <Prism {...prismProps} />
                </div>
              )}

              {/* Radial gradient overlay for focus */}
              <div className="absolute inset-0 bg-gradient-radial from-background/20 via-background/40 to-background/80" />

              {/* Simplified single ambient glow blob */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[80px] motion-safe:animate-pulse anim-medium" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 -z-10">
              {/* Base gradient layer with subtle mesh effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

              {/* Animated mesh gradient orbs */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 h-[500px] w-[500px] rounded-full bg-gradient-radial from-primary/15 via-primary/8 to-transparent blur-3xl motion-safe:animate-pulse anim-medium" />

              <div className="absolute right-0 top-1/3 translate-x-1/4 h-[400px] w-[400px] rounded-full bg-gradient-radial from-accent/12 via-accent/6 to-transparent blur-3xl motion-safe:animate-pulse anim-medium animation-delay-1000" />

              <div className="absolute left-0 bottom-1/4 -translate-x-1/4 h-[350px] w-[350px] rounded-full bg-gradient-radial from-primary/10 via-primary/5 to-transparent blur-3xl motion-safe:animate-pulse anim-medium animation-delay-2000" />

              {/* Center spotlight effect */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] lg:h-[700px] lg:w-[1000px] rounded-full bg-gradient-radial from-primary/8 via-transparent to-transparent blur-[100px]" />

              {/* Subtle grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: '80px 80px'
                }}
              />

              {/* Top gradient fade for depth */}
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background/80 via-background/40 to-transparent" />

              {/* Bottom gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
          )}
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-12 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500">
              <img
                src="/imgs/badges/phdaily.svg"
                alt="phdaily"
                className="h-12 object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
          )}
          <div className="text-center">
            {hero.announcement.show && (
              <Link
                href={hero.announcement.url as any}
                className="mx-auto mb-8 inline-flex items-center group relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-700 motion-safe:delay-100"
              >
                {/* Glow effect behind announcement */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative rounded-full border border-border/60 bg-gradient-to-b from-background/60 to-background/40 px-5 py-2.5 text-sm backdrop-blur-xl shadow-xl shadow-black/5 ring-1 ring-white/10 transition-all duration-500 group-hover:border-primary/50 group-hover:bg-gradient-to-b group-hover:from-background/80 group-hover:to-background/60 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:scale-[1.02]">
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />

                  <div className="relative flex items-center gap-3">
                    {hero.announcement.label && (
                      <Badge className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary border-primary/30 hover:bg-gradient-to-br hover:from-primary/30 hover:to-primary/20 transition-all duration-300 font-semibold shadow-sm">
                        {hero.announcement.label}
                      </Badge>
                    )}
                    <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors duration-300">
                      {hero.announcement.title}
                    </span>
                    <Icon name="RiArrowRightLine" className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-8 mt-6 max-w-6xl relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-200">
                <span className="block text-balance text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.15] tracking-tight">
                  {texts[0]}
                  <span className="relative inline-block">
                    {/* Enhanced gradient text with multiple layers */}
                    <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent relative drop-shadow-sm">
                      {highlightText}
                    </span>
                    {/* Multi-layered glow effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/40 to-primary/30 blur-2xl -z-10 scale-110 motion-safe:animate-pulse anim-medium" />
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-3xl -z-10 scale-125" />
                  </span>
                  {texts[1]}
                </span>
              </h1>
            ) : (
              <h1 className="mx-auto mb-8 mt-6 max-w-6xl text-balance text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.15] tracking-tight motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-200">
                {hero.title}
              </h1>
            )}

            <div className="mx-auto mt-8 max-w-3xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-300">
              <p
                className="text-lg sm:text-xl lg:text-2xl text-muted-foreground leading-[1.65] font-normal text-balance px-4"
                dangerouslySetInnerHTML={descriptionHtml}
              />
            </div>
            {hero.buttons && (
              <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-400">
                {hero.buttons.map((item, i) => {
                  const isPrimary = item.variant === 'default' || i === 0;

                  return (
                    <Link
                      key={i}
                      href={item.url as any}
                      target={item.target || ""}
                      className="group relative w-full sm:w-auto"
                    >
                      {isPrimary ? (
                        <div className="relative">
                          {/* Multi-layered glow effect */}
                          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100 group-hover:blur-2xl will-change-opacity" />
                          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 opacity-50 blur transition-opacity duration-500 group-hover:opacity-80 will-change-opacity" />

                          <Button
                            className="relative w-full sm:w-auto px-10 py-7 text-base font-bold shadow-2xl transition-all duration-300 group-hover:shadow-[0_20px_60px_-15px_rgba(var(--primary),0.4)] bg-gradient-to-b from-primary to-primary/90 hover:from-primary hover:to-primary group-hover:scale-[1.02] border border-primary/20"
                            size="lg"
                          >
                            <span className="flex items-center justify-center gap-2">
                              {item.icon && <Icon name={item.icon} className="size-5 transition-transform duration-300 group-hover:scale-110" />}
                              <span>{item.title}</span>
                            </span>
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Subtle glow for secondary button */}
                          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />

                          <Button
                            className="relative w-full sm:w-auto px-10 py-7 text-base font-bold border-2 bg-gradient-to-b from-background/60 to-background/40 backdrop-blur-md hover:from-background/80 hover:to-background/60 hover:border-primary/50 transition-all duration-300 group-hover:scale-[1.02] shadow-xl hover:shadow-2xl ring-1 ring-white/10"
                            size="lg"
                            variant="outline"
                          >
                            <span className="flex items-center justify-center gap-2">
                              {item.icon && <Icon name={item.icon} className="size-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />}
                              <span className="bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">{item.title}</span>
                            </span>
                          </Button>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
            {hero.image?.src && (
              <div className="mt-20 sm:mt-24 flex justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000 motion-safe:delay-600">
                <div className="relative group max-w-6xl w-full px-4">
                  {/* Multi-layered glow effect behind image */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-3xl blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 will-change-opacity" />
                  <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700 will-change-opacity" />

                  {/* Image with premium glassmorphic frame */}
                  <div className="relative rounded-2xl lg:rounded-[2rem] border-2 border-white/10 bg-gradient-to-br from-background/90 via-background/70 to-background/50 p-3 lg:p-4 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/20 transition-all duration-700 group-hover:border-primary/30 group-hover:shadow-[0_20px_80px_rgba(var(--primary),0.15)] group-hover:scale-[1.01]">
                    {/* Inner shadow for depth */}
                    <div className="absolute inset-0 rounded-2xl lg:rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" />

                    <Image
                      src={hero.image.src}
                      alt={hero.image.alt || "illustration"}
                      width={1200}
                      height={675}
                      priority
                      quality={95}
                      className="relative w-full rounded-xl lg:rounded-3xl shadow-2xl shadow-black/20 transition-transform duration-700 group-hover:scale-[1.005]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                  </div>
                </div>
              </div>
            )}
            {hero.tip && (
              <div className="mt-10 flex justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700 motion-safe:delay-700">
                <div className="group relative inline-flex items-center gap-2.5 rounded-full border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-2.5 text-sm font-semibold text-primary backdrop-blur-md shadow-lg ring-1 ring-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-105 hover:border-primary/60">
                  <span className="text-base motion-safe:animate-pulse">✨</span>
                  <span className="relative">
                    {hero.tip}
                    {/* Subtle glow under text */}
                    <span className="absolute inset-0 blur-sm opacity-50 bg-primary/20" />
                  </span>
                </div>
              </div>
            )}
            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if hero actually changed
  return JSON.stringify(prevProps.hero) === JSON.stringify(nextProps.hero);
});

export default Hero;
