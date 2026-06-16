"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import {
  buildContinueRoute,
  createQueuedAsyncAction,
  shouldOpenSignInForSave,
  shouldAutoScrollEditor,
  shouldRestoreBlankDraft,
} from "./_lib";
import { RichTextEditor } from "../editor";
import { setInlineSuggestion } from "../editor/inline-suggestion";
import StoryBiblePanel from "../story-bible";
import StyleFingerprintPanel from "../style-fingerprint";
import SignToggle from "@/components/sign/toggle";
import type { Editor } from "@tiptap/react";
import type { StoryStatus } from "@/models/story";

const GENERATOR_PREFILL_KEY = "ai-write:generator-prefill";
const BLANK_DRAFT_KEY = "ai-write:blank";
const PANEL_WIDTH_KEY = "ai-write:panel-width";
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 380;

type WorkbenchStory = {
  uuid: string;
  title: string | null;
  content: string;
  word_count: number;
  settings: Record<string, unknown> | null;
  prompt?: string | null;
  status?: string | null;
};

type ContinuePreset = {
  id: string;
  label: string;
  prompt: string;
};

type WorkbenchProps = {
  initialStory?: WorkbenchStory;
  initialTitle: string;
  initialContent: string;
  source?: string;
};

function getWordCount(text: string) {
  if (!text.trim()) {
    return 0;
  }

  const cjkRegex =
    /[一-鿿㐀-䶿\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}豈-﫿぀-ゟ゠-ヿ가-힯]/gu;
  const trimmed = text.trim();
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  const withoutCjk = trimmed.replace(cjkRegex, " ").trim();
  const englishWords = withoutCjk ? withoutCjk.split(/\s+/).filter(Boolean) : [];

  return cjkCount + englishWords.length;
}

function formatSavedTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function normalizeLocale(locale: string) {
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("de")) return "de";
  return "en";
}

function getCopy(locale: string) {
  const key = normalizeLocale(locale);

  if (key === "zh") {
    return {
      pageTitle: "AI Write",
      storyBadge: "已绑定故事",
      draftBadge: "临时草稿",
      anonymousHint: "匿名用户可自由编辑，但 AI 续写需要先登录。",
      titleLabel: "标题",
      titlePlaceholder: "给这篇内容起个名字",
      editorHint: "把已有内容贴进来，或从空白开始。AI 的续写结果会直接追加到这里。",
      promptPlaceholder:
        "描述你想要的续写方向，例如：延续这一段，保持悬疑感更强...",
      send: "发送",
      sending: "续写中...",
      save: "保存",
      saving: "保存中...",
      saved: "已保存",
      autosave: "自动保存",
      saveFailed: "保存失败，请稍后重试。",
      continueFailed: "续写失败，请稍后重试。",
      needLogin: "请先登录后再使用 AI 续写。",
      emptyPrompt: "先告诉 Agnes 你想怎么续写。",
      emptyContent: "先写一点内容，或者粘贴一段正文。",
      panelTitle: "Story Generator",
      panelSubtitle: "AI 写作助手",
      messagesEmpty: "描述你想要的续写方向、语气、节奏或篇幅要求。",
      appended: "AI 内容已追加到编辑区",
      createStorySuccess: "已创建故事，可继续自动保存",
      draftRestored: "已恢复上次未完成草稿",
      generatorRestored: "已载入生成结果，可继续写作",
      saveToCreate: "保存为故事",
      storyCreatedNeedLogin: "请先登录后再将内容保存到故事库。",
      presets: [
        { id: "continue-scene", label: "推进剧情", prompt: "请直接续写下去，保持当前语气和节奏，并自然推进剧情。" },
        { id: "sharpen-dialogue", label: "加强对白", prompt: "请续写下一段，并让人物对白更有张力，保留现有角色关系。" },
        { id: "end-beat", label: "收束段落", prompt: "请在现有内容后续写一个更完整的小结尾，保留余味但不要彻底完结。" },
      ] satisfies ContinuePreset[],
      selectionActions: [
        { id: "improve", label: "改善", prompt: "你是一个文本优化助手。改善以下文本，使其更有表现力、更流畅、更精致。保持原意和语气不变。只返回改善后的文本，不要任何解释。" },
        { id: "grammar", label: "语法检查", prompt: "你是一个语法检查助手。修正以下文本中的所有语法、拼写或标点错误。只返回修正后的文本，不要任何解释。" },
        { id: "shorter", label: "更短", prompt: "你是一个文本编辑助手。将以下文本缩短，保留核心含义，去除冗余。只返回缩短后的文本，不要任何解释。" },
        { id: "longer", label: "更长", prompt: "你是一个文本扩展助手。将以下文本扩展，增加更多细节、描写或例子。只返回扩展后的文本，不要任何解释。" },
        { id: "simplify", label: "简化", prompt: "你是一个文本简化助手。将以下文本简化，使用更简单的词汇和更短的句子。只返回简化后的文本，不要任何解释。" },
      ],
      source: "来源",
      sourceBlank: "空白开始",
      sourceStory: "我的故事",
      sourceGenerator: "故事生成器",
      sourceUnknown: "直接进入",
      wordCount: "字数",
      consistencyCheck: "检查一致性",
      checking: "检查中…",
      checkFailed: "一致性检查失败，请稍后重试。",
      checkTooShort: "至少写 500 字后再检查一致性。",
      reviewLabels: {
        processing: "处理中…",
        accept: "接受",
        retry: "重试",
        reject: "拒绝",
      },
      stopped: "已停止生成",
      autocompleteHint: (n: number) => `再写 ${n} 字开启 AI 补全`,
      autocompleteReady: "AI 补全已开启",
      unsavedTip: "未保存修改",
      lastSavedAtLabel: (time: string) => `已保存 · ${time}`,
      resizeHint: "拖动调整宽度，双击恢复默认",
      needLoginAction: "登录后可用",
      presetFilled: "已填入指令，可在发送前修改",
      copied: "已复制到剪贴板",
      msgCopy: "复制",
      msgInsert: "插入到光标",
      msgDelete: "删除",
      aiWriting: "AI 正在写作...",
      signedOut: "已退出登录，请重新登录后继续保存",
    };
  }

  if (key === "de") {
    return {
      pageTitle: "AI Write",
      storyBadge: "Mit Story verknuepft",
      draftBadge: "Arbeitsentwurf",
      anonymousHint: "Anonyme Nutzer koennen schreiben, aber AI-Fortsetzung erfordert Anmeldung.",
      titleLabel: "Titel",
      titlePlaceholder: "Gib diesem Text einen Namen",
      editorHint: "Fuege bestehenden Text ein oder beginne leer. AI-Ergaenzungen werden direkt hier angehaengt.",
      promptPlaceholder: "Beschreibe die Richtung, z.B.: Setze diese Szene fort, mehr Spannung...",
      send: "Senden",
      sending: "Schreibt...",
      save: "Speichern",
      saving: "Speichert...",
      saved: "Gespeichert",
      autosave: "Automatisch gespeichert",
      saveFailed: "Speichern fehlgeschlagen. Bitte spaeter erneut versuchen.",
      continueFailed: "Fortsetzung fehlgeschlagen. Bitte spaeter erneut versuchen.",
      needLogin: "Bitte zuerst anmelden, um AI-Fortsetzung zu nutzen.",
      emptyPrompt: "Beschreibe zuerst, wie Agnes weiterschreiben soll.",
      emptyContent: "Schreibe erst etwas oder fuege bestehenden Text ein.",
      panelTitle: "Story Generator",
      panelSubtitle: "AI Schreibassistent",
      messagesEmpty: "Beschreibe Richtung, Ton, Tempo oder Ziellaenge.",
      appended: "AI-Text wurde in den Editor uebernommen",
      createStorySuccess: "Story erstellt. Automatisches Speichern ist aktiv",
      draftRestored: "Unfertiger Entwurf wurde wiederhergestellt",
      generatorRestored: "Generierter Text geladen und bereit zum Weiterschreiben",
      saveToCreate: "Als Story speichern",
      storyCreatedNeedLogin: "Bitte zuerst anmelden, um diesen Text zu speichern.",
      presets: [
        { id: "continue-scene", label: "Szene weiter", prompt: "Schreibe direkt weiter, halte Ton und Rhythmus und fuehre die Szene natuerlich fort." },
        { id: "sharpen-dialogue", label: "Dialog schaerfen", prompt: "Setze den Text fort und gib dem Dialog mehr Spannung, ohne die Figurenbeziehungen zu veraendern." },
        { id: "end-beat", label: "Abschluss", prompt: "Schreibe einen staerkeren Abschluss fuer diesen Abschnitt, ohne die ganze Geschichte zu beenden." },
      ] satisfies ContinuePreset[],
      selectionActions: [
        { id: "improve", label: "Verbessern", prompt: "Du bist ein Textverbesserungs-Assistent. Verbessere den folgenden Text, um ihn ausdrucksstärker, flüssiger und eleganter zu machen. Behalte die ursprüngliche Bedeutung und den Ton bei. Gib NUR den verbesserten Text zurück." },
        { id: "grammar", label: "Grammatik", prompt: "Du bist ein Grammatikprüfer. Korrigiere alle Grammatik-, Rechtschreib- oder Zeichensetzungsfehler im folgenden Text. Gib NUR den korrigierten Text zurück." },
        { id: "shorter", label: "Kürzer", prompt: "Du bist ein Textbearbeitungs-Assistent. Kürze den folgenden Text, während die Kernbedeutung erhalten bleibt. Gib NUR den gekürzten Text zurück." },
        { id: "longer", label: "Länger", prompt: "Du bist ein Texterweiterungs-Assistent. Erweitere den folgenden Text mit mehr Details, Beschreibungen oder Beispielen. Gib NUR den erweiterten Text zurück." },
        { id: "simplify", label: "Vereinfachen", prompt: "Du bist ein Textvereinfachungs-Assistent. Vereinfache den folgenden Text mit einfacheren Wörtern und kürzeren Sätzen. Gib NUR den vereinfachten Text zurück." },
      ],
      source: "Quelle",
      sourceBlank: "Leer",
      sourceStory: "Meine Storys",
      sourceGenerator: "Story Generator",
      sourceUnknown: "Direkteinstieg",
      wordCount: "Woerter",
      consistencyCheck: "Konsistenz prüfen",
      checking: "Prüfe…",
      checkFailed: "Konsistenzprüfung fehlgeschlagen. Bitte spaeter erneut versuchen.",
      checkTooShort: "Schreibe mindestens 500 Zeichen vor der Prüfung.",
      reviewLabels: {
        processing: "Verarbeitung…",
        accept: "Akzeptieren",
        retry: "Erneut versuchen",
        reject: "Ablehnen",
      },
      stopped: "Angehalten",
      autocompleteHint: (n: number) => `${n} weitere Zeichen fuer AI-Vorschlaege`,
      autocompleteReady: "AI-Vorschlaege aktiv",
      unsavedTip: "Nicht gespeichert",
      lastSavedAtLabel: (time: string) => `Gespeichert · ${time}`,
      resizeHint: "Ziehen zum Anpassen, Doppelklick zum Zuruecksetzen",
      needLoginAction: "Nach Anmeldung verfuegbar",
      presetFilled: "Befehl ausgefuellt, vor dem Senden anpassbar",
      copied: "In Zwischenablage kopiert",
      msgCopy: "Kopieren",
      msgInsert: "Am Cursor einfuegen",
      msgDelete: "Loeschen",
      aiWriting: "KI schreibt...",
      signedOut: "Abgemeldet — bitte neu anmelden, um zu speichern",
    };
  }

  return {
    pageTitle: "AI Write",
    storyBadge: "Linked story",
    draftBadge: "Workbench draft",
    anonymousHint: "Anonymous visitors can edit here, but AI continuation requires sign-in.",
    titleLabel: "Title",
    titlePlaceholder: "Give this draft a working title",
    editorHint: "Paste existing writing here or start from scratch. AI output will be appended directly.",
    promptPlaceholder: "Describe the direction, e.g.: Continue this scene, keep the tension rising...",
    send: "Send",
    sending: "Streaming...",
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    autosave: "Autosaved",
    saveFailed: "Save failed. Please try again later.",
    continueFailed: "AI continuation failed. Please try again later.",
    needLogin: "Please sign in before using AI continuation.",
    emptyPrompt: "Tell Agnes how you want the next part to unfold.",
    emptyContent: "Write a little first, or paste in the draft you want to continue.",
    panelTitle: "Story Generator",
    panelSubtitle: "AI Writing Assistant",
    messagesEmpty: "Describe the direction, tone, pacing, or target length you want.",
    appended: "AI output appended into the editor",
    createStorySuccess: "Story created. Autosave is now active",
    draftRestored: "Recovered your unfinished local draft",
    generatorRestored: "Loaded generated copy and ready to keep writing",
    saveToCreate: "Save as story",
    storyCreatedNeedLogin: "Please sign in before saving this draft.",
    presets: [
      { id: "continue-scene", label: "Push scene", prompt: "Continue directly from the current ending, keep the same voice, and move the scene forward." },
      { id: "sharpen-dialogue", label: "Sharpen dialogue", prompt: "Write the next passage with stronger dialogue tension while preserving the current character dynamic." },
      { id: "end-beat", label: "Close beat", prompt: "Add a more satisfying ending beat to this section without fully ending the whole story." },
    ] satisfies ContinuePreset[],
    selectionActions: [
      { id: "improve", label: "Improve", prompt: "You are a text improvement assistant. Improve the following text to be more engaging, clear, and polished. Keep the original meaning and tone. Return ONLY the improved text, nothing else." },
      { id: "grammar", label: "Grammar", prompt: "You are a grammar checker. Fix any grammar, spelling, or punctuation errors in the following text. Return ONLY the corrected text, nothing else." },
      { id: "shorter", label: "Shorter", prompt: "You are a text editing assistant. Make the following text shorter and more concise while preserving the key meaning. Return ONLY the shortened text, nothing else." },
      { id: "longer", label: "Longer", prompt: "You are a text expansion assistant. Expand the following text by adding more detail, description, or examples. Return ONLY the expanded text, nothing else." },
      { id: "simplify", label: "Simplify", prompt: "You are a text simplification assistant. Simplify the following text using simpler words and shorter sentences. Return ONLY the simplified text, nothing else." },
    ],
    source: "Source",
    sourceBlank: "Blank session",
    sourceStory: "My stories",
    sourceGenerator: "Story generator",
    sourceUnknown: "Direct entry",
    wordCount: "Words",
    consistencyCheck: "Check Consistency",
    checking: "Checking…",
    checkFailed: "Consistency check failed. Please try again later.",
    checkTooShort: "Write at least 500 characters before checking consistency.",
    reviewLabels: {
      processing: "Processing...",
      accept: "Accept",
      retry: "Retry",
      reject: "Reject",
    },
    stopped: "Stopped",
    autocompleteHint: (n: number) => `${n} more characters to enable AI suggestions`,
    autocompleteReady: "AI suggestions enabled",
    unsavedTip: "Unsaved changes",
    lastSavedAtLabel: (time: string) => `Saved · ${time}`,
    resizeHint: "Drag to resize, double-click to reset",
    needLoginAction: "Available after sign-in",
    presetFilled: "Prefilled — edit before sending",
    copied: "Copied to clipboard",
    msgCopy: "Copy",
    msgInsert: "Insert at cursor",
    msgDelete: "Delete",
    aiWriting: "AI is writing...",
    signedOut: "Signed out — sign in again to save",
  };
}

export default function AiWriteWorkbench({
  initialStory,
  initialTitle,
  initialContent,
  source,
}: WorkbenchProps) {
  const locale = useLocale();
  const router = useRouter();
  const { user, setShowSignModal, refreshUser } = useAppContext();
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [plainText, setPlainText] = useState(initialContent);
  const [instruction, setInstruction] = useState("");
  const [storyUuid, setStoryUuid] = useState(initialStory?.uuid ?? "");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "bible" | "fingerprint">("chat");
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [bibleActive, setBibleActive] = useState(false);
  const [autocompleteOn, setAutocompleteOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ai-write:autocomplete") === "on";
  });
  const restorePrefillRef = useRef(false);
  const restoredBlankDraftRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef("");
  const shouldStickEditorToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const pendingSaveAfterSignInRef = useRef(false);
  const isProgrammaticChangeRef = useRef(false);

  const sourceLabel = useMemo(() => {
    if (source === "generator") return copy.sourceGenerator;
    if (source === "my-stories") return copy.sourceStory;
    if (!source) return copy.sourceUnknown;
    return copy.sourceBlank;
  }, [copy, source]);

  const wordCount = useMemo(() => getWordCount(plainText), [plainText]);
  const refreshUserCredits = useMemo(
    () =>
      createQueuedAsyncAction(async () => {
        await refreshUser();
      }),
    [refreshUser]
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PANEL_WIDTH_KEY);
      if (!stored) return;
      const parsed = parseInt(stored, 10);
      if (Number.isNaN(parsed)) return;
      setRightPanelWidth(
        Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, parsed))
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setIsResizing(true);

      const startX = event.clientX;
      const startWidth = rightPanelWidth;
      let latestWidth = startWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const next = Math.min(
          MAX_PANEL_WIDTH,
          Math.max(MIN_PANEL_WIDTH, startWidth + delta)
        );
        latestWidth = next;
        setRightPanelWidth(next);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        try {
          window.localStorage.setItem(PANEL_WIDTH_KEY, String(latestWidth));
        } catch {
          // ignore
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [rightPanelWidth]
  );

  useEffect(() => {
    if (!isResizing) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isResizing]);

  const gridTemplate =
    !chatVisible || !isDesktop
      ? "1fr 0px"
      : `1fr 1px ${rightPanelWidth}px`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const updateEditorStickiness = useCallback(() => {
    const container = editorScrollRef.current;
    if (!container) return;

    shouldStickEditorToBottomRef.current = shouldAutoScrollEditor({
      isStreaming: true,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight,
      scrollHeight: container.scrollHeight,
    });
  }, []);

  useEffect(() => {
    if (
      restoredBlankDraftRef.current ||
      !isHydrated ||
      storyUuid ||
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(BLANK_DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        title?: string;
        content?: string;
        instruction?: string;
      } | null;

      if (
        !shouldRestoreBlankDraft({
          hasHydrated: isHydrated,
          storyUuid,
          currentTitle: title,
          currentContent: content,
          currentInstruction: instruction,
          draft: parsed,
        })
      ) {
        restoredBlankDraftRef.current = true;
        return;
      }

      if (parsed?.title) setTitle(parsed.title);
      if (parsed?.content) {
        setContent(parsed.content);
        setPlainText(parsed.content);
      }
      if (parsed?.instruction) setInstruction(parsed.instruction);

      restoredBlankDraftRef.current = true;
      toast.success(copy.draftRestored);
    } catch {
      restoredBlankDraftRef.current = true;
    }
  }, [content, copy.draftRestored, instruction, isHydrated, storyUuid, title]);

  useEffect(() => {
    if (
      !isHydrated ||
      storyUuid ||
      restorePrefillRef.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    restorePrefillRef.current = true;

    try {
      const raw = window.localStorage.getItem(GENERATOR_PREFILL_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        title?: string;
        content?: string;
      } | null;

      if (parsed?.title && !title.trim()) setTitle(parsed.title);
      if (parsed?.content && !content.trim()) {
        setContent(parsed.content);
        setPlainText(parsed.content);
      }

      window.localStorage.removeItem(GENERATOR_PREFILL_KEY);
      toast.success(copy.generatorRestored);
    } catch {
      // ignore invalid prefill
    }
  }, [content, copy.generatorRestored, isHydrated, storyUuid, title]);

  useEffect(() => {
    if (!isHydrated || storyUuid || typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      try {
        const payload = { title, content, instruction };
        if (!title.trim() && !content.trim() && !instruction.trim()) {
          window.localStorage.removeItem(BLANK_DRAFT_KEY);
          return;
        }
        window.localStorage.setItem(BLANK_DRAFT_KEY, JSON.stringify(payload));
      } catch {
        // ignore draft save failures
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [content, instruction, isHydrated, storyUuid, title]);

  useEffect(() => {
    if (!storyUuid || typeof window === "undefined") return;
    window.localStorage.removeItem(BLANK_DRAFT_KEY);
  }, [storyUuid]);

  const saveStory = useCallback(
    async (options?: {
      createIfNeeded?: boolean;
      manual?: boolean;
      nextStatus?: StoryStatus;
    }) => {
      if (!plainText.trim()) return;

      if (!user) {
        if (
          shouldOpenSignInForSave({
            hasUser: false,
            isManualSave: options?.manual ?? false,
          })
        ) {
          pendingSaveAfterSignInRef.current = true;
          setShowSignModal(true);
          toast.error(copy.storyCreatedNeedLogin);
        }
        return;
      }

      const payload = {
        title: title.trim() || null,
        content,
        wordCount,
        modelUsed: "generic",
        settings: { source: source ?? null, mode: "ai-write" },
      };

      startSaving(async () => {
        try {
          if (storyUuid) {
            const resp = await fetch(`/api/stories/${storyUuid}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, status: options?.nextStatus }),
            });
            if (!resp.ok) throw new Error(`request failed with status: ${resp.status}`);
            const json = await resp.json();
            if (json.code !== 0) throw new Error(json.message || "save failed");
            setLastSavedAt(new Date().toISOString());
            setIsDirty(false);
            return;
          }

          if (!options?.createIfNeeded) return;

          const resp = await fetch("/api/stories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              prompt: instruction || null,
              sourceCategory: "story",
              visibility: options?.nextStatus === "published" ? "public" : "private",
              status: options?.nextStatus ?? "saved",
            }),
          });
          if (!resp.ok) throw new Error(`request failed with status: ${resp.status}`);
          const json = await resp.json();
          if (json.code !== 0 || !json.data?.uuid) throw new Error(json.message || "save failed");

          setStoryUuid(json.data.uuid as string);
          setLastSavedAt(new Date().toISOString());
          toast.success(copy.createStorySuccess);
          router.replace(
            buildContinueRoute({
              storyUuid: json.data.uuid as string,
              source: source || "generator",
            })
          );
        } catch (error) {
          console.log("ai write save failed", error);
          toast.error(copy.saveFailed);
        }
      });
    },
    [
      content,
      copy.createStorySuccess,
      copy.saveFailed,
      copy.storyCreatedNeedLogin,
      instruction,
      plainText,
      router,
      setShowSignModal,
      source,
      storyUuid,
      title,
      user,
      wordCount,
    ]
  );

  useEffect(() => {
    if (!storyUuid || !isHydrated) return;
    const timer = window.setTimeout(() => {
      void saveStory();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [content, isHydrated, saveStory, storyUuid, title]);

  const handleContinue = useCallback(async () => {
    if (!instruction.trim()) {
      toast.error(copy.emptyPrompt);
      return;
    }

    if (!plainText.trim()) {
      toast.error(copy.emptyContent);
      return;
    }

    if (!user) {
      setShowSignModal(true);
      toast.error(copy.needLogin);
      return;
    }

    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "user", content: instruction }]);
    streamingContentRef.current = "";
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;
    let appended = "";

    try {
      // Build context from Story Bible and Style Fingerprint
      const contextParts: string[] = [];

      // Fetch bible data for the current story
      if (storyUuid) {
        try {
          const bibleResp = await fetch(`/api/story-bible?story=${storyUuid}`, {
            signal: controller.signal,
          });
          const bibleJson = await bibleResp.json();
          if (bibleJson.code === 0 && bibleJson.data) {
            const bible = bibleJson.data;
            if (bible.characters?.length || bible.world_lore) {
              const { formatBibleForPrompt } = await import("@/lib/bible-format");
              const bibleText = formatBibleForPrompt(bible);
              if (bibleText) contextParts.push(bibleText);
            }
          }
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          // ignore bible fetch errors
        }
      }

      try {
        const fpResp = await fetch("/api/style-fingerprint", {
          signal: controller.signal,
        });
        const fpJson = await fpResp.json();
        if (fpJson.code === 0 && fpJson.data?.activeUuid) {
          const active = (fpJson.data.fingerprints || []).find(
            (fp: any) => fp.uuid === fpJson.data.activeUuid
          );
          if (active?.sample_text && active.sample_text.length > 1) {
            contextParts.push(
              "== Author's Writing Style ==\nMirror the following writing style in your continuation. Match the sentence rhythm, vocabulary level, and tone:\n" +
                active.sample_text.slice(0, 800)
            );
          }
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") throw err;
        // ignore fingerprint fetch errors
      }

      const contextBlock = contextParts.length
        ? "\n\n" + contextParts.join("\n\n")
        : "";

      const systemPrompt = contextParts.length
        ? "You are a creative writing continuation assistant. Continue the draft according to the user's instruction and return only the text that should be appended next. Reference the provided character profiles, world lore, and style guidance to maintain consistency."
        : "You are a creative writing continuation assistant. Continue the draft according to the user's instruction and return only the text that should be appended next.";

      const response = await fetch("/api/chat/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Current title: ${title || "Untitled"}\n\nCurrent draft:\n${plainText}${contextBlock}\n\nInstruction:\n${instruction}`,
            },
          ],
          max_tokens: 1200,
          storyId: storyUuid || undefined,
          metadata: { source: source || null },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`request failed with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (!delta) continue;

            appended += delta;
            setStreamingText((prev) => prev + delta);
          } catch {
            // ignore malformed chunks
          }
        }
      }

      if (appended.trim()) {
        streamingContentRef.current = appended.trim();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: appended.trim() },
        ]);
      }

      setInstruction("");
      setStreamingText("");
      void refreshUserCredits();
    } catch (error) {
      const isAbort = (error as Error)?.name === "AbortError";

      if (isAbort) {
        if (appended.trim()) {
          streamingContentRef.current = appended.trim();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: appended.trim() },
          ]);
        }
        toast.success(copy.stopped);
      } else {
        console.log("ai write continue failed", error);
        toast.error(copy.continueFailed, { duration: 6000 });
      }
    } finally {
      abortRef.current = null;
      setStreamingText("");
      setIsStreaming(false);
    }
  }, [
    copy.continueFailed,
    copy.emptyContent,
    copy.emptyPrompt,
    copy.needLogin,
    copy.stopped,
    instruction,
    plainText,
    setShowSignModal,
    source,
    storyUuid,
    title,
    refreshUserCredits,
    user,
  ]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const handleEditorChange = useCallback((html: string, text: string) => {
    setContent(html);
    setPlainText(text);
    if (isHydrated && !isProgrammaticChangeRef.current) setIsDirty(true);
  }, [isHydrated]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) &&
        (event.key === "s" || event.key === "S");
      if (!isSaveShortcut) return;
      event.preventDefault();
      void saveStory({
        createIfNeeded: !storyUuid,
        manual: true,
        nextStatus: "saved",
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveStory, storyUuid]);

  useEffect(() => {
    if (!user || !pendingSaveAfterSignInRef.current) return;
    if (!plainText.trim()) {
      pendingSaveAfterSignInRef.current = false;
      return;
    }
    pendingSaveAfterSignInRef.current = false;
    void saveStory({ createIfNeeded: !storyUuid, manual: true });
  }, [user, plainText, storyUuid, saveStory]);

  const prevUserRef = useRef(user);
  useEffect(() => {
    if (!isHydrated) return;
    if (prevUserRef.current && !user && storyUuid) {
      toast.error(copy.signedOut);
    }
    prevUserRef.current = user;
  }, [user, storyUuid, isHydrated, copy.signedOut]);

  const toggleAutocomplete = useCallback(() => {
    setAutocompleteOn((prev) => {
      const next = !prev;
      localStorage.setItem("ai-write:autocomplete", next ? "on" : "off");
      return next;
    });
  }, []);

  const handleProcessText = useCallback(
    async (text: string, systemPrompt: string): Promise<string> => {
      if (!user) {
        setShowSignModal(true);
        toast.error(copy.needLogin);
        throw new Error("not authenticated");
      }

      const response = await fetch("/api/chat/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          max_tokens: 400,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) result += delta;
          } catch {
            // ignore malformed chunks
          }
        }
      }

      void refreshUserCredits();
      return result.trim() || text;
    },
    [user, copy.needLogin, refreshUserCredits, setShowSignModal]
  );

  const handleConsistencyCheck = useCallback(async () => {
    if (!user) {
      setShowSignModal(true);
      toast.error(copy.needLogin);
      return;
    }

    if (getWordCount(plainText) < 500) {
      toast.error(copy.checkTooShort);
      return;
    }

    setIsChecking(true);
    setChatVisible(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: copy.consistencyCheck },
    ]);

    try {
      // Build bible context
      let bibleContext = "";
      if (storyUuid) {
        try {
          const bibleResp = await fetch(`/api/story-bible?story=${storyUuid}`);
          const bibleJson = await bibleResp.json();
          if (bibleJson.code === 0 && bibleJson.data) {
            const { formatBibleForPrompt } = await import("@/lib/bible-format");
            const text = formatBibleForPrompt(bibleJson.data);
            if (text) bibleContext = `\n\n== Character Profiles & World Lore ==\n${text}`;
          }
        } catch {
          // ignore
        }
      }

      const systemPrompt = `You are a professional fiction editor specialized in plot consistency checking. Analyze the following story text${bibleContext ? " alongside the character profiles" : ""} and identify any logical contradictions, character inconsistencies, timeline conflicts, or world-building contradictions.

Return your findings in this exact JSON format (nothing else, no markdown, no code fences):
{"issues":[{"type":"character|timeline|worldbuilding|plot","severity":"high|medium|low","location":"where in the text","description":"what contradiction was found","evidence":"exact quote from the text"}],"summary":"brief overall assessment"}

If no issues found, return: {"issues":[],"summary":"No significant consistency issues found."}`;

      const response = await fetch("/api/chat/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `== Story Text ==\n${plainText}${bibleContext}`,
            },
          ],
          max_tokens: 2000,
          storyId: storyUuid || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`request failed with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) result += delta;
          } catch {
            // ignore
          }
        }
      }

      void refreshUserCredits();

      // Try to parse as JSON, fallback to raw text
      let displayText = result.trim();
      try {
        // Strip markdown code fences if present
        const cleaned = displayText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.issues?.length) {
          displayText = parsed.summary + "\n\n" + parsed.issues.map((issue: any, i: number) =>
            `${i + 1}. [${issue.severity?.toUpperCase() || "MEDIUM"}] ${issue.type || "plot"}: ${issue.description}${issue.evidence ? `\n   > ${issue.evidence}` : ""}`
          ).join("\n\n");
        } else {
          displayText = parsed.summary || "No issues found.";
        }
      } catch {
        // not JSON, use as-is
      }

      setMessages((prev) => [...prev, { role: "assistant", content: displayText }]);
    } catch (error) {
      console.log("consistency check failed", error);
      toast.error(copy.checkFailed);
    } finally {
      setIsChecking(false);
    }
  }, [copy, plainText, refreshUserCredits, setShowSignModal, storyUuid, user]);

  // Debounced inline AI suggestion
  useEffect(() => {
    if (!autocompleteOn || !plainText.trim() || !user || isStreaming || !editorRef.current) return;
    if (plainText.length < 80) return;

    const controller = new AbortController();
    const contextText = plainText.slice(-600);

    const timer = setTimeout(async () => {
      if (!editorRef.current?.isFocused) return;

      try {
        const response = await fetch("/api/chat/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are an inline text completion assistant. Continue the text naturally from where it ends. Return ONLY the next 1-3 sentences that follow. No explanations, no quotes, no meta-text, no markdown.",
              },
              { role: "user", content: contextText },
            ],
            max_tokens: 80,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let suggestion = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) suggestion += delta;
            } catch {
              // ignore malformed chunks
            }
          }
        }

        void refreshUserCredits();

        // Validate that the editor's current tail still matches the context
        // we asked for; otherwise discard the suggestion to avoid inserting
        // completions that belong to an older cursor position.
        const currentPlainText = editorRef.current?.getText() ?? "";
        const isStillRelevant = currentPlainText.endsWith(contextText.trim()) ||
          contextText.trim().endsWith(currentPlainText.slice(-contextText.length).trim());

        if (
          !controller.signal.aborted &&
          isStillRelevant &&
          suggestion.trim() &&
          editorRef.current &&
          editorRef.current.isFocused
        ) {
          setInlineSuggestion(editorRef.current, suggestion.trim());
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        // ignore suggestion failures
      }
    }, 2000);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [autocompleteOn, isStreaming, plainText, refreshUserCredits, user]);

  return (
    <section className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background">
      {/* Breadcrumb bar */}
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border/40 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            aria-label="Home"
            onClick={() => router.push("/")}
            className="cursor-pointer transition hover:text-foreground"
          >
            <Icon name="RiHome4Line" className="size-4" />
          </button>
          <Icon name="RiArrowRightSLine" className="size-3.5 shrink-0 opacity-40" />
          <button
            type="button"
            onClick={() => router.push("/ai-write")}
            className="hidden cursor-pointer transition hover:text-foreground sm:inline"
          >
            AI Write
          </button>
          <Icon name="RiArrowRightSLine" className="hidden size-3.5 shrink-0 opacity-40 sm:block" />
          <span className="truncate text-foreground">
            {storyUuid ? copy.storyBadge : copy.draftBadge}
          </span>

          <span className="ml-2 hidden text-xs text-muted-foreground/70 sm:inline">
            {copy.wordCount}: {wordCount}
          </span>
          {isDirty && storyUuid && (
            <span
              title={copy.unsavedTip}
              className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
            >
              <span className="size-1.5 rounded-full bg-orange-500" />
            </span>
          )}
          {lastSavedAt && !isDirty && (
            <span className="hidden text-xs text-muted-foreground/70 sm:inline">
              {copy.lastSavedAtLabel(formatSavedTime(lastSavedAt))}
            </span>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          <button
            type="button"
            onClick={() => void handleConsistencyCheck()}
            disabled={isChecking || isStreaming || wordCount < 500}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title={wordCount < 500 ? copy.checkTooShort : copy.consistencyCheck}
          >
            <Icon name="RiShieldCheckLine" className="size-3.5" />
            <span className="hidden sm:inline">
              {isChecking
                ? copy.checking
                : wordCount < 500
                ? `${copy.consistencyCheck} (${Math.max(0, 500 - wordCount)})`
                : copy.consistencyCheck}
            </span>
          </button>
          <Button
            variant={isDirty ? "outline" : "ghost"}
            size="sm"
            className="h-7 shrink-0 rounded-full text-xs"
            disabled={isSaving}
            onClick={() => {
              void saveStory({
                createIfNeeded: !storyUuid,
                manual: true,
                nextStatus: "saved",
              });
            }}
          >
            {isSaving
              ? copy.saving
              : storyUuid
              ? copy.save
              : copy.saveToCreate}
          </Button>
          <div className="shrink-0">
            <SignToggle />
          </div>
          {!chatVisible && (
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/60 bg-background p-0.5">
              <button
                type="button"
                onClick={() => {
                  setRightPanelTab("chat");
                  setChatVisible(true);
                }}
                className="flex size-7 items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-500"
                title="Chat"
              >
                <Icon name="RiChatSmile2Line" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRightPanelTab("bible");
                  setChatVisible(true);
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Story Bible"
              >
                <Icon name="RiBookOpenLine" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRightPanelTab("fingerprint");
                  setChatVisible(true);
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Style"
              >
                <Icon name="RiFingerprint2Line" className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main layout: editor + right panel */}
      <div className="relative flex-1 overflow-hidden">
        {/* Mobile overlay backdrop */}
        {chatVisible && (
          <div
            className="fixed inset-0 z-10 bg-black/40 md:hidden"
            onClick={() => setChatVisible(false)}
          />
        )}
      <div
        className={cn(
          "grid h-full overflow-hidden",
          !isResizing &&
            "transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* Editor column */}
        <div className="relative flex flex-col overflow-hidden">
          <div className="border-b border-border/30 px-3 py-2 sm:px-5 sm:py-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.titlePlaceholder}
              className="h-9 border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </div>

          <div
            ref={editorScrollRef}
            onScroll={updateEditorStickiness}
            className="relative flex-1 overflow-auto"
          >
            {!plainText.trim() && !title.trim() && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-orange-500/8">
                    <Icon name="RiEdit2Line" className="size-6 text-orange-600/50" />
                  </div>
                  <p className="text-sm text-muted-foreground/60">{copy.editorHint}</p>
                </div>
              </div>
            )}
            <RichTextEditor
              content={content}
              onChange={handleEditorChange}
              placeholder={copy.editorHint}
              editorRef={editorRef}
              selectionActions={copy.selectionActions}
              onProcessText={handleProcessText}
              autocompleteOn={autocompleteOn}
              onToggleAutocomplete={toggleAutocomplete}
              title={title}
              plainText={plainText}
              isAuthenticated={!!user}
              onSignIn={() => setShowSignModal(true)}
              reviewLabels={copy.reviewLabels}
              needLoginLabel={copy.needLoginAction}
            />
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/95 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur sm:right-5">
            {autocompleteOn && user && plainText.length < 80 && (
              <span className="flex items-center gap-1.5">
                <Icon name="RiMagicLine" className="size-3 text-orange-500" />
                {copy.autocompleteHint(80 - plainText.length)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground/60">·</span>
              <span>
                {wordCount} {copy.wordCount.toLowerCase()}
              </span>
            </span>
          </div>
        </div>

        {/* Resize handle (desktop only) */}
        {chatVisible && isDesktop && (
          <div
            role="separator"
            aria-orientation="vertical"
            title={copy.resizeHint}
            onMouseDown={startResize}
            onDoubleClick={() => setRightPanelWidth(DEFAULT_PANEL_WIDTH)}
            className={cn(
              "group relative z-20 hidden w-1 cursor-col-resize bg-border/60 transition-colors hover:bg-orange-500/50 md:block",
              isResizing && "bg-orange-500"
            )}
          >
            <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
            <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border bg-background shadow-sm transition",
                  isResizing
                    ? "border-orange-500 text-orange-600"
                    : "border-border/70 text-muted-foreground/60 group-hover:border-orange-300 group-hover:text-orange-600"
                )}
              >
                <Icon
                  name="RiArrowLeftRightLine"
                  className="size-3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Chat / Story Bible / Style Fingerprint */}
        <aside className={cn(
          "flex flex-col overflow-hidden bg-muted/30 transition-[opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative",
          chatVisible
            ? cn(
                "opacity-100 fixed inset-y-0 right-0 z-20 shadow-2xl md:shadow-none",
                isMobileFullscreen
                  ? "w-screen max-w-none"
                  : "w-[85vw] max-w-[400px] md:w-auto md:max-w-none"
              )
            : "pointer-events-none opacity-0 overflow-hidden"
        )}>
          {/* Tab bar header */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-2 py-2">
            <button
              type="button"
              aria-label="Chat tab"
              aria-pressed={rightPanelTab === "chat"}
              onClick={() => setRightPanelTab("chat")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition",
                rightPanelTab === "chat"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon name="RiChatSmile2Line" className="size-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              type="button"
              aria-label="Story Bible tab"
              aria-pressed={rightPanelTab === "bible"}
              onClick={() => setRightPanelTab("bible")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition",
                rightPanelTab === "bible"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon name="RiBookOpenLine" className="size-3.5" />
              <span className="hidden sm:inline">Story Bible</span>
            </button>
            <button
              type="button"
              aria-label="Style Fingerprint tab"
              aria-pressed={rightPanelTab === "fingerprint"}
              onClick={() => setRightPanelTab("fingerprint")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition",
                rightPanelTab === "fingerprint"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon name="RiFingerprint2Line" className="size-3.5" />
              <span className="hidden sm:inline">Style</span>
            </button>
            <div className="flex-1" />
            <button
              type="button"
              aria-label={isMobileFullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={() => setIsMobileFullscreen((v) => !v)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
            >
              <Icon
                name={isMobileFullscreen ? "RiFullscreenExitLine" : "RiFullscreenLine"}
                className="size-4"
              />
            </button>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setChatVisible(false)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon name="RiSideBarLine" className="size-4" />
            </button>
          </div>

          {/* Story Bible / Style Fingerprint panels */}
          {rightPanelTab === "bible" && (
            <div key="bible" className="animate-fade-in-up flex-1 overflow-auto">
              <StoryBiblePanel storyUuid={storyUuid} onBibleChange={setBibleActive} />
            </div>
          )}
          {rightPanelTab === "fingerprint" && (
            <div key="fingerprint" className="animate-fade-in-up flex-1 overflow-auto">
              <StyleFingerprintPanel />
            </div>
          )}

          {/* Messages area — only in chat tab */}
          {rightPanelTab === "chat" && <div className="flex-1 overflow-auto px-4 py-4">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-[260px] text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-orange-500/8">
                    <Icon name="RiChatSmile2Line" className="size-6 text-orange-600/60" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {copy.messagesEmpty}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {copy.presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.prompt}
                        onClick={() => {
                          setInstruction(preset.prompt);
                          toast.success(copy.presetFilled);
                        }}
                        className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs transition hover:border-orange-300 hover:bg-orange-50 dark:hover:border-orange-600/40 dark:hover:bg-orange-900/20"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "group flex gap-2.5",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/12 text-orange-700 dark:bg-orange-400/12 dark:text-orange-200">
                        <Icon name="RiSparkling2Line" className="size-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                        message.role === "user"
                          ? "bg-muted text-foreground border border-border/40"
                          : "bg-orange-50/60 shadow-sm border border-orange-200/40 dark:bg-orange-900/10 dark:border-orange-700/20"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-1 border-t border-orange-200/30 pt-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 dark:border-orange-700/20">
                          <button
                            type="button"
                            title={copy.msgCopy}
                            onClick={() => {
                              try {
                                void navigator.clipboard?.writeText(message.content);
                                toast.success(copy.copied);
                              } catch {
                                // ignore clipboard errors
                              }
                            }}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-200"
                          >
                            <Icon name="RiFileCopyLine" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title={copy.msgInsert}
                            onClick={() => {
                              const ed = editorRef.current;
                              if (!ed) return;
                              const { from } = ed.state.selection;
                              ed.chain().focus().insertContentAt(from, message.content).run();
                              toast.success(copy.appended);
                            }}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-200"
                          >
                            <Icon name="RiArrowDownLine" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title={copy.msgDelete}
                            onClick={() => {
                              setMessages((prev) => prev.filter((_, i) => i !== index));
                            }}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          >
                            <Icon name="RiDeleteBin6Line" className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon name="RiUser3Line" className="size-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/12 text-orange-700 dark:bg-orange-400/12 dark:text-orange-200">
                      <Icon name="RiSparkling2Line" className="size-3.5" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl bg-orange-50/60 px-3.5 py-2.5 shadow-sm border border-orange-200/40 dark:bg-orange-900/10 dark:border-orange-700/20">
                      {streamingText ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                          {streamingText}
                          <span className="ml-1 inline-block w-1.5 animate-pulse text-orange-500">▍</span>
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500" />
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:0.2s]" />
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>}

          {/* Chat input area */}
          {rightPanelTab === "chat" && <div className="border-t border-border/40 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background p-2">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isStreaming) void handleContinue();
                  }
                }}
                placeholder={isStreaming ? copy.aiWriting : copy.promptPlaceholder}
                rows={3}
                className={cn(
                  "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none transition placeholder:text-muted-foreground/50",
                  isStreaming && "opacity-50"
                )}
              />
              <Button
                size="sm"
                className={cn(
                  "h-8 w-8 shrink-0 rounded-xl p-0 text-white",
                  isStreaming
                    ? "bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
                    : "bg-orange-600 hover:bg-orange-500"
                )}
                disabled={!isStreaming && !instruction.trim()}
                onClick={() => {
                  if (isStreaming) {
                    stopStreaming();
                  } else {
                    void handleContinue();
                  }
                }}
                title={isStreaming ? copy.stopped : copy.send}
              >
                <Icon
                  name={isStreaming ? "RiStopFill" : "RiSendPlane2Fill"}
                  className="size-4"
                />
              </Button>
            </div>
          </div>}
        </aside>
      </div>
      </div>
    </section>
  );
}
