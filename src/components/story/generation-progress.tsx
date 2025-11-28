"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Icon from "@/components/icon";

interface GenerationProgressProps {
    isGenerating: boolean;
    tips: string[];
    estimatedDuration?: number; // in seconds
}

export default function GenerationProgress({
    isGenerating,
    tips,
    estimatedDuration = 15,
}: GenerationProgressProps) {
    const [progress, setProgress] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Simulate progress based on estimated duration
    useEffect(() => {
        if (!isGenerating) {
            setProgress(0);
            setCurrentTipIndex(0);
            return;
        }

        // Reset progress when generation starts
        setProgress(0);
        let startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            // Progress curve: fast at start, slower near end (never reaches 100%)
            const newProgress = Math.min(95, (elapsed / estimatedDuration) * 100);
            setProgress(newProgress);

            // Complete when generation finishes
            if (!isGenerating) {
                setProgress(100);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isGenerating, estimatedDuration]);

    // Rotate tips every 3 seconds
    useEffect(() => {
        if (!isGenerating || tips.length === 0) return;

        const tipInterval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }, 3000);

        return () => clearInterval(tipInterval);
    }, [isGenerating, tips.length]);

    if (!isGenerating) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Progress Container */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/30 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/10 border border-indigo-100/50 dark:border-indigo-900/30 backdrop-blur-xl overflow-hidden">
                {/* Animated Background Blobs */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />

                <div className="relative z-10 space-y-6">
                    {/* Header with Icon */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full blur-md animate-pulse" />
                            <div className="relative size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Icon name="sparkles" className="size-5 text-white animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                            Creating Your Story...
                        </h3>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                        <div className="relative h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            {/* Background shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                            {/* Actual progress */}
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full relative overflow-hidden"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {/* Shimmer effect on progress bar */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                        </div>

                        {/* Progress Percentage */}
                        <div className="flex items-center justify-between text-sm">
                            <span
                                className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums"
                            >
                                {Math.round(progress)}%
                            </span>
                            <span className="text-muted-foreground/60 dark:text-muted-foreground/80 text-xs">
                                {progress < 30 ? "Starting..." : progress < 70 ? "Crafting..." : "Almost there..."}
                            </span>
                        </div>
                    </div>

                    {/* Rotating Tips */}
                    <div className="min-h-[60px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTipIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-start gap-3 text-center max-w-md"
                            >
                                <Icon name="lightbulb" className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground/80 dark:text-muted-foreground/90 leading-relaxed">
                                    {tips[currentTipIndex]}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Animated Dots */}
                    <div className="flex items-center justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="size-2 rounded-full bg-indigo-500/40 dark:bg-indigo-400/40"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.4, 1, 0.4],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
