"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { HeroPoemTitle as HeroPoemTitleType } from "@/types/blocks/hero-poem-title";
import { useLocale } from "next-intl";
import PoemTitleBreadcrumb from "./breadcrumb";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import type { GeneratedPoemTitle } from "@/types/poem-title";

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: any[]) => {
    if (isDev) {
        console.log(...args);
    }
};

// ========== INTERFACES ==========

interface DisplayTitle extends GeneratedPoemTitle {
    copied: boolean;
    isVisible?: boolean;
    animationDelay?: number;
}

interface SavedTitleHistory {
    id: string;
    poemContent: string;
    titles: GeneratedPoemTitle[];
    language: string;
    styles: string[];
    moods: string[];
    length: string;
    usageScene: string;
    timestamp: number;
}

// ========== HELPER FUNCTIONS ==========

class TitleHistoryStorage {
    private static readonly STORAGE_KEY = "poem_title_history";
    private static readonly MAX_HISTORY_ITEMS = 10;

    static saveHistory(item: Omit<SavedTitleHistory, "id" | "timestamp">): void {
        try {
            const history = this.getHistory();
            const newItem: SavedTitleHistory = {
                ...item,
                id: Date.now().toString(),
                timestamp: Date.now(),
            };

            history.unshift(newItem);
            const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
        } catch (error) {
            console.error("Failed to save title history:", error);
        }
    }

    static getHistory(): SavedTitleHistory[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Failed to get title history:", error);
            return [];
        }
    }

    static clearHistory(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear title history:", error);
        }
    }
}

// ========== COMPONENT ==========

export default function HeroPoemTitle({ section }: { section: HeroPoemTitleType }) {
    const locale = useLocale();

    // Form state
    const [poemContent, setPoemContent] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("zh");
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [selectedLength, setSelectedLength] = useState<"short" | "medium" | "long">("medium");
    const [selectedUsageScene, setSelectedUsageScene] = useState("social_media");

    // Generation state
    const [generatedTitles, setGeneratedTitles] = useState<DisplayTitle[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
    const contentRef = useRef<HTMLTextAreaElement | null>(null);

    useDraftAutoSave({
        key: `poem-title-generator:content:${locale}`,
        value: poemContent,
        onRestore: (draft) => setPoemContent(draft),
    });

    // Example prompts
    const [isExamplesExpanded, setIsExamplesExpanded] = useState(false);

    // Style chips
    const styleChips = useMemo(() => [
        { id: "classical", label: section.form.style.chips.classical },
        { id: "modern", label: section.form.style.chips.modern },
        { id: "minimalist", label: section.form.style.chips.minimalist },
        { id: "imagist", label: section.form.style.chips.imagist },
        { id: "dark", label: section.form.style.chips.dark },
        { id: "healing", label: section.form.style.chips.healing },
        { id: "romantic", label: section.form.style.chips.romantic },
    ], [section.form.style.chips]);

    // Mood chips
    const moodChips = useMemo(() => [
        { id: "sad", label: section.form.mood.chips.sad },
        { id: "melancholic", label: section.form.mood.chips.melancholic },
        { id: "calm", label: section.form.mood.chips.calm },
        { id: "gentle", label: section.form.mood.chips.gentle },
        { id: "hopeful", label: section.form.mood.chips.hopeful },
        { id: "angry", label: section.form.mood.chips.angry },
        { id: "surreal", label: section.form.mood.chips.surreal },
    ], [section.form.mood.chips]);

    const RANDOM_PROMPTS = useMemo(
        () => section.form.examples?.prompts || [],
        [section.form.examples]
    );

    // Toggle chip selection
    const toggleStyle = useCallback((styleId: string) => {
        setSelectedStyles(prev =>
            prev.includes(styleId)
                ? prev.filter(s => s !== styleId)
                : [...prev, styleId]
        );
    }, []);

    const toggleMood = useCallback((moodId: string) => {
        setSelectedMoods(prev =>
            prev.includes(moodId)
                ? prev.filter(m => m !== moodId)
                : [...prev, moodId]
        );
    }, []);

    // Validation
    const validateForm = useCallback((): boolean => {
        const trimmedContent = poemContent.trim();

        if (!trimmedContent) {
            toast.error(section.toasts.error_no_content);
            return false;
        }

        if (trimmedContent.length < 10) {
            toast.error(section.toasts.error_content_too_short);
            return false;
        }

        return true;
    }, [poemContent, section.toasts]);

    // Handle verification success
    const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
        devLog("=== Starting poem title generation after verification ===");

        try {
            setIsGenerating(true);
            setGeneratedTitles([]);

            const requestBody = {
                poemContent: poemContent.trim(),
                language: selectedLanguage,
                styles: selectedStyles,
                moods: selectedMoods,
                length: selectedLength,
                usageScene: selectedUsageScene,
                turnstileToken,
            };

            devLog("=== Request body ===", JSON.stringify(requestBody, null, 2));

            const response = await fetch("/api/poem-title-generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message || section.toasts.error_generate_failed);
                return;
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                toast.error(section.toasts.error_generate_failed);
                return;
            }

            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    devLog("=== Stream finished ===");
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });

                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const jsonStr = line.slice(2);
                            const parsed = JSON.parse(jsonStr);
                            if (typeof parsed === "string") {
                                accumulatedText += parsed;
                            }
                        } catch (e) {
                            // Skip invalid lines
                        }
                    }
                }
            }

            devLog("=== Accumulated text ===", accumulatedText);

            // Parse accumulated JSON
            if (accumulatedText.trim()) {
                try {
                    // Extract JSON from response (handle potential markdown code blocks)
                    let jsonText = accumulatedText.trim();
                    if (jsonText.startsWith("```json")) {
                        jsonText = jsonText.slice(7);
                    }
                    if (jsonText.startsWith("```")) {
                        jsonText = jsonText.slice(3);
                    }
                    if (jsonText.endsWith("```")) {
                        jsonText = jsonText.slice(0, -3);
                    }

                    const result = JSON.parse(jsonText.trim());
                    const titles: GeneratedPoemTitle[] = result.titles || [];

                    const displayTitles: DisplayTitle[] = titles.map((title, index) => ({
                        ...title,
                        id: `title-${Date.now()}-${index}`,
                        copied: false,
                        isVisible: true,
                        animationDelay: index * 150,
                    }));

                    setGeneratedTitles(displayTitles);
                    toast.success(section.toasts.success_generated);

                    // Save to history
                    TitleHistoryStorage.saveHistory({
                        poemContent: poemContent.trim(),
                        titles,
                        language: selectedLanguage,
                        styles: selectedStyles,
                        moods: selectedMoods,
                        length: selectedLength,
                        usageScene: selectedUsageScene,
                    });
                } catch (e) {
                    console.error("Failed to parse title response:", e);
                    toast.error(section.toasts.error_generate_failed);
                }
            } else {
                toast.error(section.toasts.error_generate_failed);
            }
        } catch (error) {
            console.error("Title generation failed:", error);
            toast.error(section.toasts.error_generate_failed);
        } finally {
            setIsGenerating(false);
        }
    }, [poemContent, selectedLanguage, selectedStyles, selectedMoods, selectedLength, selectedUsageScene, section.toasts]);

    const handleTurnstileSuccess = useCallback((token: string) => {
        devLog("✓ Turnstile verification successful (Poem Title)");
        handleVerificationSuccess(token);
    }, [handleVerificationSuccess]);

    const handleTurnstileError = useCallback(() => {
        console.error("❌ Turnstile verification failed (Poem Title)");
        setIsGenerating(false);
        toast.error(section.toasts.error_generate_failed);
    }, [section.toasts]);

    const handleGenerate = useCallback(() => {
        if (!validateForm()) return;

        setIsGenerating(true);
        setLastError(null);

        turnstileRef.current?.execute();
    }, [validateForm]);

    useGeneratorShortcuts({
        onGenerate: handleGenerate,
        onFocusInput: () => {
            if (contentRef.current) {
                contentRef.current.focus();
            }
        },
    });

    // Copy title to clipboard
    const handleCopyTitle = useCallback(async (titleId: string, titleText: string) => {
        try {
            await navigator.clipboard.writeText(titleText);

            setGeneratedTitles(prev =>
                prev.map(t => ({
                    ...t,
                    copied: t.id === titleId ? true : t.copied,
                }))
            );

            toast.success(section.toasts.success_copied);

            setTimeout(() => {
                setGeneratedTitles(prev =>
                    prev.map(t => ({
                        ...t,
                        copied: t.id === titleId ? false : t.copied,
                    }))
                );
            }, 2000);
        } catch (error) {
            console.error("Failed to copy title:", error);
        }
    }, [section.toasts]);

    // Clear all titles
    const handleClearTitles = useCallback(() => {
        setGeneratedTitles([]);
    }, []);

    const handleRandomPrompt = useCallback(() => {
        if (!RANDOM_PROMPTS.length) return;
        const randomPrompt = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
        setPoemContent(randomPrompt);
        setIsExamplesExpanded(false);
    }, [RANDOM_PROMPTS]);

    // Separate titles by category
    const literaryTitles = useMemo(
        () => generatedTitles.filter(t => t.category === "literary"),
        [generatedTitles]
    );
    const platformTitles = useMemo(
        () => generatedTitles.filter(t => t.category === "platform"),
        [generatedTitles]
    );

    const contentLength = poemContent.length;

    return (
        <section id="poem_title_generator" className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-amber-500/30">
            {/* Premium Background Layer */}
            <div className="fixed inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />

            <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
            </div>

            {/* Invisible Turnstile */}
            <TurnstileInvisible
                ref={turnstileRef}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
            />

            <div className="w-full max-w-5xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 relative">
                {/* Breadcrumb Navigation */}
                <div className="mb-10 flex justify-start animate-fade-in-up">
                    <div className="glass-premium px-6 py-2 rounded-full">
                        <PoemTitleBreadcrumb
                            homeText={section.breadcrumb.home}
                            currentText={section.breadcrumb.current}
                        />
                    </div>
                </div>

                {/* Enhanced Header */}
                <div className="relative text-center mb-20 animate-fade-in-up animation-delay-1000">
                    <div className="inline-flex items-center justify-center mb-8">
                        <div className="p-px bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl">
                            <div className="glass-premium rounded-2xl p-4 bg-background/50">
                                <Icon name="RiQuillPenLine" className="size-8 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 dark:from-amber-200 dark:via-orange-200 dark:to-amber-400 animate-shimmer">
                            {section.header.title}
                        </span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
                        {section.header.subtitle}
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-amber-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 animate-fade-in-up animation-delay-2000 mb-24">
                    <div className="bg-background/40 backdrop-blur-xl rounded-[calc(3rem-4px)] p-8 sm:p-16">
                        <div className="max-w-3xl mx-auto space-y-12">
                            {/* Poem Content Field */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <label className="text-xl font-medium tracking-tight flex items-center gap-3 text-foreground">
                                            <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">01</span>
                                            {section.form.poem_content.label}
                                        </label>
                                        {section.form.poem_content.required && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 bg-red-500/10 px-2 py-1 rounded-full">Required</span>
                                        )}
                                    </div>
                                    {RANDOM_PROMPTS.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRandomPrompt}
                                            className="gap-2 text-amber-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-full h-10 px-4"
                                        >
                                            <Icon name="Sparkles" className="size-4" />
                                            {section.form.random_button || "Random prompt"}
                                        </Button>
                                    )}
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-rose-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                                    <Textarea
                                        ref={contentRef}
                                        value={poemContent}
                                        onChange={(e) => setPoemContent(e.target.value.slice(0, section.form.poem_content.max_length || 2000))}
                                        placeholder={section.form.poem_content.placeholder}
                                        className="relative min-h-[200px] w-full bg-transparent border-0 border-b border-black/10 dark:border-white/10 focus:border-amber-500/50 focus:ring-0 rounded-none px-0 text-xl sm:text-2xl font-light leading-snug placeholder:text-muted-foreground/30 text-foreground resize-none transition-all duration-300"
                                        style={{ boxShadow: "none" }}
                                    />
                                    <div className="absolute bottom-0 right-0 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                        {contentLength} / {section.form.poem_content.max_length || 2000} CHARS
                                    </div>
                                </div>

                                {/* Example Prompts */}
                                {!poemContent && section.form.examples && (
                                    <div className="mt-4">
                                        <Collapsible open={isExamplesExpanded} onOpenChange={setIsExamplesExpanded}>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-2 px-0">
                                                    <Icon name="RiLightbulbLine" className="size-3" />
                                                    {section.form.examples.title}
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-4 animate-slide-down">
                                                <div className="space-y-2">
                                                    {section.form.examples.prompts.map((prompt, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => {
                                                                setPoemContent(prompt);
                                                                setIsExamplesExpanded(false);
                                                            }}
                                                            className="w-full text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-sm text-muted-foreground hover:text-foreground"
                                                        >
                                                            {prompt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                )}
                            </div>

                            {/* Options Section */}
                            <div className="pt-12 border-t border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">02</span>
                                    <h3 className="text-xl font-medium tracking-tight text-foreground">Customize Output</h3>
                                </div>

                                <div className="space-y-8">
                                    {/* Language & Length Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {/* Language */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                                                {section.form.language.label}
                                            </label>
                                            <Select value={selectedLanguage} onValueChange={(v: string) => setSelectedLanguage(v)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                                                    <SelectValue placeholder={section.form.language.placeholder} />
                                                </SelectTrigger>
                                                <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                                    {Object.entries(section.form.language.options).map(([code, label]) => (
                                                        <SelectItem key={code} value={code}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Length */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                                                {section.form.length.label}
                                            </label>
                                            <Select value={selectedLength} onValueChange={(v: "short" | "medium" | "long") => setSelectedLength(v)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                                    <SelectItem value="short">{section.form.length.options.short}</SelectItem>
                                                    <SelectItem value="medium">{section.form.length.options.medium}</SelectItem>
                                                    <SelectItem value="long">{section.form.length.options.long}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Usage Scene */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                                                {section.form.usage_scene.label}
                                            </label>
                                            <Select value={selectedUsageScene} onValueChange={setSelectedUsageScene}>
                                                <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                                                    <SelectValue placeholder={section.form.usage_scene.placeholder} />
                                                </SelectTrigger>
                                                <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                                    <SelectItem value="literary_submission">{section.form.usage_scene.options.literary_submission}</SelectItem>
                                                    <SelectItem value="collection">{section.form.usage_scene.options.collection}</SelectItem>
                                                    <SelectItem value="social_media">{section.form.usage_scene.options.social_media}</SelectItem>
                                                    <SelectItem value="competition">{section.form.usage_scene.options.competition}</SelectItem>
                                                    <SelectItem value="gift_card">{section.form.usage_scene.options.gift_card}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Style Chips */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                                            {section.form.style.label}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {styleChips.map((chip) => (
                                                <button
                                                    key={chip.id}
                                                    onClick={() => toggleStyle(chip.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                                        selectedStyles.includes(chip.id)
                                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                                                            : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                                                    )}
                                                >
                                                    {chip.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mood Chips */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
                                            {section.form.mood.label}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {moodChips.map((chip) => (
                                                <button
                                                    key={chip.id}
                                                    onClick={() => toggleMood(chip.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                                        selectedMoods.includes(chip.id)
                                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                                            : "bg-black/5 dark:bg-white/5 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                                                    )}
                                                >
                                                    {chip.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Action */}
                            <div className="pt-12 flex flex-col items-center gap-8">
                                <div className="relative group w-full max-w-md">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-rose-500/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="relative w-full h-20 rounded-full bg-foreground text-background hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black hover:scale-[1.02] transition-all duration-500 text-lg font-bold tracking-wide shadow-2xl border-none"
                                    >
                                        {isGenerating ? (
                                            <div className="flex items-center gap-3">
                                                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                <span className="animate-pulse">{section.generate_button.generating}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Icon name="RiSparklingLine" className="size-5" />
                                                <span>{section.generate_button.text}</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>

                                <GeneratorShortcutHints />

                                {/* Info Pills */}
                                <div className="flex items-center gap-6">
                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5">
                                        <Icon name="RiCheckLine" className="size-3 text-amber-500" />
                                        {section.generate_button.info.free}
                                    </span>
                                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5">
                                        <Icon name="RiTimeLine" className="size-3 text-blue-500" />
                                        {section.generate_button.info.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generated Titles Output */}
                {(generatedTitles.length > 0 || isGenerating) && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-12 px-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <Icon name="RiStarLine" className="size-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight text-foreground">{section.output.title}</h3>
                                    <p className="text-sm text-muted-foreground/60">{section.output.subtitle}</p>
                                </div>
                            </div>
                            {generatedTitles.length > 0 && (
                                <Button
                                    onClick={handleClearTitles}
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
                                >
                                    <Icon name="RiCloseLine" className="size-4 mr-2" />
                                    {section.output.clear_button}
                                </Button>
                            )}
                        </div>

                        {isGenerating ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="h-40 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden relative">
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Literary Titles */}
                                {literaryTitles.length > 0 && (
                                    <div className="space-y-6">
                                        <h4 className="text-lg font-semibold text-foreground/80 flex items-center gap-2">
                                            <Icon name="RiBookOpenLine" className="size-5 text-amber-500" />
                                            {section.output.literary_group_title}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {literaryTitles.map((titleObj, index) => (
                                                <div
                                                    key={titleObj.id}
                                                    className={cn(
                                                        "group relative p-6 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-amber-500/30 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500",
                                                        titleObj.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                                    )}
                                                    style={{ transitionDelay: `${index * 100}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-xl font-medium text-foreground/90 leading-tight tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300 mb-2">
                                                                {titleObj.title}
                                                            </p>
                                                            {titleObj.englishTitle && (
                                                                <p className="text-sm text-muted-foreground/60 mb-2 italic">{titleObj.englishTitle}</p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground/70">{titleObj.explanation}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-shrink-0 h-8 px-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-amber-500 hover:text-white transition-all"
                                                        >
                                                            {titleObj.copied ? (
                                                                <Icon name="RiCheckLine" className="size-4" />
                                                            ) : (
                                                                <Icon name="RiFileCopyLine" className="size-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Platform Titles */}
                                {platformTitles.length > 0 && (
                                    <div className="space-y-6">
                                        <h4 className="text-lg font-semibold text-foreground/80 flex items-center gap-2">
                                            <Icon name="RiShare2Line" className="size-5 text-rose-500" />
                                            {section.output.platform_group_title}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {platformTitles.map((titleObj, index) => (
                                                <div
                                                    key={titleObj.id}
                                                    className={cn(
                                                        "group relative p-6 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-rose-500/30 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-500",
                                                        titleObj.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                                    )}
                                                    style={{ transitionDelay: `${index * 100}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-xl font-medium text-foreground/90 leading-tight tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300 mb-2">
                                                                {titleObj.title}
                                                            </p>
                                                            {titleObj.englishTitle && (
                                                                <p className="text-sm text-muted-foreground/60 mb-2 italic">{titleObj.englishTitle}</p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground/70">{titleObj.explanation}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-shrink-0 h-8 px-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            {titleObj.copied ? (
                                                                <Icon name="RiCheckLine" className="size-4" />
                                                            ) : (
                                                                <Icon name="RiFileCopyLine" className="size-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
