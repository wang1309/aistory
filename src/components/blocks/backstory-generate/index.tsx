"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { StoryStorage } from "@/lib/story-storage";
import { ChevronDown, Settings2, Sparkles, Zap, Palette, Copy, RefreshCw, Wand2, BookOpen, Eraser, Castle, Rocket, Building2, Landmark, Scroll, Bot, Star, Skull, User } from "lucide-react";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import StoryHistoryDropdown from "@/components/story-history-dropdown";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import ReactMarkdown from "react-markdown";
import { motion, useReducedMotion } from "framer-motion";
import { useAppContext } from "@/contexts/app";
import type { StoryStatus } from "@/models/story";
import type { BackstoryGenerate as BackstoryGenerateType } from "@/types/blocks/backstory-generate";
import type { SavedStory } from "@/lib/story-storage";
import BackstoryBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

// ========== HELPER FUNCTIONS ==========

function calculateWordCount(text: string): number {
    if (!text || !text.trim()) return 0;
    const trimmed = text.trim();

    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
    const cjkChars = trimmed.match(cjkRegex);
    const cjkCount = cjkChars ? cjkChars.length : 0;

    const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
    const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
    const englishCount = withoutCJK ? englishWords.length : 0;

    return cjkCount + englishCount;
}

interface BackstoryGenerateProps {
    section: BackstoryGenerateType;
}

export default function BackstoryGenerate({ section }: BackstoryGenerateProps) {
    const locale = useLocale();
    const { user, setShowSignModal } = useAppContext();
    const router = useRouter();
    const reduceMotion = useReducedMotion();

    // Helper function to get nested translations
    const t = (path: string) => {
        const keys = path.split('.');
        let value = section as any;
        for (const key of keys) {
            value = value?.[key];
        }
        return value || path;
    };

    // ========== AI MODELS ==========
    const AI_MODELS = useMemo(() => [
        {
            id: 'fast',
            name: t('ai_models.fast'),
            badge: 'FAST',
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            icon: <Zap className="h-4 w-4" />,
            description: t('ai_models.fast_description')
        },
        {
            id: 'standard',
            name: t('ai_models.standard'),
            badge: 'RECOMMENDED',
            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            icon: <Sparkles className="h-4 w-4" />,
            description: t('ai_models.standard_description')
        },
        {
            id: 'creative',
            name: t('ai_models.creative'),
            badge: 'PRO',
            badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            icon: <Palette className="h-4 w-4" />,
            description: t('ai_models.creative_description')
        }
    ], [section]);


    // ========== WORLDVIEW OPTIONS ==========
    const WORLDVIEW_OPTIONS = useMemo(() => [
        { id: 'fantasy', name: t('worldview.fantasy'), icon: <Castle className="h-3.5 w-3.5" /> },
        { id: 'scifi', name: t('worldview.scifi'), icon: <Rocket className="h-3.5 w-3.5" /> },
        { id: 'urban', name: t('worldview.urban'), icon: <Building2 className="h-3.5 w-3.5" /> },
        { id: 'xianxia', name: t('worldview.xianxia'), icon: <Landmark className="h-3.5 w-3.5" /> },
        { id: 'historical', name: t('worldview.historical'), icon: <Scroll className="h-3.5 w-3.5" /> },
        { id: 'cyberpunk', name: t('worldview.cyberpunk'), icon: <Bot className="h-3.5 w-3.5" /> }
    ], [section]);

    // ========== ROLE TYPE OPTIONS ==========
    const ROLE_TYPE_OPTIONS = useMemo(() => [
        { id: 'protagonist', name: t('role_type.protagonist'), icon: <Star className="h-3.5 w-3.5" /> },
        { id: 'supporting', name: t('role_type.supporting'), icon: <Sparkles className="h-3.5 w-3.5" /> },
        { id: 'antagonist', name: t('role_type.antagonist'), icon: <Skull className="h-3.5 w-3.5" /> },
        { id: 'npc', name: t('role_type.npc'), icon: <User className="h-3.5 w-3.5" /> },
    ], [section]);

    // ========== TONE OPTIONS ==========
    const TONE_OPTIONS = useMemo(() => [
        { id: 'inspirational', name: t('tone.inspirational') },
        { id: 'dark', name: t('tone.dark') },
        { id: 'comedic', name: t('tone.comedic') },
        { id: 'tragic', name: t('tone.tragic') },
        { id: 'epic', name: t('tone.epic') }
    ], [section]);

    // ========== SAMPLE PROMPTS ==========
    const SAMPLE_PROMPTS = useMemo(() => {
        return section?.random_prompts || [
            "A rogue assassin seeking redemption after a fateful encounter",
            "A fallen noble who lost everything but gained a mysterious power",
            "A young mage with forbidden knowledge and a tragic past",
            "A war veteran haunted by the ghosts of fallen comrades",
            "A street urchin who discovers they are the lost heir to a kingdom"
        ];
    }, [section]);

    // ========== STATE MANAGEMENT ==========
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState<string | null>('standard');
    const [selectedLanguage, setSelectedLanguage] = useState(locale);
    const [selectedWorldview, setSelectedWorldview] = useState('fantasy');
    const [selectedRoleType, setSelectedRoleType] = useState('protagonist');
    const [selectedTone, setSelectedTone] = useState('inspirational');
    const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'detailed'>('medium');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBackstory, setGeneratedBackstory] = useState("");
    const [isSavingStory, setIsSavingStory] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    
    const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
    const promptRef = useRef<HTMLTextAreaElement | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement | null>(null);
    const outputScrollRef = useRef<HTMLDivElement | null>(null);
    const [rightPanelHeight, setRightPanelHeight] = useState<number | null>(null);

    // Use ref to store latest values
    const backstoryOptionsRef = useRef({
        worldview: 'fantasy',
        roleType: 'protagonist',
        tone: 'inspirational',
        length: 'medium' as 'short' | 'medium' | 'detailed',
        language: locale
    });

    useDraftAutoSave({
        key: `backstory-generator:prompt:${locale}`,
        value: prompt,
        onRestore: (draft) => setPrompt(draft),
    });

    // Update ref whenever options change
    useEffect(() => {
        backstoryOptionsRef.current = {
            worldview: selectedWorldview,
            roleType: selectedRoleType,
            tone: selectedTone,
            length: selectedLength,
            language: selectedLanguage
        };
    }, [selectedWorldview, selectedRoleType, selectedTone, selectedLength, selectedLanguage]);

    useEffect(() => {
        if (!leftPanelRef.current) return;

        const updateHeight = () => {
            if (!leftPanelRef.current) return;
            const rect = leftPanelRef.current.getBoundingClientRect();
            if (rect.height > 0) {
                setRightPanelHeight(rect.height);
            }
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);

        return () => {
            window.removeEventListener("resize", updateHeight);
        };
    }, []);

    // Scroll to result on mobile when generation starts/finishes
    useEffect(() => {
        if (generatedBackstory && window.innerWidth < 1024 && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [generatedBackstory]);

    useEffect(() => {
        if (!generatedBackstory || !isGenerating) return;
        const container = outputScrollRef.current;
        if (!container) return;

        container.scrollTop = container.scrollHeight;
    }, [generatedBackstory, isGenerating]);

    // Computed values
    const wordCount = useMemo(() => calculateWordCount(generatedBackstory), [generatedBackstory]);
    
    // ========== EVENT HANDLERS ==========

    const handleRandomPrompt = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
        setPrompt(SAMPLE_PROMPTS[randomIndex]);
        // Minimal visual feedback instead of toast to reduce noise
        const input = promptRef.current;
        if(input) {
            input.style.transition = 'background-color 0.3s';
            const originalBg = input.style.backgroundColor;
            input.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
            setTimeout(() => {
                input.style.backgroundColor = originalBg;
            }, 300);
        }
    }, [SAMPLE_PROMPTS]);

    const handleGenerateClick = useCallback(() => {
        if (!prompt.trim()) {
            toast.error(t('validation.enter_concept'));
            promptRef.current?.focus();
            return;
        }

        if (!selectedModel) {
            toast.error(t('validation.select_ai_model'));
            return;
        }

        setIsGenerating(true);
        turnstileRef.current?.execute();
    }, [prompt, selectedModel, section]);

    const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
        const options = backstoryOptionsRef.current;

        setIsGenerating(true);
        setGeneratedBackstory("");

        try {
            const requestBody = {
                prompt: prompt.trim(),
                model: selectedModel,
                locale: options.language,
                worldview: options.worldview,
                roleType: options.roleType,
                tone: options.tone,
                length: options.length,
                turnstileToken
            };

            const response = await fetch("/api/backstory/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let accumulatedContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim().startsWith('0:"')) {
                        try {
                            const content = line.slice(3, -1)
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\');

                            accumulatedContent += content;
                            setGeneratedBackstory(accumulatedContent);
                        } catch (e) {
                            console.error("Parse error:", e);
                        }
                    }
                }
            }

            if (accumulatedContent.trim()) {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#f97316', '#fb923c', '#fdba74']
                });
                toast.success(t('success.backstory_generated'));
            }

        } catch (error) {
            console.error("Backstory generation error:", error);
            toast.error(`${t('errors.generation_failed')} ${error}`);
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, selectedModel]);

    const handleTurnstileSuccess = useCallback((turnstileToken: string) => {
        handleVerificationSuccess(turnstileToken);
    }, [handleVerificationSuccess]);

    const handleTurnstileError = useCallback(() => {
        setIsGenerating(false);
        toast.error(t('errors.generation_failed'));
    }, [section]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedBackstory);
        toast.success(t('success.backstory_copied'));
    }, [generatedBackstory, section]);

    const handleSaveClick = useCallback(() => {
        const content = generatedBackstory.trim();
        if (!content) {
            if (locale === "zh") {
                toast.error("当前没有可保存的内容，请先生成一个角色背景故事。");
            } else {
                toast.error("No backstory to save yet. Please generate one first.");
            }
            return;
        }

        // 本地保存一份到 My Stories，登录与否都执行
        try {
            const rawTitle = prompt.trim() || (locale === "zh" ? "未命名角色背景" : "Untitled Backstory");
            const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
            const modelName = AI_MODELS.find(m => m.id === selectedModel)?.name || "AI";

            StoryStorage.saveStory({
                title,
                prompt: prompt.trim(),
                content,
                wordCount,
                model: modelName,
            });
        } catch (err) {
            console.error("Failed to save backstory locally:", err);
        }

        if (!user) {
            if (locale === "zh") {
                toast.error("已在本地“我的故事”中保存，登录后可以同步到云端。");
            } else {
                toast.error("Saved locally. Sign in to save this backstory to your account.");
            }
            setShowSignModal(true);
            return;
        }

        setIsSaveDialogOpen(true);
    }, [AI_MODELS, generatedBackstory, locale, prompt, selectedModel, setShowSignModal, user, wordCount]);

    const handleConfirmSave = useCallback(
        async (status: StoryStatus) => {
            if (!generatedBackstory.trim()) {
                if (locale === "zh") {
                    toast.error("当前没有可保存的内容，请先生成一个角色背景故事。");
                } else {
                    toast.error("No backstory to save yet. Please generate one first.");
                }
                return;
            }

            const content = generatedBackstory.trim();

            try {
                setIsSavingStory(true);

                const latestOptions = backstoryOptionsRef.current;
                const settings: Record<string, unknown> = {
                    locale,
                    outputLanguage: latestOptions.language,
                    worldview: latestOptions.worldview,
                    roleType: latestOptions.roleType,
                    tone: latestOptions.tone,
                    length: latestOptions.length,
                };

                const rawTitle = prompt.trim() || (locale === "zh" ? "未命名角色背景" : "Untitled Backstory");
                const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;

                const modelKey = selectedModel || "standard";
                const modelMap: Record<string, string> = {
                    fast: "gemini-2.5-flash",
                    standard: "gemini-3.1-flash-lite",
                    creative: "gemini-3-flash",
                };
                const actualModel = modelMap[modelKey] || "gemini-3.1-flash-lite";

                const resp = await fetch("/api/stories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        prompt: prompt.trim(),
                        content,
                        wordCount,
                        modelUsed: actualModel,
                        settings,
                        status,
                        visibility: status === "published" ? "public" : "private",
                        sourceCategory: "backstory",
                    }),
                });

                if (!resp.ok) {
                    throw new Error("request failed with status: " + resp.status);
                }

                const { code, message } = await resp.json();

                if (code !== 0) {
                    if (message === "no auth") {
                        setShowSignModal(true);
                    }

                    if (locale === "zh") {
                        toast.error(
                            message === "no auth"
                                ? "请先登录后再保存故事"
                                : `保存失败：${message}`
                        );
                    } else {
                        toast.error(message || "Failed to save story");
                    }
                    return;
                }

                if (locale === "zh") {
                    toast.success(status === "published" ? "故事已发布" : "故事已保存");
                } else {
                    toast.success(status === "published" ? "Story published" : "Story saved");
                }

                setIsSaveDialogOpen(false);
            } catch (error) {
                console.error("Save backstory failed", error);
                if (locale === "zh") {
                    toast.error("保存失败，请稍后再试");
                } else {
                    toast.error("Failed to save story, please try again.");
                }
            } finally {
                setIsSavingStory(false);
            }
        }, [AI_MODELS, generatedBackstory, locale, prompt, selectedModel, setShowSignModal, wordCount]
    );

    const handleLoadStory = useCallback((story: SavedStory) => {
        setPrompt(story.prompt);
        setGeneratedBackstory(story.content);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleCreateAnother = useCallback(() => {
        // Don't clear prompt, just clear result to allow refinement
        setGeneratedBackstory("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useGeneratorShortcuts({
        onGenerate: handleGenerateClick,
        onFocusInput: () => promptRef.current?.focus(),
        onQuickSave: handleSaveClick,
    });

    return (
        <div id="backstory_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
            {/* Subtle warm top glow + dot texture */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
            </div>

            <TurnstileInvisible
                ref={turnstileRef}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
            />

            <main className="container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
                {/* Breadcrumb Navigation */}
                <div className="mb-10 flex justify-start">
                    <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
                        <BackstoryBreadcrumb
                            homeText={t('ui.breadcrumb_home')}
                            currentText={t('ui.breadcrumb_current')}
                        />
                    </div>
                </div>

                {/* Header */}
                <div className="relative mx-auto max-w-2xl text-center mb-14 sm:mb-18">
                    {/* Ambient ink-mote particle layer */}
                    {!reduceMotion && (
                        <div className="pointer-events-none absolute inset-0 overflow-visible z-0" aria-hidden="true">
                            {[
                                { left: "8%", top: "16%", size: 4, delay: 0, dur: 9, peak: 0.18 },
                                { left: "90%", top: "14%", size: 6, delay: 1.5, dur: 11, peak: 0.22 },
                                { left: "14%", top: "74%", size: 5, delay: 3, dur: 10, peak: 0.16 },
                                { left: "85%", top: "70%", size: 7, delay: 2, dur: 12, peak: 0.2 },
                                { left: "30%", top: "20%", size: 4, delay: 4, dur: 8, peak: 0.14 },
                                { left: "70%", top: "84%", size: 6, delay: 5, dur: 11, peak: 0.18 },
                                { left: "20%", top: "48%", size: 5, delay: 6, dur: 13, peak: 0.2 },
                                { left: "78%", top: "36%", size: 4, delay: 1, dur: 9, peak: 0.16 },
                            ].map((d, i) => (
                                <motion.span
                                    key={i}
                                    className="absolute rounded-full bg-orange-500 dark:bg-orange-400"
                                    style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, d.peak, d.peak * 0.5, 0] }}
                                    transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Floating quill & open-book accents (writer's atelier motif) */}
                    {!reduceMotion && (
                        <>
                            <motion.div
                                className="pointer-events-none absolute z-[1] text-orange-500/50 dark:text-orange-400/50"
                                style={{ left: "3%", top: "50%" }}
                                initial={{ opacity: 0, y: 0, rotate: -8 }}
                                animate={{ opacity: [0, 0.6, 0.6, 0], y: [0, -8, 0], rotate: [-8, -3, -8] }}
                                transition={{ duration: 7, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                                aria-hidden="true"
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 21c0-5 2-9 6-13 2.5-2.5 5-4 8-5-1 3-2.5 5.5-5 8-4 4-8 6-9 10z" fill="currentColor" opacity="0.4" />
                                    <path d="M3 21l8-8 M11 13c2-2 4-3.5 6-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                            </motion.div>
                            <motion.div
                                className="pointer-events-none absolute z-[1] text-amber-500/50 dark:text-amber-400/50"
                                style={{ right: "5%", top: "42%" }}
                                initial={{ opacity: 0, y: 0, rotate: 10 }}
                                animate={{ opacity: [0, 0.55, 0.55, 0], y: [0, -6, 0], rotate: [10, 4, 10] }}
                                transition={{ duration: 8, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                aria-hidden="true"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 6c-2.5-1.5-5.5-2-9-1.5v13c3.5-0.5 6.5 0 9 1.5 2.5-1.5 5.5-2 9-1.5v-13c-3.5-0.5-6.5 0-9 1.5z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.25" strokeLinejoin="round" />
                                    <path d="M12 6v13" stroke="currentColor" strokeWidth="1" />
                                </svg>
                            </motion.div>
                        </>
                    )}

                    {/* Slowly rotating writer's compass ring (concentric circles + radial ticks) */}
                    {!reduceMotion && (
                        <motion.div
                            className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/30 dark:text-orange-400/30"
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{ opacity: [0, 0.55, 0.4], rotate: -360 }}
                            transition={{ opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 80, repeat: Infinity, ease: "linear" } }}
                            aria-hidden="true"
                        >
                            <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
                                <circle cx="180" cy="180" r="170" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 5" />
                                <circle cx="180" cy="180" r="138" stroke="currentColor" strokeWidth="0.4" />
                                <circle cx="180" cy="180" r="108" stroke="currentColor" strokeWidth="0.5" strokeDasharray="0.5 4" />
                                <path d="M180 8 L180 24 M180 336 L180 352 M8 180 L24 180 M336 180 L352 180" stroke="currentColor" strokeWidth="1" />
                                <path d="M127 127 L138 138 M233 127 L222 138 M127 233 L138 222 M233 233 L222 222" stroke="currentColor" strokeWidth="0.6" />
                            </svg>
                        </motion.div>
                    )}

                    {/* Chapter numerals watermark (editorial italic Roman numerals) */}
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
                        <span className="absolute left-[6%] top-[20%] font-display italic font-bold text-2xl text-orange-500/[0.07] dark:text-orange-400/[0.07]">I</span>
                        <span className="absolute right-[7%] top-[14%] font-display italic font-bold text-xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">II</span>
                        <span className="absolute left-[10%] bottom-[16%] font-display italic font-bold text-lg text-orange-500/[0.06] dark:text-orange-400/[0.06]">III</span>
                        <span className="absolute right-[9%] bottom-[18%] font-display italic font-bold text-2xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">IV</span>
                        <span className="absolute left-[28%] top-[8%] font-display italic font-bold text-base text-orange-500/[0.05] dark:text-orange-400/[0.05]">V</span>
                        <span className="absolute right-[26%] bottom-[6%] font-display italic font-bold text-xl text-orange-500/[0.06] dark:text-orange-400/[0.06]">VI</span>
                    </div>

                    {/* Double-bezel icon container with creative hover flare */}
                    <div className="group relative z-10 flex justify-center mb-6">
                        <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
                            ✦
                        </span>
                        <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
                            ✒
                        </span>
                        <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                                <User className="size-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>

                    {/* Eyebrow badge */}
                    <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
                        <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
                        AI Character Builder
                    </span>

                    {/* Title with italic gradient emphasis on "Backstory" */}
                    <h1 className="relative z-10 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.08] mt-4">
                        Free{" "}
                        <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
                            Backstory
                        </span>
                        {" "}Generator
                    </h1>

                    {/* Editorial decorative anchor: rune + halftone + quill + halftone + rune */}
                    <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
                        <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">✦</span>
                        {[3, 5, 7, 5, 3].map((s, i) => (
                            <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
                        ))}
                        <span className="text-amber-500/45 dark:text-amber-400/45 text-base">✒</span>
                        {[3, 5, 7, 5, 3].map((s, i) => (
                            <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
                        ))}
                        <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">✧</span>
                    </div>

                    <p className="relative z-10 text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
                        {t('ui.subtitle')}
                    </p>

                    {/* Theme pills */}
                    {section?.ui?.theme_pills?.length ? (
                        <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2">
                            {section.ui.theme_pills.map((pill: string, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                                    <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                                    {pill}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>

                <GeneratorNavTabs />

                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT PANEL: Controls */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-6 lg:sticky lg:top-24"
                    >
                        <div
                            ref={leftPanelRef}
                            className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5"
                        >
                            
                            {/* Prompt Input */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-orange-500" />
                                        {t('ui.character_concept')}
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRandomPrompt}
                                        className="h-7 text-xs gap-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 px-2.5 rounded-full"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        {t('ui.random_button')}
                                    </Button>
                                </div>
                                <div className="relative group">
                                    <Textarea
                                        ref={promptRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={t('placeholders.character_concept')}
                                        className="min-h-[140px] resize-none bg-muted/50 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl p-4 text-base leading-relaxed transition-all shadow-sm"
                                    />
                                    {prompt && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setPrompt("")}
                                            className="absolute bottom-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <Eraser className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-border/50 my-6" />

                            {/* Quick Settings */}
                            <div className="space-y-5">
                                {/* Model & Lang */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium tracking-wide text-muted-foreground">{t('ui.ai_model')}</Label>
                                        <Select value={selectedModel || ""} onValueChange={setSelectedModel}>
                                            <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AI_MODELS.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium tracking-wide text-muted-foreground">{t('ui.output_language')}</Label>
                                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                            <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGE_OPTIONS.map(l => (
                                                    <SelectItem key={l.code} value={l.code}><span className="mr-2">{l.flag}</span>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Worldview Chips */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">{t('ui.worldview')}</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {WORLDVIEW_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedWorldview(opt.id)}
                                                className={cn(
                                                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                                    selectedWorldview === opt.id
                                                        ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                                                        : "bg-transparent border-border/50 text-muted-foreground hover:border-orange-500/20 hover:text-foreground"
                                                )}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced Settings */}
                                <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                            <span className="flex items-center gap-1.5">
                                                <Settings2 className="w-3.5 h-3.5" />
                                                {t('ui.advanced_options')}
                                            </span>
                                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvancedOptions && "rotate-180")} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-4 space-y-5 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                                        {/* Role Type */}
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">{t('ui.role_type')}</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {ROLE_TYPE_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setSelectedRoleType(opt.id)}
                                                        className={cn(
                                                            "px-2 py-1.5 rounded-md text-xs font-medium border text-left transition-all flex items-center gap-2",
                                                            selectedRoleType === opt.id
                                                                ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                                                                : "bg-transparent border-border/50 text-muted-foreground hover:border-orange-500/20 hover:text-foreground"
                                                        )}
                                                    >
                                                        <span>{opt.icon}</span>
                                                        {opt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Length */}
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">{t('ui.output_length')}</Label>
                                            <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/50">
                                                {(['short', 'medium', 'detailed'] as const).map((len) => (
                                                    <button
                                                        key={len}
                                                        onClick={() => setSelectedLength(len)}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all",
                                                            selectedLength === len
                                                                ? "bg-background shadow-sm text-foreground"
                                                                : "text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {t(`length.${len}`)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tone */}
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">{t('ui.tone')}</Label>
                                            <Select value={selectedTone} onValueChange={setSelectedTone}>
                                                <SelectTrigger className="h-8 text-xs bg-muted/50 border-border/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TONE_OPTIONS.map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>

                            {/* Generate Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={handleGenerateClick}
                                    disabled={isGenerating}
                                    className="group w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600 transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                            {t('ui.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative inline-flex items-center justify-center mr-2">
                                                <Sparkles className="w-5 h-5 relative z-10 fill-white/20" />
                                                {!reduceMotion && (
                                                    <svg
                                                        className="pointer-events-none absolute -inset-2 size-9 text-white/0 group-hover:animate-spark-bloom"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M12 0 L13.5 9.5 L22 4 L17 12 L24 12 L17 13.5 L22 22 L13.5 16 L12 24 L10.5 16 L2 22 L7 13.5 L0 12 L7 12 L2 4 L10.5 9.5 Z" fill="rgb(255 255 255 / 0.85)" />
                                                    </svg>
                                                )}
                                            </span>
                                            {t('ui.generate_button')}
                                        </>
                                    )}
                                </Button>
                                <GeneratorShortcutHints />
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT PANEL: Output */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        ref={resultRef}
                        className="min-h-[500px] relative"
                        style={rightPanelHeight ? { height: rightPanelHeight } : undefined}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/5 rounded-[2rem] blur-2xl -z-10" />
                        
                        <div className={cn(
                            "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                            generatedBackstory
                                ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                                : "bg-card/40 shadow-xl border-dashed"
                        )}>
                            
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">{t('output.title')}</span>
                                        {generatedBackstory && (
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                                                {wordCount} {t('output.words')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StoryHistoryDropdown
                                        onLoadStory={handleLoadStory}
                                        locale={locale}
                                    />
                                    {generatedBackstory && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopy}
                                            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            {t('output.copy')}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div ref={outputScrollRef} className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                                {generatedBackstory ? (
                                    <div className="animate-fade-in">
                                        <article className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-serif prose-p:font-serif prose-p:text-slate-700 dark:prose-p:text-slate-300">
                                            <ReactMarkdown>{generatedBackstory}</ReactMarkdown>
                                        </article>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                                        {isGenerating ? (
                                            <div className="space-y-6">
                                                <div className="relative mx-auto w-16 h-16">
                                                    <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                                                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                                                </div>
                                                <p className="text-sm font-medium animate-pulse">{t('output.generating_message')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-w-xs mx-auto">
                                                <div className="w-16 h-16 mx-auto bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                                                    <Wand2 className="w-8 h-8 text-orange-400/50" />
                                                </div>
                                                <p className="text-muted-foreground text-sm">
                                                    {t('output.empty_message')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {generatedBackstory && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 pt-8 border-t border-dashed border-border/50"
                    >
                        <CompletionGuide
                            translations={section.completion_guide}
                            onCreateAnother={handleCreateAnother}
                            onSave={handleSaveClick}
                            onContinue={() => {
                                try {
                                    window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedBackstory }));
                                } catch {}
                                router.push(buildContinueRoute({ source: "backstory-generator" }) as any);
                            }}
                            continueLabel={section.completion_guide.continue_label}
                            isSaveDisabled={isSavingStory}
                        />
                    </motion.div>
                )}
            </main>

            <StorySaveDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                onSelect={handleConfirmSave}
                locale={locale}
                isSaving={isSavingStory}
            />
        </div>
    );
}
