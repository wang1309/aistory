"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";

interface Props {
  section: SectionType;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function ComicBenefits({ section }: Props) {
  if (section.disabled || !section.items?.length) return null;

  const [first, ...rest] = section.items;

  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          {section.label && (
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
              {section.label}
            </p>
          )}
          {section.title && (
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        {/* First item: full width, prominent */}
        <motion.div
          custom={0}
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 flex items-start gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            {first.icon && <Icon name={first.icon} className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{first.title}</h3>
            {first.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {first.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Remaining items: side by side */}
        {rest.length > 0 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {rest.map((item, i) => (
              <motion.div
                key={i}
                custom={i + 1}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  {item.icon && <Icon name={item.icon} className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
