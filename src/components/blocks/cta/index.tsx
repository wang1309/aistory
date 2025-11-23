"use client";

import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CTA({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-30" />
        
        {/* Aurora Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/0 rounded-full blur-3xl animate-blob mix-blend-multiply dark:mix-blend-screen filter" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/0 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen filter" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen filter" />
      </div>

      <div className="container relative z-10 px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-premium bg-white dark:bg-black/40 rounded-[2.5rem] overflow-hidden text-center relative"
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="px-6 py-16 md:px-12 md:py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="mx-auto mb-6 text-4xl font-bold tracking-tight md:text-6xl text-black dark:text-white max-w-4xl drop-shadow-sm">
                {section.title}
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mx-auto mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl leading-relaxed"
            >
              {section.description}
            </motion.p>

            {section.buttons && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
              >
                {section.buttons.map((item, idx) => (
                  <Button
                    key={idx}
                    variant={item.variant || "default"}
                    size="lg"
                    asChild
                    className={cn(
                      "btn-hover-lift text-lg px-8 h-14 rounded-xl font-medium shadow-xl",
                      item.variant === "outline" 
                        ? "bg-white/5 hover:bg-white/10 border-white/10 backdrop-blur-sm" 
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0"
                    )}
                  >
                    <Link
                      href={item.url || ""}
                      target={item.target}
                      className="flex items-center gap-2"
                    >
                      {item.title}
                      {item.icon && (
                        <Icon name={item.icon as string} className="size-5" />
                      )}
                    </Link>
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
