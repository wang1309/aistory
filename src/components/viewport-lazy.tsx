"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ViewportLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  className?: string;
}

export function ViewportLazy({
  children,
  fallback = null,
  rootMargin = "300px 0px",
  threshold = 0.1,
  once = true,
  className,
}: ViewportLazyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once, visible]);

  return (
    <div ref={ref} className={cn(className)}>
      {visible ? children : fallback}
    </div>
  );
}
