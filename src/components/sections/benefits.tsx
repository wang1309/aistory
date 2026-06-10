"use client";

import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { getAccent, type AccentColor } from "./accent";
import Icon from "@/components/icon";

interface Props {
  section: SectionType;
  accent?: AccentColor;
}

export default function Benefits({ section, accent = "orange" }: Props) {
  const a = getAccent(accent);
  if (section.disabled || !section.items?.length) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header — 左对齐打破全居中模板感 */}
        <div className="max-w-2xl">
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

        {/* Items: first prominent, rest side by side */}
        <div className="mt-14 space-y-6">
          {section.items[0] && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="card-hover-lift rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex items-start gap-5">
                {section.items[0].icon && (
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.iconBg}`}>
                    <Icon name={section.items[0].icon} className={`h-6 w-6 ${a.text}`} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-foreground">{section.items[0].title}</h3>
                  {section.items[0].description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {section.items[0].description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {section.items.length > 1 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.slice(1).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: (i + 1) * 0.06, ease: [0.4, 0, 0.2, 1] }}
                  className="card-hover-lift rounded-2xl border border-border bg-card p-5 sm:p-6"
                >
                  {item.icon && (
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${a.iconBg}`}>
                      <Icon name={item.icon} className={`h-5 w-5 ${a.text}`} />
                    </div>
                  )}
                  <h3 className="text-base font-medium text-foreground">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
