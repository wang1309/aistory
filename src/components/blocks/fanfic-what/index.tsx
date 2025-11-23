"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FanficWhat as FanficWhatType } from "@/types/blocks/fanfic-what";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, BookOpen, Lightbulb, Star, Feather } from "lucide-react";

// Headers to detect - extended list
const SECTION_HEADERS = [
  'How It Works', 'Key Features', 'Why Choose Us', 'Benefits',
  '工作原理', '核心特性', '为什么选择我们', '功能亮点',
  '仕組み', '主な機能',
  '作動方式', '작동 방식',
  '주요 기능', '장점',
  'Wie es funktioniert', 'Hauptfunktionen',
  'Comment ça marche', 'Fonctionnalités clés'
];

export default function FanficWhat({ section }: { section: FanficWhatType | undefined }) {
  // Early return if section is not provided or disabled
  if (!section || section.disabled) {
    return null;
  }

  // Smartly parse content into structured blocks
  const contentBlocks = useMemo(() => {
    const rawContent = section.content || section.intro_paragraph || "";
    const lines = rawContent.split('\n');
    const blocks: { title?: string; content: string[] }[] = [];
    
    let currentBlock: { title?: string; content: string[] } = { content: [] };
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if line is a header
      const isHeader = SECTION_HEADERS.some(h => trimmed === h || trimmed.endsWith(h) || trimmed.startsWith(h + ":"));
      
      if (isHeader) {
        if (currentBlock.title || currentBlock.content.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = { title: trimmed, content: [] };
      } else {
        currentBlock.content.push(line);
      }
    });

    if (currentBlock.title || currentBlock.content.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }, [section.content, section.intro_paragraph]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
        
        {/* Mesh Gradient Blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[100px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-500/10 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-30" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="max-w-7xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-20">
            {section.label && (
              <motion.div variants={itemVariants} className="inline-flex items-center justify-center mb-6">
                <span className="relative inline-flex overflow-hidden rounded-full p-[1px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-slate-950/90 px-5 py-2 text-sm font-medium text-white backdrop-blur-3xl">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                    {section.label}
                  </span>
                </span>
              </motion.div>
            )}

            {section.title && (
              <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                <span className="text-foreground drop-shadow-[0_10px_30px_rgba(59,7,100,0.15)] dark:drop-shadow-[0_10px_30px_rgba(12,6,26,0.65)]">
                  {section.title}
                </span>
              </motion.h2>
            )}

            {section.subtitle && (
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {section.subtitle}
              </motion.p>
            )}
          </div>

          {/* Content Blocks Grid */}
          {contentBlocks.length > 0 && (
            <div className={cn(
              "grid gap-6 md:gap-8",
              contentBlocks.length === 1 ? "grid-cols-1 max-w-4xl mx-auto" : 
              contentBlocks.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              contentBlocks.length === 3 ? "grid-cols-1 md:grid-cols-3" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            )}>
              {contentBlocks.map((block, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group relative overflow-hidden rounded-3xl glass-premium p-8 hover:-translate-y-2 transition-all duration-500"
                >
                  {/* Card Glow Effect */}
                  <div className="absolute -inset-px bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  
                  <div className="relative z-10 h-full flex flex-col">
                    {block.title && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-shrink-0 p-2.5 rounded-xl bg-white/10 border border-white/10 shadow-inner backdrop-blur-md">
                          {index % 3 === 0 ? <Zap className="w-6 h-6 text-amber-400" /> :
                           index % 3 === 1 ? <BookOpen className="w-6 h-6 text-pink-400" /> :
                           <Star className="w-6 h-6 text-teal-400" />}
                        </div>
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">
                          {block.title}
                        </h3>
                      </div>
                    )}
                    
                    <div className="space-y-3 flex-grow">
                      {block.content.map((line, i) => (
                        <p key={i} className="text-muted-foreground/90 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
