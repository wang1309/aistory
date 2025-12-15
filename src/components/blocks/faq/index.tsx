"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section as SectionType } from "@/types/blocks/section";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { HelpCircle, Plus, Minus, MessageCircle } from "lucide-react";

export default function FAQ({ section }: { section: SectionType }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (section.disabled) {
    return null;
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section id={section.name} className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        
        {/* Mesh Gradient Blobs - Consistent with Fanfic theme */}
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/10 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-30" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-20">
            {section.label && (
              <motion.div variants={itemVariants} className="inline-flex items-center justify-center mb-8">
                <span className="relative inline-flex overflow-hidden rounded-full p-[1px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-slate-950/90 px-5 py-2 text-sm font-medium text-white backdrop-blur-3xl">
                    <HelpCircle className="w-4 h-4 mr-2 text-teal-400" />
                    {section.label}
                  </span>
                </span>
              </motion.div>
            )}

            {section.title && (
              <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-foreground">
                {section.title}
              </motion.h2>
            )}

            {section.description && (
              <motion.p variants={itemVariants} className="text-lg text-muted-foreground dark:text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
                {section.description}
              </motion.p>
            )}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {section.items?.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group"
              >
                <div 
                  className={cn(
                    "relative overflow-hidden rounded-2xl border transition-all duration-500",
                    openIndex === index 
                      ? "bg-white/5 border-teal-500/30 shadow-[0_0_30px_rgba(45,212,191,0.1)]" 
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  {/* Glow for active state */}
                  {openIndex === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
                  )}

                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="relative z-10 w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-colors duration-300",
                        openIndex === index 
                          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30" 
                          : "bg-white/10 text-muted-foreground group-hover:text-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <span className={cn(
                        "text-lg font-semibold transition-colors duration-300",
                        openIndex === index ? "text-teal-400" : "text-foreground group-hover:text-teal-200 dark:text-foreground/95 dark:group-hover:text-teal-200"
                      )}>
                        {item.title}
                      </span>
                    </div>
                    <div className={cn(
                      "flex-shrink-0 ml-4 p-1 rounded-full border transition-all duration-300",
                      openIndex === index 
                        ? "border-teal-500/50 bg-teal-500/20 text-teal-400 rotate-180" 
                        : "border-white/10 bg-white/5 text-muted-foreground group-hover:border-white/30"
                    )}>
                      {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-0 pl-[4.5rem] relative z-10">
                          <div className="w-full h-px bg-gradient-to-r from-teal-500/20 to-transparent mb-4" />
                          <p className="text-muted-foreground/90 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Help Text */}
          <motion.div 
            variants={itemVariants}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer dark:text-muted-foreground/80 dark:hover:text-foreground/90">
              <MessageCircle className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium dark:text-foreground/90">Can&apos;t find what you&apos;re looking for? Contact Support</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
