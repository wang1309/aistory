"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { FantasyGenerate as FantasyGenerateType } from "@/types/blocks/fantasy-generate";
import { useLocale } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { Wand2, Sparkles, Zap, Palette, PenTool, BookOpen, Globe, Users, Scroll } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// ========== HELPER FUNCTIONS ==========

function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  const withoutCJK = trimmed.replace(cjkRegex, " ").trim();
  const englishWords = withoutCJK.split(/\s+/).filter((word) => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;
  return cjkCount + englishCount;
}

// ========== COMPONENT ==========

export default function FantasyGenerate({ section }: { section: FantasyGenerateType }) {
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, setShowSignModal } = useAppContext();

  // Mode state
  const [mode, setMode] = useState<"quick" | "worldbuilder">("quick");
  const [currentStep, setCurrentStep] = useState(1);

  // Quick mode state
  const [prompt, setPrompt] = useState("");
  const [subgenre, setSubgenre] = useState("high_fantasy");
  const [tone, setTone] = useState("none");
  const [audience, setAudience] = useState("none");
  const [length, setLength] = useState("short");
  const [perspective, setPerspective] = useState("none");

  // Worldbuilder mode state
  const [wbSubgenre, setWbSubgenre] = useState("high_fantasy");
  const [era, setEra] = useState("medieval");
  const [worldOverview, setWorldOverview] = useState("");
  const [factions, setFactions] = useState("");
  const [magicSource, setMagicSource] = useState("innate");
  const [magicCost, setMagicCost] = useState("");
  const [magicLimitations, setMagicLimitations] = useState("");
  const [protagonistName, setProtagonistName] = useState("");
  const [protagonistRaceClass, setProtagonistRaceClass] = useState("");
  const [protagonistPersonality, setProtagonistPersonality] = useState("");
  const [protagonistBackground, setProtagonistBackground] = useState("");
  const [protagonistGoal, setProtagonistGoal] = useState("");
  const [antagonistName, setAntagonistName] = useState("");
  const [antagonistMotivation, setAntagonistMotivation] = useState("");
  const [antagonistRelationship, setAntagonistRelationship] = useState("");
  const [mainQuest, setMainQuest] = useState("");
  const [keyEvents, setKeyEvents] = useState("");
  const [twists, setTwists] = useState("");

  // AI model state
  const [selectedModel, setSelectedModel] = useState("standard");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [generatedWorldview, setGeneratedWorldview] = useState("");
  const [generatedCharacters, setGeneratedCharacters] = useState("");
  const [generatedOutline, setGeneratedOutline] = useState("");
  const [activeOutputTab, setActiveOutputTab] = useState("story");

  // Refs
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Word count
  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  // AI Models config
  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: section.ai_models.models.fast.name,
        badge: section.ai_models.models.fast.badge,
        badgeColor: "bg-green-500/10 text-green-600 border-green-500/30",
        icon: <Zap className="h-4 w-4" />,
        speed: section.ai_models.models.fast.speed,
        description: section.ai_models.models.fast.description,
      },
      {
        id: "standard",
        name: section.ai_models.models.standard.name,
        badge: section.ai_models.models.standard.badge,
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        icon: <PenTool className="h-4 w-4" />,
        speed: section.ai_models.models.standard.speed,
        description: section.ai_models.models.standard.description,
      },
      {
        id: "creative",
        name: section.ai_models.models.creative.name,
        badge: section.ai_models.models.creative.badge,
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
        icon: <Palette className="h-4 w-4" />,
        speed: section.ai_models.models.creative.speed,
        description: section.ai_models.models.creative.description,
      },
    ],
    [section]
  );

  // Worldbuilder steps
  const steps = [
    { id: 1, title: section.worldbuilder_mode.steps.subgenre.title, icon: BookOpen },
    { id: 2, title: section.worldbuilder_mode.steps.setting.title, icon: Globe },
    { id: 3, title: section.worldbuilder_mode.steps.magic_system.title, icon: Sparkles },
    { id: 4, title: section.worldbuilder_mode.steps.characters.title, icon: Users },
    { id: 5, title: section.worldbuilder_mode.steps.plot.title, icon: Scroll },
  ];

  // Scroll to output when generating
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isGenerating]);

  // Handle generate click
  const handleGenerateClick = useCallback(() => {
    if (mode === "quick" && !prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return;
    }
    if (!subgenre && mode === "quick") {
      toast.error(section.toasts.error_no_subgenre);
      return;
    }
    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return;
    }

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [mode, prompt, subgenre, selectedModel, section]);

  // Perform generation
  const performGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        setGeneratedStory("");
        setGeneratedWorldview("");
        setGeneratedCharacters("");
        setGeneratedOutline("");

        const requestBody = {
          mode,
          prompt: mode === "quick" ? prompt.trim() : undefined,
          subgenre: mode === "quick" ? subgenre : wbSubgenre,
          tone: mode === "quick" ? tone : undefined,
          audience: mode === "quick" ? audience : undefined,
          length: mode === "quick" ? length : undefined,
          perspective: mode === "quick" ? perspective : undefined,
          setting:
            mode === "worldbuilder"
              ? {
                  era,
                  worldOverview,
                  factions,
                }
              : undefined,
          magicSystem:
            mode === "worldbuilder"
              ? {
                  source: magicSource,
                  cost: magicCost,
                  limitations: magicLimitations,
                }
              : undefined,
          protagonist:
            mode === "worldbuilder"
              ? {
                  name: protagonistName,
                  raceClass: protagonistRaceClass,
                  personality: protagonistPersonality,
                  background: protagonistBackground,
                  goal: protagonistGoal,
                }
              : undefined,
          antagonist:
            mode === "worldbuilder"
              ? {
                  name: antagonistName,
                  motivation: antagonistMotivation,
                  relationship: antagonistRelationship,
                }
              : undefined,
          plot:
            mode === "worldbuilder"
              ? {
                  mainQuest,
                  keyEvents,
                  twists,
                }
              : undefined,
          model: selectedModel,
          locale,
          outputLanguage: locale,
          turnstileToken,
        };

        const response = await fetch("/api/fantasy-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || section.toasts.error_generate_failed);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          toast.error(section.toasts.error_no_stream);
          return;
        }

        let accumulatedText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                if (typeof parsed === "string") {
                  accumulatedText += parsed;
                  setGeneratedStory(accumulatedText);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        if (accumulatedText.trim()) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success(section.toasts.success_generated);
        } else {
          toast.error(section.toasts.error_no_content);
        }
      } catch (error) {
        console.error("Generation failed:", error);
        toast.error(section.toasts.error_generate_failed);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      mode,
      prompt,
      subgenre,
      wbSubgenre,
      tone,
      audience,
      length,
      perspective,
      era,
      worldOverview,
      factions,
      magicSource,
      magicCost,
      magicLimitations,
      protagonistName,
      protagonistRaceClass,
      protagonistPersonality,
      protagonistBackground,
      protagonistGoal,
      antagonistName,
      antagonistMotivation,
      antagonistRelationship,
      mainQuest,
      keyEvents,
      twists,
      selectedModel,
      locale,
      section,
    ]
  );

  const handleTurnstileSuccess = useCallback(
    (token: string) => {
      performGeneration(token);
    },
    [performGeneration]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(section.toasts.error_generate_failed);
  }, [section]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedStory);
    toast.success(section.toasts.success_copied);
  }, [generatedStory, section]);

  // ========== RENDER ==========

  return (
    <section id="fantasy_generator" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-orange-500/30">
      {/* Invisible Turnstile */}
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-24 sm:py-32 relative">
        {/* Header */}
        <div className="relative text-center mb-14 sm:mb-18">
          {/* Ambient: warm crystal motes */}
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
              {[
                { left: "12%", top: "18%", size: 5, delay: 0, dur: 10, peak: 0.22 },
                { left: "88%", top: "22%", size: 6, delay: 1.4, dur: 12, peak: 0.2 },
                { left: "22%", top: "78%", size: 4, delay: 2.8, dur: 9, peak: 0.16 },
                { left: "78%", top: "74%", size: 5, delay: 1.8, dur: 11, peak: 0.18 },
                { left: "32%", top: "12%", size: 4, delay: 3.5, dur: 8, peak: 0.14 },
                { left: "68%", top: "84%", size: 6, delay: 4.2, dur: 13, peak: 0.2 },
                { left: "8%", top: "52%", size: 4, delay: 2.2, dur: 9, peak: 0.16 },
                { left: "92%", top: "48%", size: 5, delay: 5, dur: 11, peak: 0.18 },
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

          {/* Floating crystal shards (mystical realm motif) */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/55 dark:text-orange-400/55"
                style={{ left: "3%", top: "44%" }}
                initial={{ opacity: 0, y: 0, rotate: -10 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], y: [0, -10, 0], rotate: [-10, -3, -10] }}
                transition={{ duration: 7.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="32" height="36" viewBox="0 0 24 28" fill="none">
                  <path d="M12 2 L20 9 L12 26 L4 9 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.22" strokeLinejoin="round" />
                  <path d="M12 2 L20 9 L12 11 L4 9 Z" stroke="currentColor" strokeWidth="0.7" fill="currentColor" fillOpacity="0.32" strokeLinejoin="round" />
                  <path d="M4 9 L12 11 L12 26" stroke="currentColor" strokeWidth="0.5" fill="none" />
                  <path d="M20 9 L12 11 L12 26" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </svg>
              </motion.div>
              <motion.div
                className="pointer-events-none absolute z-[1] text-amber-500/55 dark:text-amber-400/55"
                style={{ right: "4%", top: "40%" }}
                initial={{ opacity: 0, y: 0, rotate: 12 }}
                animate={{ opacity: [0, 0.65, 0.65, 0], y: [0, -7, 0], rotate: [12, 5, 12] }}
                transition={{ duration: 8.5, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="28" height="32" viewBox="0 0 24 28" fill="none">
                  <path d="M12 2 L19 8 L12 26 L5 8 Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
                  <path d="M12 2 L19 8 L12 10 L5 8 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.3" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </>
          )}

          {/* Slowly rotating central crystal cluster with light refractions */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/35 dark:text-orange-400/35"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: [0, 0.6, 0.45], rotate: 360 }}
              transition={{ opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 90, repeat: Infinity, ease: "linear" } }}
              aria-hidden="true"
            >
              <svg width="420" height="280" viewBox="0 0 420 280" fill="none">
                <line x1="210" y1="140" x2="40" y2="40" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 6" opacity="0.4" />
                <line x1="210" y1="140" x2="380" y2="40" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 6" opacity="0.4" />
                <line x1="210" y1="140" x2="40" y2="240" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 6" opacity="0.4" />
                <line x1="210" y1="140" x2="380" y2="240" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 6" opacity="0.4" />
                <line x1="210" y1="140" x2="20" y2="140" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 5" opacity="0.3" />
                <line x1="210" y1="140" x2="400" y2="140" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 5" opacity="0.3" />
                <circle cx="210" cy="140" r="105" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 8" fill="none" opacity="0.3" />
                <circle cx="210" cy="140" r="62" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 6" fill="none" opacity="0.4" />
                <g transform="translate(210 140)">
                  <path d="M0 -52 L32 -16 L19 48 L-19 48 L-32 -16 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
                  <path d="M0 -52 L32 -16 L0 -8 L-32 -16 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.22" strokeLinejoin="round" />
                  <path d="M-32 -16 L0 -8 L-19 48 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
                  <path d="M32 -16 L0 -8 L19 48 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </g>
                <g transform="translate(54 58)">
                  <path d="M0 -12 L7 -3 L5 12 L-5 12 L-7 -3 Z" stroke="currentColor" strokeWidth="0.7" fill="currentColor" fillOpacity="0.22" strokeLinejoin="round" />
                </g>
                <g transform="translate(366 58)">
                  <path d="M0 -14 L8 -4 L6 14 L-6 14 L-8 -4 Z" stroke="currentColor" strokeWidth="0.7" fill="currentColor" fillOpacity="0.22" strokeLinejoin="round" />
                </g>
                <g transform="translate(54 222)">
                  <path d="M0 -10 L6 -2 L4 10 L-4 10 L-6 -2 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
                </g>
                <g transform="translate(366 222)">
                  <path d="M0 -13 L7 -3 L5 13 L-5 13 L-7 -3 Z" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
                </g>
              </svg>
            </motion.div>
          )}

          {/* Editorial watermark: crystal facets, sparks, diamonds */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
            <span className="absolute left-[5%] top-[20%] font-display italic font-bold text-2xl text-orange-500/[0.08] dark:text-orange-400/[0.08]">❖</span>
            <span className="absolute right-[6%] top-[14%] font-display italic font-bold text-xl text-amber-500/[0.08] dark:text-amber-400/[0.08]">✦</span>
            <span className="absolute left-[9%] bottom-[16%] font-display italic font-bold text-lg text-orange-500/[0.07] dark:text-orange-400/[0.07]">✧</span>
            <span className="absolute right-[8%] bottom-[18%] font-display italic font-bold text-2xl text-amber-500/[0.08] dark:text-amber-400/[0.08]">❖</span>
            <span className="absolute left-[26%] top-[8%] font-display italic font-bold text-base text-orange-500/[0.06] dark:text-orange-400/[0.06]">✦</span>
            <span className="absolute right-[24%] bottom-[6%] font-display italic font-bold text-xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">✧</span>
          </div>

          {/* Double-bezel icon container with crystal hover flare */}
          <div className="group relative z-10 flex justify-center mb-6">
            <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
              ❖
            </span>
            <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
              ✦
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon name="RiGemLine" className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            AI Fantasy Writer
          </span>

          {/* Title with italic gradient emphasis on "Story" */}
          <h1 className="relative z-10 font-display text-5xl sm:text-7xl font-bold tracking-tighter leading-[0.9] mt-4">
            <span className="text-foreground">Fantasy{" "}</span>
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Story
            </span>
            <span className="text-foreground"> Generator</span>
          </h1>

          {/* Editorial decorative anchor: diamond + halftone + spark + halftone + four-star */}
          <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">❖</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={`a-${i}`} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-amber-500/45 dark:text-amber-400/45 text-base">✧</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={`b-${i}`} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">✦</span>
          </div>

          <p className="relative z-10 text-lg sm:text-xl text-muted-foreground/65 max-w-xl mx-auto font-light leading-relaxed">
            {section.header.subtitle}
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

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "worldbuilder")} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass-premium">
            <TabsTrigger value="quick" className="data-[state=active]:bg-orange-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              {section.mode_tabs.quick}
            </TabsTrigger>
            <TabsTrigger value="worldbuilder" className="data-[state=active]:bg-orange-500/20">
              <Globe className="w-4 h-4 mr-2" />
              {section.mode_tabs.worldbuilder}
            </TabsTrigger>
          </TabsList>

          {/* Quick Mode Content */}
          <TabsContent value="quick" className="mt-8">
            <div className="glass-premium rounded-3xl p-8 space-y-6">
              {/* Story Idea */}
              <div>
                <Label className="text-lg font-semibold mb-2 block">
                  {section.quick_mode.prompt.label}
                  <span className="text-destructive ml-1">{section.quick_mode.prompt.required}</span>
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                  placeholder={section.quick_mode.prompt.placeholder}
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {section.quick_mode.prompt.character_counter.replace("{{count}}", prompt.length.toString())}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Subgenre */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.subgenre.label}</Label>
                  <Select value={subgenre} onValueChange={setSubgenre}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.subgenre.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.subgenre.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.tone.label}</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.tone.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.tone.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audience */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.audience.label}</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.audience.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.audience.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.length.label}</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.length.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.length.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Perspective */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.perspective.label}</Label>
                  <Select value={perspective} onValueChange={setPerspective}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.perspective.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.perspective.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Worldbuilder Mode Content */}
          <TabsContent value="worldbuilder" className="mt-8">
            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        currentStep === step.id
                          ? "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <step.icon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-border mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-8">
              {/* Step 1: Subgenre */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.subgenre.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.subgenre.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(section.worldbuilder_mode.subgenre.options).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setWbSubgenre(key)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all hover:border-orange-500/50 active:scale-95",
                          wbSubgenre === key
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-border"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Setting */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.setting.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.setting.description}</p>
                  
                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.era.label}</Label>
                    <Select value={era} onValueChange={setEra}>
                      <SelectTrigger>
                        <SelectValue placeholder={section.worldbuilder_mode.setting.era.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(section.worldbuilder_mode.setting.era.options).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.world_overview.label}</Label>
                    <Textarea
                      value={worldOverview}
                      onChange={(e) => setWorldOverview(e.target.value)}
                      placeholder={section.worldbuilder_mode.setting.world_overview.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.factions.label}</Label>
                    <Textarea
                      value={factions}
                      onChange={(e) => setFactions(e.target.value)}
                      placeholder={section.worldbuilder_mode.setting.factions.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Magic System */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.magic_system.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.magic_system.description}</p>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.source.label}</Label>
                    <Select value={magicSource} onValueChange={setMagicSource}>
                      <SelectTrigger>
                        <SelectValue placeholder={section.worldbuilder_mode.magic_system.source.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(section.worldbuilder_mode.magic_system.source.options).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.cost.label}</Label>
                    <Textarea
                      value={magicCost}
                      onChange={(e) => setMagicCost(e.target.value)}
                      placeholder={section.worldbuilder_mode.magic_system.cost.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.limitations.label}</Label>
                    <Textarea
                      value={magicLimitations}
                      onChange={(e) => setMagicLimitations(e.target.value)}
                      placeholder={section.worldbuilder_mode.magic_system.limitations.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Characters */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.characters.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.characters.description}</p>

                  {/* Protagonist */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-orange-600 dark:text-orange-400">
                      {section.worldbuilder_mode.characters.protagonist.label}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.name.label}</Label>
                        <Input
                          value={protagonistName}
                          onChange={(e) => setProtagonistName(e.target.value)}
                          placeholder={section.worldbuilder_mode.characters.protagonist.name.placeholder}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.race_class.label}</Label>
                        <Input
                          value={protagonistRaceClass}
                          onChange={(e) => setProtagonistRaceClass(e.target.value)}
                          placeholder={section.worldbuilder_mode.characters.protagonist.race_class.placeholder}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.personality.label}</Label>
                      <Input
                        value={protagonistPersonality}
                        onChange={(e) => setProtagonistPersonality(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.personality.placeholder}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.background.label}</Label>
                      <Textarea
                        value={protagonistBackground}
                        onChange={(e) => setProtagonistBackground(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.background.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.goal.label}</Label>
                      <Textarea
                        value={protagonistGoal}
                        onChange={(e) => setProtagonistGoal(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.goal.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Antagonist */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">
                      {section.worldbuilder_mode.characters.antagonist.label}
                    </h4>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.name.label}</Label>
                      <Input
                        value={antagonistName}
                        onChange={(e) => setAntagonistName(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.name.placeholder}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.motivation.label}</Label>
                      <Textarea
                        value={antagonistMotivation}
                        onChange={(e) => setAntagonistMotivation(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.motivation.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.relationship.label}</Label>
                      <Textarea
                        value={antagonistRelationship}
                        onChange={(e) => setAntagonistRelationship(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.relationship.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Plot */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.plot.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.plot.description}</p>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.main_quest.label}</Label>
                    <Textarea
                      value={mainQuest}
                      onChange={(e) => setMainQuest(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.main_quest.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.key_events.label}</Label>
                    <Textarea
                      value={keyEvents}
                      onChange={(e) => setKeyEvents(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.key_events.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.twists.label}</Label>
                    <Textarea
                      value={twists}
                      onChange={(e) => setTwists(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.twists.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                >
                  {section.navigation.previous}
                </Button>
                {currentStep < 5 ? (
                  <Button
                    onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {section.navigation.next}
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Model Selection */}
        <div className="glass-premium rounded-3xl p-8 mb-8">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Icon name="mdi:brain" className="w-5 h-5" />
            {section.ai_models.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{section.ai_models.hint}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "card-hover-lift p-4 rounded-xl border-2 text-left transition-all hover:border-orange-500/50 active:scale-95 relative",
                  selectedModel === model.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "absolute top-2 right-2 text-xs px-2 py-1 rounded-full border",
                    model.badgeColor
                  )}
                >
                  {model.badge}
                </div>
                <div className="text-2xl mb-2">{model.icon}</div>
                <div className="font-semibold mb-1">{model.name}</div>
                <div className="text-sm text-muted-foreground mb-2">{model.description}</div>
                <div className="text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 inline mr-1" />{model.speed}
                </div>
                {selectedModel === model.id && (
                  <div className="absolute bottom-2 right-2">
                    <Icon name="mdi:check-circle" className="w-5 h-5 text-orange-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="glass-premium rounded-3xl p-8 bg-orange-50 dark:bg-orange-950/20 mb-8">
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="w-full h-14 text-lg bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Icon name="mdi:loading" className="w-5 h-5 mr-2 animate-spin" />
                {section.generate_button.generating}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                {section.generate_button.text}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">{section.generate_button.tip}</p>
        </div>

        {/* Output Section */}
        {(generatedStory || isGenerating) && (
          <div ref={outputRef} className="glass-premium rounded-3xl p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {section.output.title}
              </h3>
              {!isGenerating && (
                <div className="text-sm text-muted-foreground">
                  {section.output.word_count.replace("{{count}}", wordCount.toString())}
                </div>
              )}
            </div>

            {isGenerating && !generatedStory && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Icon name="mdi:loading" className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-muted-foreground">{section.output.loading}</p>
                </div>
              </div>
            )}

            {generatedStory && (
              <>
                <div className="prose prose-lg max-w-none dark:prose-invert mb-6 p-6 rounded-xl bg-muted/30 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                  {generatedStory}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Icon name="mdi:content-copy" className="w-4 h-4 mr-2" />
                    {section.output.button_copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                  >
                    <Icon name="mdi:refresh" className="w-4 h-4 mr-2" />
                    {section.output.button_regenerate}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedStory }));
                      } catch {}
                      router.push(buildContinueRoute({ source: "fantasy-generator" }) as any);
                    }}
                  >
                    <Icon name="mdi:pencil-plus" className="w-4 h-4 mr-2" />
                    {locale === "zh" ? "续写" : "Continue"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
