"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useState, useRef } from "react";

import Fade from "embla-carousel-fade";
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import Image from "next/image";

const DURATION = 5000;

export default function Feature2({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const [api, setApi] = useState<CarouselApi>();
  const [currentAccordion, setCurrentAccordion] = useState("1");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  useEffect(() => {
    api?.scrollTo(+currentAccordion - 1);
    const interval = setInterval(() => {
      setCurrentAccordion((prev) => {
        const next = parseInt(prev) + 1;
        return next > (section.items?.length || 3) ? "1" : next.toString();
      });
    }, DURATION);

    return () => clearInterval(interval);
  }, [api, currentAccordion, section.items?.length]);

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
      <div className="absolute top-1/3 left-0 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] opacity-40 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[128px] opacity-30 pointer-events-none" />

      <div className="container relative z-10">
        <div className="mx-auto grid gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left Column - Content & Accordion */}
          <div className="flex flex-col">
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
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
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-foreground">
                  {section.title}
                </h2>
              )}

              {/* Refined Description */}
              {section.description && (
                <p className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed mb-12 max-w-xl font-light">
                  {section.description}
                </p>
              )}
            </motion.div>

            {/* Enhanced Accordion */}
            <Accordion
              type="single"
              value={currentAccordion}
              onValueChange={(value) => {
                setCurrentAccordion(value);
                api?.scrollTo(+value - 1);
              }}
              className="space-y-4"
            >
              {section.items?.map((item, i) => (
                <EnhancedAccordionItem 
                  key={i} 
                  item={item} 
                  index={i} 
                  isActive={currentAccordion === (i + 1).toString()} 
                  value={(i + 1).toString()}
                />
              ))}
            </Accordion>
          </div>

          {/* Right Column - Enhanced Carousel */}
          <motion.div 
            style={{ y, opacity }}
            className="relative group perspective-1000 lg:h-full flex items-center"
          >
            {/* Ambient Glow Behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
            
            {/* Main Glass Container */}
            <div className="relative w-full rounded-[2rem] bg-background/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/5 overflow-hidden transition-all duration-700 group-hover:shadow-primary/10">
              {/* Specular Highlight Border */}
              <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none z-20" />
              <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/5 pointer-events-none z-20" />

              <Carousel
                opts={{
                  duration: 50,
                }}
                setApi={setApi}
                plugins={[Fade()]}
                className="w-full"
              >
                <CarouselContent>
                  {section.items?.map((item, i) => (
                    <CarouselItem key={i}>
                      <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden">
                        {item.image?.src ? (
                          <Image
                            src={item.image.src}
                            alt={item.image.alt || item.title || ""}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                            quality={100}
                            priority={i === 0}
                          />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-muted/5">
                             <Icon name="image" className="size-12 text-muted-foreground/20" />
                           </div>
                        )}
                        {/* Cinematic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-background/20 via-transparent to-white/5 pointer-events-none" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

               {/* Dynamic Sheen Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EnhancedAccordionItem({ item, index, isActive, value }: { item: any, index: number, isActive: boolean, value: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <AccordionItem
      value={value}
      className="border-0 relative group/item rounded-xl overflow-hidden transition-all duration-500"
      onMouseMove={handleMouseMove}
    >
       {/* Spotlight Gradient */}
       <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group/item:opacity-100 transition duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              color-mix(in srgb, var(--primary), transparent 92%),
              transparent 40%
            )
          `,
        }}
      />
      
      {/* Active State Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 bg-card/50' : 'opacity-0'}`} />
      <div className={`absolute inset-0 border rounded-xl transition-colors duration-500 pointer-events-none ${isActive ? 'border-primary/20' : 'border-border/40 group-hover/item:border-border/60'}`} />

      <div className="relative">
        <AccordionTrigger className={`px-6 py-5 hover:no-underline transition-all duration-300 ${
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}>
          <div className="flex items-center gap-5 w-full">
            {/* Icon Container */}
            {item.icon && (
              <div className={`relative shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-500 ${
                isActive 
                  ? 'bg-primary/10 border-primary/20 text-primary scale-110' 
                  : 'bg-muted/5 border-border/50 text-muted-foreground group-hover/item:text-primary group-hover/item:border-primary/10'
              }`}>
                <Icon name={item.icon} className="size-5" />
              </div>
            )}

            {/* Title */}
            <span className={`flex-1 text-left font-semibold text-lg tracking-tight transition-colors duration-300 ${
              isActive ? 'text-primary' : ''
            }`}>
              {item.title}
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-6 pb-6 pt-0">
          <div className="pl-[3.75rem]">
            <p className="text-base text-muted-foreground/80 leading-relaxed font-light">
              {item.description}
            </p>

            {/* Elegant Progress Bar */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative mt-6 h-0.5 bg-primary/10 rounded-full overflow-hidden"
              >
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 to-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                />
              </motion.div>
            )}
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}
