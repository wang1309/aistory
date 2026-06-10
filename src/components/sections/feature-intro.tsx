"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function FeatureIntro({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className={`absolute inset-0 ${a.sectionBg}`} />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_340px]">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {section.label && (
              <p className={`text-sm font-medium tracking-wide ${a.text}`}>
                {section.label}
              </p>
            )}
            {section.title && (
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl leading-snug">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {section.description}
              </p>
            )}

            <ul className="mt-8 space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${a.iconBg}`}>
                    <svg viewBox="0 0 16 16" className={`h-3 w-3 ${a.text}`} fill="currentColor">
                      <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Decorative panel grid */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-2 grid-rows-2 gap-3 [width:280px] [height:280px] opacity-[0.07]"
            >
              <div className="col-span-1 row-span-1 rounded-lg border-2 border-current" />
              <div className="col-span-1 row-span-2 rounded-lg border-2 border-current" />
              <div className="col-span-1 row-span-1 rounded-lg border-2 border-current" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
