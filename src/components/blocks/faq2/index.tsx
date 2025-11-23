"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, ArrowLeftRight, Ban, File, CreditCard, Mail, LucideIcon, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FAQSection } from "@/types/blocks/faq";
import Icon from "@/components/icon";

// Icon mapping for FAQ items (order matters)
const FAQ_ICONS: LucideIcon[] = [Heart, ArrowLeftRight, Ban, File, CreditCard, Mail];

interface FAQSimple01Props {
    section?: FAQSection;
}

export const FAQSimple01 = ({ section }: FAQSimple01Props) => {
    if (!section) {
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
        <section className="relative py-24 sm:py-32 overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-background" />
                
                {/* Mesh Gradient Blobs */}
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] animate-blob mix-blend-screen" />
                <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 blur-[120px] animate-pulse-slow mix-blend-screen" />

                {/* Noise Texture */}
                <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-30" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="max-w-container mx-auto"
                >
                    {/* Header */}
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center mb-20">
                        <motion.div variants={itemVariants} className="inline-flex items-center justify-center mb-6">
                            <span className="relative inline-flex overflow-hidden rounded-full p-[1px]">
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-slate-950/90 px-5 py-2 text-sm font-medium text-white backdrop-blur-3xl">
                                    <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                                    FAQ
                                </span>
                            </span>
                        </motion.div>
                        
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                            <span className="text-foreground drop-shadow-[0_10px_30px_rgba(59,7,100,0.15)] dark:drop-shadow-[0_10px_30px_rgba(12,6,26,0.65)]">
                                {section.title}
                            </span>
                        </motion.h2>
                        
                        <motion.p variants={itemVariants} className="text-lg text-muted-foreground md:text-xl leading-relaxed">
                            {section.description}
                        </motion.p>
                    </div>

                    {/* FAQ Grid */}
                    <div className="grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20">
                        {section.faqs.map((item, index) => {
                            const IconComponent = FAQ_ICONS[index % FAQ_ICONS.length];
                            return (
                                <motion.div
                                    key={item.question}
                                    variants={itemVariants}
                                    className="w-full group"
                                >
                                    <div className="h-full relative overflow-hidden rounded-3xl glass-premium p-8 hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
                                        {/* Hover Gradient Glow */}
                                        <div className="absolute -inset-px bg-gradient-to-br from-teal-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                                        
                                        <div className="relative z-10 flex flex-col items-center text-center h-full">
                                            {/* Icon Orb */}
                                            <div className="mb-6 inline-flex">
                                                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner backdrop-blur-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                                    <IconComponent className="w-7 h-7 text-foreground/80 group-hover:text-primary transition-colors" />
                                                    {/* Orb Glow */}
                                                    <div className="absolute inset-0 rounded-2xl bg-white/20 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                                                {item.question}
                                            </h3>
                                            <p className="text-muted-foreground/90 leading-relaxed text-sm md:text-base">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* CTA Section */}
                    <motion.div 
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-[2.5rem] glass-premium p-8 md:p-12 text-center"
                    >
                        {/* Inner Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <div className="flex items-end -space-x-4">
                                <Avatar className="size-12 ring-2 ring-background shadow-xl">
                                    <AvatarImage src="https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80" alt="Marco Kelly" />
                                    <AvatarFallback>MK</AvatarFallback>
                                </Avatar>
                                <Avatar className="size-16 z-10 ring-2 ring-background shadow-2xl">
                                    <AvatarImage src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80" alt="Amelie Laurent" />
                                    <AvatarFallback>AL</AvatarFallback>
                                </Avatar>
                                <Avatar className="size-12 ring-2 ring-background shadow-xl">
                                    <AvatarImage src="https://www.untitledui.com/images/avatars/jaya-willis?fm=webp&q=80" alt="Jaya Willis" />
                                    <AvatarFallback>JW</AvatarFallback>
                                </Avatar>
                            </div>
                            
                            <div className="max-w-xl">
                                <h4 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                                    {section.cta.title}
                                </h4>
                                <p className="text-lg text-muted-foreground">
                                    {section.cta.description}
                                </p>
                            </div>
                            
                            <Button 
                                size="lg" 
                                asChild
                                className="rounded-full h-12 px-8 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <a href="mailto:contact@storiesgenerator.org">
                                    {section.cta.button}
                                </a>
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
