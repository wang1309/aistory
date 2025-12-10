"use client";

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
import { StoryStorage } from "@/lib/story-storage";
import { ChevronDown, Settings2, Sparkles, Copy, RefreshCw, Wand2, BookOpen, Eraser } from "lucide-react";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import StoryHistoryDropdown from "@/components/story-history-dropdown";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useAppContext } from "@/contexts/app";
import type { StoryStatus } from "@/models/story";
import type { BackstoryGenerate as BackstoryGenerateType } from "@/types/blocks/backstory-generate";
import type { SavedStory } from "@/lib/story-storage";
import BackstoryBreadcrumb from "./breadcrumb";

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
    section?: BackstoryGenerateType;
}

export default function BackstoryGenerate({ section }: BackstoryGenerateProps) {
    const locale = useLocale();
    const { user, setShowSignModal } = useAppContext();

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
            icon: '⚡',
            description: t('ai_models.fast_description')
        },
        {
            id: 'standard',
            name: t('ai_models.standard'),
            badge: 'RECOMMENDED',
            badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            icon: '✨',
            description: t('ai_models.standard_description')
        },
        {
            id: 'creative',
            name: t('ai_models.creative'),
            badge: 'PRO',
            badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            icon: '🎨',
            description: t('ai_models.creative_description')
        }
    ], [section]);

    // ========== LANGUAGE OPTIONS ==========
    const LANGUAGE_OPTIONS = useMemo(() => [
        { code: 'en', name: 'English', flag: '\ud83c\uddfa\ud83c\uddf8' },
        { code: 'zh', name: '\u4e2d\u6587', flag: '\ud83c\udde8\ud83c\uddf3' },
        { code: 'ja', name: '\u65e5\u672c\u8a9e', flag: '\ud83c\uddef\ud83c\uddf5' },
        { code: 'ko', name: '\ud55c\uad6d\uc5b4', flag: '\ud83c\uddf0\ud83c\uddf7' },
        { code: 'es', name: 'Espa\u00f1ol', flag: '\ud83c\uddea\ud83c\uddf8' },
        { code: 'fr', name: 'Fran\u00e7ais', flag: '\ud83c\uddeb\ud83c\uddf7' },
        { code: 'de', name: 'Deutsch', flag: '\ud83c\udde9\ud83c\uddea' },
        { code: 'pt', name: 'Portugu\u00eas', flag: '\ud83c\uddf5\ud83c\uddf9' },
        { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', flag: '\ud83c\uddf7\ud83c\uddfa' },
        { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', flag: '\ud83c\udde6\ud83c\uddea' },
        { code: 'hi', name: '\u0939\u093f\u0928\u094d\u0926\u0940', flag: '\ud83c\uddee\ud83c\uddf3' },
        { code: 'it', name: 'Italiano', flag: '\ud83c\uddee\ud83c\uddf9' },
    ], []);

    // ========== WORLDVIEW OPTIONS ==========
    const WORLDVIEW_OPTIONS = useMemo(() => [
        { id: 'fantasy', name: t('worldview.fantasy'), icon: '🏰' },
        { id: 'scifi', name: t('worldview.scifi'), icon: '🚀' },
        { id: 'urban', name: t('worldview.urban'), icon: '🏙️' },
        { id: 'xianxia', name: t('worldview.xianxia'), icon: '⛩️' },
        { id: 'historical', name: t('worldview.historical'), icon: '📜' },
        { id: 'cyberpunk', name: t('worldview.cyberpunk'), icon: '🤖' }
    ], [section]);

    // ========== ROLE TYPE OPTIONS ==========
    const ROLE_TYPE_OPTIONS = useMemo(() => [
        { id: 'protagonist', name: t('role_type.protagonist'), icon: '⭐' },
        { id: 'supporting', name: t('role_type.supporting'), icon: '🌟' },
        { id: 'antagonist', name: t('role_type.antagonist'), icon: '😈' },
        { id: 'npc', name: t('role_type.npc'), icon: '👤' },
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
    const [selectedModel, setSelectedModel] = useState<string | null>('fast');
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
    
    const completionGuideTranslations = useMemo(() => {
        if (locale === "zh") {
            return {
                title: "喜欢这个设定吗？",
                subtitle: "保存它，或基于此继续创作。",
                create_another: "再试一次",
                share_action: "保存故事",
            };
        }
        return {
            title: "Like this backstory?",
            subtitle: "Save it or use it to create your story.",
            create_another: "Try Again",
            share_action: "Save Story",
        };
    }, [locale]);

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
                    colors: ['#9333ea', '#c084fc', '#e879f9']
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
                    fast: "gemini-2.5-flash-lite",
                    standard: "gemini-2.5-flash",
                    creative: "gemini-2.5-flash-think",
                };
                const actualModel = modelMap[modelKey] || "gemini-2.5-flash";

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
        <div id="backstory_generator" className="min-h-screen bg-background text-foreground selection:bg-purple-500/20">
            {/* Refined Ambient Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent" />
                <div className="absolute -top-[20%] right-[10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute -top-[10%] left-[10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
            </div>

            <TurnstileInvisible
                ref={turnstileRef}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
            />

            <main className="container max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
                {/* Breadcrumb Navigation */}
                <div className="mb-6 flex justify-start">
                    <div className="inline-flex items-center rounded-full border border-border/60 bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
                        <BackstoryBreadcrumb
                            homeText={t('ui.breadcrumb_home')}
                            currentText={t('ui.breadcrumb_current')}
                        />
                    </div>
                </div>

                {/* Minimal Header */}
                <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                            {t('ui.title')}
                        </h1>
                        <p className="text-lg text-muted-foreground/80 leading-relaxed">
                            {t('ui.subtitle')}
                        </p>
                    </motion.div>
                </div>

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
                            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5"
                        >
                            
                            {/* Prompt Input */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        {t('ui.character_concept')}
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRandomPrompt}
                                        className="h-7 text-xs gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 px-2.5 rounded-full"
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
                                        className="min-h-[140px] resize-none bg-white/50 dark:bg-black/20 border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl p-4 text-base leading-relaxed transition-all shadow-sm"
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
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ui.ai_model')}</Label>
                                        <Select value={selectedModel || ""} onValueChange={setSelectedModel}>
                                            <SelectTrigger className="h-9 bg-white/50 dark:bg-black/20 border-border/50 rounded-lg">
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
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ui.output_language')}</Label>
                                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                            <SelectTrigger className="h-9 bg-white/50 dark:bg-black/20 border-border/50 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGE_OPTIONS.map(l => (
                                                    <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Worldview Chips */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ui.worldview')}</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {WORLDVIEW_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedWorldview(opt.id)}
                                                className={cn(
                                                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                                    selectedWorldview === opt.id
                                                        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                                                        : "bg-transparent border-border/50 text-muted-foreground hover:border-purple-500/20 hover:text-foreground"
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
                                        <Button variant="ghost" className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
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
                                                                ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                                                                : "bg-transparent border-border/50 text-muted-foreground hover:border-purple-500/20 hover:text-foreground"
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
                                                <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50">
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
                                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all hover:scale-[1.01] rounded-xl"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                            {t('ui.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2 fill-white/20" />
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
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-blue-500/5 rounded-[2rem] blur-2xl -z-10" />
                        
                        <div className={cn(
                            "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col",
                            generatedBackstory 
                                ? "bg-white/80 dark:bg-slate-950/80 shadow-2xl shadow-purple-500/10" 
                                : "bg-white/40 dark:bg-slate-900/40 shadow-xl border-dashed"
                        )}>
                            
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/20 dark:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
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
                                                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin" />
                                                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-500 animate-pulse" />
                                                </div>
                                                <p className="text-sm font-medium animate-pulse">{t('output.generating_message')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-w-xs mx-auto">
                                                <div className="w-16 h-16 mx-auto bg-purple-500/5 rounded-2xl flex items-center justify-center rotate-3">
                                                    <Wand2 className="w-8 h-8 text-purple-400/50" />
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
                            translations={completionGuideTranslations}
                            onCreateAnother={handleCreateAnother}
                            onSave={handleSaveClick}
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
