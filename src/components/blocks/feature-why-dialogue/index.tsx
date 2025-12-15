"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";

export default function FeatureWhyDialogue({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="container relative px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          {section.title ? (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {section.title}
            </h2>
          ) : null}

          {section.description ? (
            <p className="mt-6 text-base sm:text-lg text-muted-foreground/80 leading-relaxed">
              {section.description}
            </p>
          ) : null}
        </motion.div>

        {section.items?.length ? (
          <div className="mt-12 lg:mt-16 grid gap-6 md:grid-cols-3">
            {section.items.slice(0, 3).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="glass-premium rounded-2xl p-6 border border-border/50"
              >
                {item.icon ? (
                  <div className="mb-4 flex justify-center">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon name={item.icon} className="w-5 h-5" />
                    </div>
                  </div>
                ) : null}

                {item.title ? (
                  <h3 className="text-lg font-semibold text-foreground text-center">
                    {item.title}
                  </h3>
                ) : null}

                {item.description ? (
                  <p className="mt-3 text-sm text-muted-foreground/80 leading-relaxed text-center">
                    {item.description}
                  </p>
                ) : null}
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
