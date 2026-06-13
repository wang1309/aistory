import type { CSSProperties } from "react";

export function getCtaBreatheAnimationStyle({
  isActive,
  delay,
}: {
  isActive: boolean;
  delay: string;
}): CSSProperties {
  return {
    animationName: isActive ? "hero-cta-breathe" : "none",
    animationDuration: "4s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDelay: delay,
  };
}

export function getHeroCtaAnimationStyle(isMounted: boolean): CSSProperties {
  return getCtaBreatheAnimationStyle({ isActive: isMounted, delay: "1.5s" });
}
