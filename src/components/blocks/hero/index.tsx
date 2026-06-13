"use client";

import { memo, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import { getHeroCtaAnimationStyle } from "./animation-style";

import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

const Prism = dynamic(() => import("@/components/Prism"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background opacity-50" />
  ),
});

const STORY_IMAGES = [
  "https://r2.hellokittycoloringpages.com/image/dengtakashouren.avif",
  "https://r2.hellokittycoloringpages.com/image/laorenyuhai.avif",
  "https://r2.hellokittycoloringpages.com/image/lixiangguo.avif",
  "https://r2.hellokittycoloringpages.com/image/shushangdenanjue.avif",
  "https://r2.hellokittycoloringpages.com/image/yangzhiqiu.avif",
];

const Hero = memo(function Hero({ hero }: { hero: HeroType }) {
  const [isMounted, setIsMounted] = useState(false);
  const [allowPrism, setAllowPrism] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion && hero.prism_background?.enabled) {
        const timer = setTimeout(() => setAllowPrism(true), 500);
        return () => clearTimeout(timer);
      }
    }
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

  const enter = (delay: number) =>
    `transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isMounted
        ? "translate-y-0 opacity-100"
        : "translate-y-8 opacity-0"
    }`;

  if (hero.disabled) return null;

  return (
    <section className="min-h-[92vh] flex items-center justify-center py-24 lg:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        {allowPrism && isMounted ? (
          <>
            <div className="absolute inset-0 opacity-70">
              <Prism {...prismProps} />
            </div>
            <div className="absolute inset-0 bg-gradient-radial from-background/20 via-background/40 to-background/80" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.96_0.03_65),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.16_0.02_55),transparent)]" />
            <div
              className="absolute -left-[20%] top-[10%] h-[600px] w-[600px] rounded-full opacity-30 dark:opacity-15"
              style={{
                background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)",
                animation: "hero-orb-1 20s ease-in-out infinite",
              }}
            />
            <div
              className="absolute -right-[10%] bottom-[5%] h-[500px] w-[500px] rounded-full opacity-20 dark:opacity-10"
              style={{
                background: "radial-gradient(circle, oklch(0.88 0.04 85) 0%, transparent 70%)",
                animation: "hero-orb-2 25s ease-in-out infinite",
              }}
            />
            <div
              className="absolute left-[40%] top-[60%] h-[400px] w-[400px] rounded-full opacity-15 dark:opacity-8"
              style={{
                background: "radial-gradient(circle, oklch(0.92 0.05 35) 0%, transparent 70%)",
                animation: "hero-orb-3 18s ease-in-out infinite",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
              style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "48px 48px" }}
            />
          </>
        )}
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ───── LEFT COLUMN — Text Content ───── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Badge */}
            {hero.show_badge && (
              <div
                className={`flex items-center justify-center lg:justify-start mb-12 ${enter(0)}`}
                style={{ transitionDelay: isMounted ? "0ms" : "0ms" }}
              >
                <img
                  src="/imgs/badges/phdaily.svg"
                  alt="phdaily"
                  className="h-10 object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110"
                />
              </div>
            )}

            {/* Announcement */}
            {hero.announcement.show && (
              <div
                className={`flex justify-center lg:justify-start mb-6 ${enter(100)}`}
                style={{ transitionDelay: isMounted ? "100ms" : "0ms" }}
              >
                <Link
                  href={hero.announcement.url as any}
                  className="group relative inline-flex items-center gap-2 transition-all"
                >
                  <div className="relative flex items-center gap-2 rounded-full border border-border/30 bg-background/60 px-4 py-1.5 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/50">
                    {hero.announcement.label && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {hero.announcement.label}
                      </span>
                    )}
                    <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors duration-300">
                      {hero.announcement.title}
                    </span>
                    <svg viewBox="0 0 16 16" className="size-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" d="M6 3l5 5-5 5" />
                    </svg>
                  </div>
                </Link>
              </div>
            )}

            {/* Title */}
            <div className={`max-w-xl ${enter(200)}`} style={{ transitionDelay: isMounted ? "200ms" : "0ms" }}>
              {texts && texts.length > 1 ? (
                <h1 className="text-balance font-display font-bold tracking-tight text-foreground text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1]">
                  {texts[0]}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    {highlightText}
                  </span>
                  {texts[1]}
                </h1>
              ) : (
                <h1 className="text-balance font-display font-bold tracking-tight text-foreground text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.1]">
                  {hero.title}
                </h1>
              )}
            </div>

            {/* Decorative brush stroke */}
            <svg
              className={`-mt-2 h-2.5 w-32 text-primary/20 ${enter(350)} mx-auto lg:mx-0`}
              style={{ transitionDelay: isMounted ? "350ms" : "0ms" }}
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8c30-5 60-6 90-3s40 4 66-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Description */}
            <div
              className={`mt-7 max-w-2xl ${enter(400)}`}
              style={{ transitionDelay: isMounted ? "400ms" : "0ms" }}
            >
              <p
                className="text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light text-balance"
                dangerouslySetInnerHTML={descriptionHtml}
              />
            </div>

            {/* Buttons */}
            {hero.buttons && (
              <div
                className={`mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start ${enter(550)}`}
                style={{ transitionDelay: isMounted ? "550ms" : "0ms" }}
              >
                {hero.buttons.map((item, i) => {
                  const isPrimary = item.variant === "default" || i === 0;
                  return (
                    <Link
                      key={i}
                      href={item.url as any}
                      target={item.target || ""}
                      className="group relative w-full sm:w-auto"
                    >
                      {isPrimary ? (
                        <Button
                          size="lg"
                          className="w-full sm:w-auto h-12 sm:h-14 rounded-full px-7 text-sm font-semibold
                            bg-foreground text-background hover:bg-foreground/85 active:scale-[0.97]
                            dark:bg-white dark:text-foreground dark:hover:bg-white/90
                            transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                          style={getHeroCtaAnimationStyle(isMounted)}
                        >
                          <span className="flex items-center gap-2.5">
                            {item.icon && <Icon name={item.icon} className="size-4 shrink-0 opacity-70" />}
                            <span>{item.title}</span>
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-background/15 dark:bg-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                              <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" d="M6 3l5 5-5 5" />
                              </svg>
                            </span>
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto h-12 sm:h-14 rounded-full px-7 text-sm font-semibold
                            border border-border/30 bg-background/60 backdrop-blur-sm
                            hover:border-border/60 active:scale-[0.97]
                            transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        >
                          <span className="flex items-center gap-2">
                            {item.icon && <Icon name={item.icon} className="size-4 shrink-0 opacity-60" />}
                            <span>{item.title}</span>
                          </span>
                        </Button>
                      )}
                    </Link>
                  );
                })}

                {/* Quick Experience Button */}
                <button
                  id="hero-quick-start-btn"
                  onClick={() => {
                    const event = new CustomEvent("quick-start-story");
                    window.dispatchEvent(event);
                    document.getElementById("craft_story")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group w-full sm:w-auto h-12 sm:h-14 rounded-full px-7 text-sm font-semibold
                    bg-foreground/5 text-foreground hover:bg-foreground/10 active:scale-[0.97]
                    dark:bg-white/[0.06] dark:hover:bg-white/[0.12]
                    transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <span className="flex items-center justify-center gap-2.5">
                    <svg viewBox="0 0 24 24" className="size-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span>
                      {({
                        zh: "快速体验",
                        ja: "クイック体験",
                        ko: "빠른 체험",
                        de: "Schnellstart",
                        fr: "Essai Rapide",
                        es: "Prueba Rápida",
                        pt: "Teste Rápido",
                        ru: "Быстрый старт",
                      } as Record<string, string>)[locale] || "Quick Try"}
                    </span>
                  </span>
                </button>
              </div>
            )}

            {/* Tip */}
            {hero.tip && (
              <div
                className={`mt-12 ${enter(850)}`}
                style={{ transitionDelay: isMounted ? "850ms" : "0ms" }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-foreground/[0.02] px-4 py-1.5 text-sm text-muted-foreground/60">
                  <Icon name="sparkles" className="size-3.5 text-primary/50" />
                  {hero.tip}
                </div>
              </div>
            )}

            {/* Happy Users */}
            {hero.show_happy_users && (
              <div
                className={`mt-8 ${enter(950)}`}
                style={{ transitionDelay: isMounted ? "950ms" : "0ms" }}
              >
                <HappyUsers />
              </div>
            )}
          </div>

          {/* ───── RIGHT COLUMN — Animated Story Cascade ───── */}
          <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
            {/* Decorative ambient glow */}
            <div className="pointer-events-none absolute -inset-12">
              <div
                className="absolute top-[15%] left-[20%] h-[320px] w-[320px] rounded-full opacity-25 dark:opacity-12"
                style={{ background: "radial-gradient(circle, oklch(0.88 0.06 50) 0%, transparent 65%)" }}
              />
              <div
                className="absolute bottom-[10%] right-[15%] h-[260px] w-[260px] rounded-full opacity-20 dark:opacity-10"
                style={{ background: "radial-gradient(circle, oklch(0.85 0.04 80) 0%, transparent 65%)" }}
              />
            </div>

            {/* Image flow container */}
            <div className="relative h-[580px] w-full overflow-hidden">
              {STORY_IMAGES.map((src, i) => (
                <div
                  key={i}
                  className="absolute left-[12%] top-1/2 opacity-0 animate-hero-story-cascade"
                  style={{
                    animationDelay: `${i * 2.8}s`,
                    animationDuration: "14s",
                  }}
                >
                  {/* Double-bezel frame */}
                  <div className="rounded-[1.5rem] border border-border/15 bg-foreground/[0.02] p-1.5 dark:bg-white/[0.03] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.45)]">
                    <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)]">
                      <img
                        src={src}
                        alt={`story-${i}`}
                        width={240}
                        height={320}
                        className="w-[220px] h-[300px] object-cover"
                        loading="lazy"
                      />
                      {/* Top reflection */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent dark:from-white/[0.04]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.hero) === JSON.stringify(nextProps.hero);
});

export default Hero;
