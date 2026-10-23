"use client";

import { memo, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";

import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const COLUMN_A = [
  "https://r2.storiesgenerator.org/image/image_dengtakashouren.avif",
  "https://r2.storiesgenerator.org/image/image_laorenyuhai.avif",
  "https://r2.storiesgenerator.org/image/image_lixiangguo.avif",
];

const COLUMN_B = [
  "https://r2.storiesgenerator.org/image/image_shushangdenanjue.avif",
  "https://r2.storiesgenerator.org/image/image_yangzhiqiu.avif",
  "https://r2.storiesgenerator.org/image/yinhediguo.webp",
];

function StoryCard({ src, index }: { src: string; index: number }) {
  return (
    <div
      className={`shrink-0 rounded-[2px] border border-border bg-card p-[6px] shadow-[6px_8px_0_rgba(36,77,61,0.10)] dark:shadow-[6px_8px_0_rgba(0,0,0,0.45)] ${
        index % 3 === 0 ? "-rotate-[3deg]" : index % 3 === 1 ? "rotate-[2.5deg]" : "-rotate-[1.5deg]"
      }`}
    >
      <div className="relative overflow-hidden rounded-[1px]">
        <Image
          src={src}
          alt={`story-${index}`}
          width={240}
          height={320}
          className="w-[220px] h-[300px] object-cover"
          sizes="220px"
          quality={75}
        />
      </div>
    </div>
  );
}

const Hero = memo(function Hero({ hero }: { hero: HeroType }) {
  const [isMounted, setIsMounted] = useState(false);
  const [showDesktopCascade, setShowDesktopCascade] = useState(false);
  const tCommon = useTranslations("common");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateCascadeVisibility = () => setShowDesktopCascade(mediaQuery.matches);

    updateCascadeVisibility();
    mediaQuery.addEventListener("change", updateCascadeVisibility);

    return () => mediaQuery.removeEventListener("change", updateCascadeVisibility);
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

  // The title and CTA are the mobile LCP candidates, so the SSR output must be
  // visible before hydration instead of waiting for an entrance animation.
  const enter = (_delay: number) => "translate-y-0 opacity-100";

  if (hero.disabled) return null;

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden pb-[62px] pt-[84px] lg:pb-[62px] lg:pt-[105px]">
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-[72px]">

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
                  <div className="relative flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 transition-colors duration-300 hover:border-foreground/25">
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
                <h1 className="text-balance font-display font-normal tracking-[-0.075em] text-foreground text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[0.96]">
                  {texts[0]}
                  <span className="text-primary">
                    {highlightText}
                  </span>
                  {texts[1]}
                </h1>
              ) : (
                <h1 className="text-balance font-display font-normal tracking-[-0.075em] text-foreground text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[0.96]">
                  {hero.title}
                </h1>
              )}
            </div>

            {/* Description */}
            <div
              className={`mt-7 max-w-2xl ${enter(400)}`}
              style={{ transitionDelay: isMounted ? "400ms" : "0ms" }}
            >
              <p
                className="max-w-[510px] font-serif text-[18px] leading-[1.5] text-muted-foreground text-balance sm:text-[21px]"
                dangerouslySetInnerHTML={descriptionHtml}
              />
            </div>

            {/* Buttons */}
            {hero.buttons && (
              <div
                className={`mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start ${enter(550)}`}
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
                          variant="pill"
                          size="pill"
                          className="w-full sm:w-auto"
                        >
                          <span className="flex items-center gap-2.5">
                            {item.icon && <Icon name={item.icon} className="size-4 shrink-0 opacity-70" />}
                            <span>{item.title}</span>
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                              <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" d="M6 3l5 5-5 5" />
                              </svg>
                            </span>
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="pillOutline"
                          size="pill"
                          className="w-full sm:w-auto"
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
                  className="group h-12 w-full rounded-[3px] border border-border bg-transparent px-7 text-[13px] font-semibold text-foreground transition-all duration-300 ease-out hover:border-primary/60 hover:bg-card active:scale-[0.98] sm:h-14 sm:w-auto"
                >
                  <span className="flex items-center justify-center gap-2.5">
                    <svg viewBox="0 0 24 24" className="size-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span>{tCommon("quick_try")}</span>
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
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
                  <Icon name="sparkles" className="size-3.5 text-primary/60" />
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

          {/* ───── RIGHT COLUMN — Dual-Column Story Drift ───── */}
          <div className="relative hidden lg:flex items-center justify-center overflow-hidden min-h-[580px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[23px] inset-y-[6px] -rotate-[3deg] rounded-[2px] bg-accent-sage dark:bg-[#1d2a22]"
            />
            {showDesktopCascade && (
              <div className="hero-drift-mask relative flex h-[580px] w-full justify-center gap-6">
                <div className="animate-hero-drift-up flex flex-col gap-5">
                  {[...COLUMN_A, ...COLUMN_A].map((src, i) => (
                    <StoryCard key={`${src}-${i}`} src={src} index={i} />
                  ))}
                </div>
                <div className="animate-hero-drift-down -mt-40 flex flex-col gap-5">
                  {[...COLUMN_B, ...COLUMN_B].map((src, i) => (
                    <StoryCard key={`${src}-${i}`} src={src} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </section>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.hero) === JSON.stringify(nextProps.hero);
});

export default Hero;
