"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
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
        <section id="poem_title_generator" className="bg-background">
            {/* Invisible Turnstile */}
            <TurnstileInvisible
                ref={turnstileRef}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
            />

            <div className="relative mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <PoemTitleBreadcrumb
                        homeText={section.breadcrumb.home}
                        currentText={section.breadcrumb.current}
                    />
                </div>

                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-orange-500/10">
                            <Icon name="RiQuillPenLine" className="size-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h1 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
                            {section.header.title}
                        </h1>
                    </div>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">
                        {section.header.subtitle}
                    </p>
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                <GeneratorNavTabs />

                {/* Main Form Card */}
                <div className="rounded-2xl border border-border bg-card shadow-sm mb-8">
                    <div className="p-6 sm:p-10">
                        <div className="space-y-8">
                            {/* Poem Content Field */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
                                        {section.form.poem_content.label}
                                    </label>
                                    {RANDOM_PROMPTS.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRandomPrompt}
                                            className="gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:text-orange-300 h-8 px-3 text-xs"
                                        >
                                            <Icon name="Sparkles" className="size-3.5" />
                                            {section.form.random_button || "Random prompt"}
                                        </Button>
                                    )}
                                </div>

                                <div className="relative">
                                    <Textarea
                                        ref={contentRef}
                                        value={poemContent}
                                        onChange={(e) => setPoemContent(e.target.value.slice(0, section.form.poem_content.max_length || 2000))}
                                        placeholder={section.form.poem_content.placeholder}
                                        className="min-h-[160px] resize-none text-sm focus-visible:ring-orange-500/30"
                                    />
                                    <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/50">
                                        {contentLength} / {section.form.poem_content.max_length || 2000}
                                    </div>
                                </div>

                                {/* Example Prompts */}
                                {!poemContent && section.form.examples && (
                                    <Collapsible open={isExamplesExpanded} onOpenChange={setIsExamplesExpanded}>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 gap-1.5 px-0 h-7">
                                                <Icon name="RiLightbulbLine" className="size-3" />
                                                {section.form.examples.title}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-3">
                                            <div className="space-y-1.5">
                                                {section.form.examples.prompts.map((prompt, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setPoemContent(prompt);
                                                            setIsExamplesExpanded(false);
                                                        }}
                                                        className="w-full text-left p-3 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        {prompt}
                                                    </button>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </div>

                            {/* Options Section */}
                            <div className="pt-6 border-t border-border space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">2</span>
                                    <h3 className="text-sm font-semibold text-foreground">{section.form.usage_scene.label}</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Language */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {section.form.language.label}
                                        </label>
                                        <Select value={selectedLanguage} onValueChange={(v: string) => setSelectedLanguage(v)}>
                                            <SelectTrigger className="text-sm">
                                                <SelectValue placeholder={section.form.language.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(section.form.language.options).map(([code, label]) => (
                                                    <SelectItem key={code} value={code}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Length */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {section.form.length.label}
                                        </label>
                                        <Select value={selectedLength} onValueChange={(v: "short" | "medium" | "long") => setSelectedLength(v)}>
                                            <SelectTrigger className="text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="short">{section.form.length.options.short}</SelectItem>
                                                <SelectItem value="medium">{section.form.length.options.medium}</SelectItem>
                                                <SelectItem value="long">{section.form.length.options.long}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Usage Scene */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {section.form.usage_scene.label}
                                        </label>
                                        <Select value={selectedUsageScene} onValueChange={setSelectedUsageScene}>
                                            <SelectTrigger className="text-sm">
                                                <SelectValue placeholder={section.form.usage_scene.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        {section.form.style.label}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {styleChips.map((chip) => (
                                            <button
                                                key={chip.id}
                                                onClick={() => toggleStyle(chip.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                                    selectedStyles.includes(chip.id)
                                                        ? "border-orange-500/40 bg-orange-500/[0.08] text-orange-600 dark:text-orange-400"
                                                        : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mood Chips */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        {section.form.mood.label}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {moodChips.map((chip) => (
                                            <button
                                                key={chip.id}
                                                onClick={() => toggleMood(chip.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                                    selectedMoods.includes(chip.id)
                                                        ? "border-orange-500/40 bg-orange-500/[0.08] text-orange-600 dark:text-orange-400"
                                                        : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Generate Action */}
                            <div className="pt-2 space-y-4">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full h-14 rounded-xl text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-60 active:scale-[0.97] transition-all"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>{section.generate_button.generating}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Icon name="RiSparklingLine" className="size-4" />
                                            <span>{section.generate_button.text}</span>
                                        </div>
                                    )}
                                </Button>

                                <GeneratorShortcutHints />

                                <div className="flex items-center justify-center gap-4">
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Icon name="RiCheckLine" className="size-3 text-orange-500" />
                                        {section.generate_button.info.free}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Icon name="RiTimeLine" className="size-3 text-orange-500" />
                                        {section.generate_button.info.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generated Titles Output */}
                {(generatedTitles.length > 0 || isGenerating) && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Icon name="RiStarLine" className="size-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">{section.output.title}</h3>
                                    <p className="text-xs text-muted-foreground">{section.output.subtitle}</p>
                                </div>
                            </div>
                            {generatedTitles.length > 0 && (
                                <Button
                                    onClick={handleClearTitles}
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                                >
                                    <Icon name="RiCloseLine" className="size-3.5 mr-1" />
                                    {section.output.clear_button}
                                </Button>
                            )}
                        </div>

                        {isGenerating ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="h-28 rounded-xl bg-muted border border-border overflow-hidden relative">
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/40 to-transparent animate-shimmer" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Literary Titles */}
                                {literaryTitles.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                            <Icon name="RiBookOpenLine" className="size-4 text-orange-500" />
                                            {section.output.literary_group_title}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {literaryTitles.map((titleObj, index) => (
                                                <div
                                                    key={titleObj.id}
                                                    className="group relative p-5 rounded-xl bg-card border border-border hover:border-orange-500/30 hover:bg-orange-500/[0.02] card-hover-lift transition-all duration-300"
                                                    style={{ transitionDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-base font-medium text-foreground leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-1">
                                                                {titleObj.title}
                                                            </p>
                                                            {titleObj.englishTitle && (
                                                                <p className="text-xs text-muted-foreground mb-1.5 italic">{titleObj.englishTitle}</p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground">{titleObj.explanation}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-shrink-0 h-8 w-8 p-0 rounded-lg hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400"
                                                        >
                                                            {titleObj.copied ? (
                                                                <Icon name="RiCheckLine" className="size-3.5" />
                                                            ) : (
                                                                <Icon name="RiFileCopyLine" className="size-3.5" />
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
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                            <Icon name="RiShare2Line" className="size-4 text-orange-500" />
                                            {section.output.platform_group_title}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {platformTitles.map((titleObj, index) => (
                                                <div
                                                    key={titleObj.id}
                                                    className="group relative p-5 rounded-xl bg-card border border-border hover:border-orange-500/30 hover:bg-orange-500/[0.02] card-hover-lift transition-all duration-300"
                                                    style={{ transitionDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-base font-medium text-foreground leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-1">
                                                                {titleObj.title}
                                                            </p>
                                                            {titleObj.englishTitle && (
                                                                <p className="text-xs text-muted-foreground mb-1.5 italic">{titleObj.englishTitle}</p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground">{titleObj.explanation}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-shrink-0 h-8 w-8 p-0 rounded-lg hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400"
                                                        >
                                                            {titleObj.copied ? (
                                                                <Icon name="RiCheckLine" className="size-3.5" />
                                                            ) : (
                                                                <Icon name="RiFileCopyLine" className="size-3.5" />
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
