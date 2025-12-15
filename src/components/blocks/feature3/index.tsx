"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, AnimatePresence } from "framer-motion";
import Image from "next/image";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Feature3({ section }: { section: SectionType }) {
  const [activeTab, setActiveTab] = useState("tab-1");
  const containerRef = useRef<HTMLDivElement>(null);
  const hasVisualContent = section.items?.some((item) => Boolean(item.image?.src));

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  if (section.disabled) {
    return null;
  }

  return (
    <section 
      ref={containerRef}
      id={section.name} 
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05] pointer-events-none" />
      
      {/* Premium Noise Texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      {/* Ethereal Aurora Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-30 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[128px] opacity-20 pointer-events-none" />

      <div className="container relative z-10">
        {/* Header Section */}
        <motion.div 
          style={{ y, opacity }}
          className="mb-20 w-full flex flex-col items-center text-center"
        >
          {/* Sophisticated Label */}
          {section.label && (
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-gradient-to-r from-primary/0 to-primary/50" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{section.label}</span>
              <div className="h-px w-16 bg-gradient-to-l from-primary/0 to-primary/50" />
            </div>
          )}

          {/* Editorial Heading */}
          {section.title && (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-foreground max-w-4xl">
              {section.title}
            </h2>
          )}

          {/* Refined Description */}
          {section.description && (
            <p className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl font-light">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="tab-1" value={activeTab} onValueChange={setActiveTab} className="relative">
          {/* Connector Line (Desktop) */}
          <div className="absolute left-[16.66%] right-[16.66%] top-[3rem] hidden lg:block pointer-events-none">
             <div className="h-px w-full bg-border/30" />
             {/* Progress Line */}
             <motion.div 
               className="absolute top-0 left-0 h-px bg-gradient-to-r from-primary/50 via-primary to-primary/50"
               initial={false}
               animate={{
                 width: `${((parseInt(activeTab.split('-')[1]) - 1) / (section.items!.length - 1)) * 100}%`
               }}
               transition={{ duration: 0.5, ease: "easeInOut" }}
             />
          </div>

          {/* Tab List */}
          <TabsList className="relative grid gap-8 mb-16 lg:grid-cols-3 lg:gap-12 justify-items-center bg-transparent p-0 h-auto">
            {section.items?.map((item, index) => (
              <TabTriggerItem 
                key={index} 
                item={item} 
                index={index} 
                isActive={activeTab === `tab-${index + 1}`} 
                value={`tab-${index + 1}`}
              />
            ))}
          </TabsList>

          {/* Content Display (Prism Glass Container) */}
        {hasVisualContent && (
          <div className="relative mx-auto max-w-5xl">
            <div className="relative group perspective-1000">
               {/* Ambient Glow Behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
              
              {/* Main Glass Container */}
              <div className="relative rounded-[2rem] bg-background/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/5 overflow-hidden min-h-[400px] lg:min-h-[500px] transition-all duration-700 group-hover:shadow-primary/10">
                 {/* Specular Highlight Border */}
                <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none z-20" />
                <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/5 pointer-events-none z-20" />

                <AnimatePresence mode="wait">
                  {section.items?.map((item, index) => (
                    activeTab === `tab-${index + 1}` && (
                      <TabsContent
                        key={index}
                        value={`tab-${index + 1}`}
                        className="absolute inset-0 m-0 outline-none"
                        forceMount
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                          className="w-full h-full relative"
                        >
                           {item.image?.src ? (
                            <>
                              <Image
                                src={item.image.src}
                                alt={item.image.alt || item.title || ""}
                                fill
                                className="object-cover"
                                priority
                              />
                              {/* Cinematic Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                              
                              {/* Text Overlay on Image */}
                              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                                <motion.h3 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                  className="text-2xl lg:text-3xl font-bold text-white mb-3"
                                >
                                  {item.title}
                                </motion.h3>
                                <motion.p 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3, duration: 0.5 }}
                                  className="text-white/80 text-lg max-w-2xl"
                                >
                                  {item.description}
                                </motion.p>
                              </div>
                            </>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-muted/5">
                               <Icon name="image" className="size-16 text-muted-foreground/20" />
                             </div>
                           )}
                        </motion.div>
                      </TabsContent>
                    )
                  ))}
                </AnimatePresence>

                 {/* Dynamic Sheen Effect */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" />
              </div>
            </div>
          </div>
        )}
        </Tabs>
      </div>
    </section>
  );
}

function TabTriggerItem({ item, index, isActive, value }: { item: any, index: number, isActive: boolean, value: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <TabsTrigger
      value={value}
      className="group/item relative w-full max-w-sm outline-none data-[state=active]:bg-transparent"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Gradient Card */}
      <div className={`relative rounded-2xl p-6 transition-all duration-500 border overflow-hidden text-left h-full ${
        isActive 
          ? 'bg-background/50 border-primary/20 shadow-lg shadow-primary/5' 
          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
      }`}>
         {/* Spotlight Effect */}
         <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover/item:opacity-100 transition duration-500"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                color-mix(in srgb, var(--primary), transparent 94%),
                transparent 40%
              )
            `,
          }}
        />

        <div className="relative z-10 flex flex-col items-center lg:items-start gap-4">
          {/* Number Badge */}
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl border transition-all duration-500 ${
            isActive
              ? 'bg-primary/10 border-primary/20 text-primary scale-110 shadow-inner shadow-primary/10'
              : 'bg-muted/10 border-white/10 text-muted-foreground group-hover/item:border-primary/20 group-hover/item:text-primary/80'
          }`}>
            <span className="text-lg font-bold font-mono">{index + 1}</span>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
              isActive ? 'text-primary' : 'text-foreground group-hover/item:text-foreground'
            }`}>
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground/70 leading-relaxed font-light">
              {item.description}
            </p>
          </div>
        </div>
        
        {/* Active Indicator Arrow (Desktop) */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent transition-all duration-300 ${
          isActive ? 'border-b-primary/20 translate-y-[1px] opacity-100' : 'translate-y-2 opacity-0'
        }`} />
      </div>
    </TabsTrigger>
  );
}
