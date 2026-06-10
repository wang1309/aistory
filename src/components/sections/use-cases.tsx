"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function UseCases({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className={`absolute inset-0 ${a.sectionBg}`} />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
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
        </div>

        {/* Use case cards — bento 布局 */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              className={`card-hover-lift rounded-xl border border-border bg-card p-5 sm:p-6 transition-colors ${a.hoverBorder} ${a.hoverBg} ${i === 0 ? 'sm:col-span-2 lg:row-span-2' : ''}`}
            >
              {item.icon && (
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${a.iconBg}`}>
                  <Icon name={item.icon} className={`h-5 w-5 ${a.text}`} />
                </div>
              )}
              <h3 className={`font-medium text-foreground ${i === 0 ? 'text-lg' : 'text-base'}`}>{item.title}</h3>
              {item.description && (
                <p className={`mt-2 leading-relaxed text-muted-foreground ${i === 0 ? 'text-sm' : 'text-sm'}`}>{item.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
