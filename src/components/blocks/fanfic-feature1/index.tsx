"use client";

import React from "react";
import { motion } from "framer-motion";
import { FanficFeature1 as FanficFeature1Type } from "@/types/blocks/fanfic-feature1";
import { EnhancedBadge as Badge } from "@/components/ui/enhanced-badge";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, BarChart3, Users, Globe, Crown } from "lucide-react";

export default function FanficFeature1({ section }: { section: FanficFeature1Type | undefined }) {
  if (!section) {
    return null;
  }

  const features = section.features || [];
  const statistics = section.statistics || [];

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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section id={section.name} className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Aesthetics - Consistent with FanficWhat */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        
        {/* Mesh Gradient Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/15 blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-pink-500/10 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
        
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
          <div className="text-center mb-24">
            {section.label && (
              <motion.div variants={itemVariants} className="inline-flex items-center justify-center mb-8">
                <span className="relative inline-flex overflow-hidden rounded-full p-[1px]">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-slate-950/90 px-5 py-2 text-sm font-medium text-white backdrop-blur-3xl">
                    <Crown className="w-4 h-4 mr-2 text-yellow-400" />
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
              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-foreground/80 font-medium mb-6 max-w-3xl mx-auto">
                {section.subtitle}
              </motion.p>
            )}

            {section.description && (
              <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {section.description}
              </motion.p>
            )}
          </div>

          {/* Features Grid */}
          {features.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group relative h-full"
                >
                  {/* Card Container */}
                  <div className="relative h-full overflow-hidden rounded-3xl glass-premium p-8 hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.05)]">
                    
                    {/* Hover Gradient Glow */}
                    <div className="absolute -inset-px bg-gradient-to-br from-teal-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon Orb */}
                      <div className="mb-6 inline-flex">
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner backdrop-blur-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                          {feature.icon ? (
                            <Icon name={feature.icon} className="w-7 h-7 text-foreground/90" />
                          ) : (
                            <Zap className="w-7 h-7 text-yellow-400" />
                          )}
                          {/* Orb Glow */}
                          <div className="absolute inset-0 rounded-2xl bg-white/20 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground/90 leading-relaxed flex-grow">
                        {feature.description}
                      </p>

                      {/* Highlight Badge */}
                      {feature.highlight && (
                        <div className="mt-6 pt-4 border-t border-white/5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {section.recommended_badge || 'Recommended'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Statistics Section - Glass Panel */}
          {statistics.length > 0 && (
            <motion.div 
              variants={itemVariants}
              className="relative overflow-hidden rounded-[2.5rem] glass-premium"
            >
              {/* Background Glows */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
              
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 p-12">
                {statistics.map((stat, index) => (
                  <div key={index} className="text-center group">
                    {/* Stat Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 rounded-full bg-white/5 border border-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                        {stat.icon ? (
                          <Icon name={stat.icon} className="w-5 h-5" />
                        ) : (
                          <BarChart3 className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    
                    {/* Value */}
                    <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                      <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 group-hover:from-teal-400 group-hover:to-blue-500 transition-all duration-300">
                        {stat.value}
                      </span>
                    </div>
                    
                    {/* Label */}
                    <div className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Optional Bottom Image */}
          {section.image && (
            <motion.div 
              variants={itemVariants}
              className="mt-24 relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80" />
              <motion.img
                src={section.image.src}
                alt={section.image.alt}
                className="w-full h-auto transform group-hover:scale-105 transition-transform duration-1000"
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
