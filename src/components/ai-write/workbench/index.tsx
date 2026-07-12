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
import {
  CONTINUE_INTENT_KEY,
  GENERATOR_PREFILL_KEY,
} from "./continue-intent";
import { useOpenPanel } from "@openpanel/nextjs";
import { RichTextEditor } from "../editor";
import { setInlineSuggestion } from "../editor/inline-suggestion";
import StoryBiblePanel from "../story-bible";
import StyleFingerprintPanel from "../style-fingerprint";
import SignToggle from "@/components/sign/toggle";
import type { Editor } from "@tiptap/react";
import type { StoryStatus } from "@/models/story";
import {
  buildPostAuthResumeTrackingPayload,
  consumePendingAuthResume,
  writePendingAuthResume,
} from "@/lib/auth-resume";

const BLANK_DRAFT_KEY = "ai-write:blank";
const PANEL_WIDTH_KEY = "ai-write:panel-width";
const CHAT_MESSAGES_PREFIX = "ai-write:chat-messages";
const CHAT_SUMMARY_PREFIX = "ai-write:chat-summary";
const MAX_PERSISTED_MESSAGES = 50;
const SUMMARY_TRIGGER_THRESHOLD = 10;
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

type ContinuePresetGroup = {
  id: string;
  label: string;
  presets: ContinuePreset[];
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

function getParagraphCount(text: string) {
  if (!text.trim()) return 0;
  return text.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0).length;
}

function getReadingTime(words: number, locale: string) {
  const wpm = locale.startsWith("zh") ? 400 : 200;
  const minutes = Math.ceil(words / wpm);
  return minutes < 1 ? 1 : minutes;
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
        { id: "add-tension", label: "制造悬念", prompt: "请在续写中引入一个未解的悬念或伏笔，让读者产生好奇。" },
        { id: "twist", label: "加入反转", prompt: "请在续写中加入一个出人意料的情节转折，但必须与已有线索一致。" },
      ] satisfies ContinuePreset[],
      presetGroups: [
        {
          id: "plot",
          label: "情节推进",
          presets: [
            { id: "continue-scene", label: "推进剧情", prompt: "请直接续写下去，保持当前语气和节奏，并自然推进剧情。" },
            { id: "end-beat", label: "收束段落", prompt: "请在现有内容后续写一个更完整的小结尾，保留余味但不要彻底完结。" },
            { id: "add-tension", label: "制造悬念", prompt: "请在续写中引入一个未解的悬念或伏笔，让读者产生好奇。" },
            { id: "twist", label: "加入反转", prompt: "请在续写中加入一个出人意料的情节转折，但必须与已有线索一致。" },
            { id: "speed-up", label: "加快节奏", prompt: "请用更紧凑的句子和更密集的事件推进剧情，提升紧迫感。" },
            { id: "slow-down", label: "放慢节奏", prompt: "请放慢叙事节奏，用更多细节描写和内心活动让此刻更立体。" },
          ],
        },
        {
          id: "character",
          label: "角色深化",
          presets: [
            { id: "sharpen-dialogue", label: "加强对白", prompt: "请续写下一段，并让人物对白更有张力，保留现有角色关系。" },
            { id: "inner-monologue", label: "内心独白", prompt: "请以主角视角写一段内心独白，展示其当下的情绪和犹豫。" },
            { id: "character-detail", label: "细节刻画", prompt: "请续写时增加对人物动作、表情、习惯性小动作的细节描写。" },
            { id: "reveal-motivation", label: "揭示动机", prompt: "请在续写中暗示或揭示一个角色的真实动机，不要直白说明。" },
            { id: "conflict", label: "制造冲突", prompt: "请在续写中引入两个角色之间的冲突或立场对立，加强戏剧张力。" },
          ],
        },
        {
          id: "style",
          label: "风格优化",
          presets: [
            { id: "cinematic", label: "电影感", prompt: "请用更具画面感的镜头语言续写，强调视觉、声音、气味等感官细节。" },
            { id: "poetic", label: "诗意化", prompt: "请在续写中使用更抒情、更富韵律的语言，提升文学性。" },
            { id: "minimal", label: "极简白描", prompt: "请用极简、克制的笔触续写，去除修饰，保留核心意象。" },
            { id: "humor", label: "幽默点缀", prompt: "请在续写中适度加入幽默或自嘲的笔调，但不要破坏整体氛围。" },
            { id: "sensory", label: "感官描写", prompt: "请在续写中强化五种感官的描写，让场景更具沉浸感。" },
          ],
        },
      ] satisfies ContinuePresetGroup[],
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
      paragraphs: "段落",
      readingTime: (min: number) => `约 ${min} 分钟阅读`,
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
      msgRegenerate: "换一种写法",
      msgContinue: "继续展开",
      msgInsertContinue: "插入并续写",
      regenerated: "已重新生成",
      askAi: "问 AI",
      quotePrefix: "引用所选文本：",
      messagesRestored: "已恢复上次对话",
      msgReply: "引用追问",
      replyTo: "回复",
      replyCancel: "取消引用",
      modeChat: "对话",
      modeEdit: "编辑",
      modeAnalyze: "分析",
      modeChatHint: "自由对话，AI 帮你续写或讨论",
      modeEditHint: "AI 回复更聚焦于可替换的改写建议",
      modeAnalyzeHint: "AI 对当前草稿做结构化分析",
      streamFailed: "生成中断，可点击重试",
      retry: "重试",
      retryContinue: "从断点继续",
      newConversation: "开启新对话",
      newConversationHint: "清空当前对话，从头开始",
      conversationCleared: "已开启新对话",
      summaryGenerated: "已生成对话摘要，AI 将记住早期讨论",
      summaryFailed: "摘要生成失败，不影响当前对话",
      historyTab: "历史",
      historyEmpty: "还没有历史对话",
      historyLoad: "加载此对话",
      historyDelete: "删除",
      historyDeleteConfirm: "确定删除此对话？",
      historyDeleted: "对话已删除",
      historyLoaded: "已加载历史对话",
      historyMessages: (n: number) => `${n} 条消息`,
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
        { id: "add-tension", label: "Spannung", prompt: "Fuehre ein ungeloestes Geheimnis oder einen Hinweis ein, der Neugier weckt." },
        { id: "twist", label: "Wendepunkt", prompt: "Fuege eine unerwartete Wendung hinzu, die aber mit den bisherigen Hinweisen konsistent bleibt." },
      ] satisfies ContinuePreset[],
      presetGroups: [
        {
          id: "plot",
          label: "Handlung",
          presets: [
            { id: "continue-scene", label: "Szene weiter", prompt: "Schreibe direkt weiter, halte Ton und Rhythmus und fuehre die Szene natuerlich fort." },
            { id: "end-beat", label: "Abschluss", prompt: "Schreibe einen staerkeren Abschluss fuer diesen Abschnitt, ohne die ganze Geschichte zu beenden." },
            { id: "add-tension", label: "Spannung", prompt: "Fuehre ein ungeloestes Geheimnis oder einen Hinweis ein, der Neugier weckt." },
            { id: "twist", label: "Wendepunkt", prompt: "Fuege eine unerwartete Wendung hinzu, die aber mit den bisherigen Hinweisen konsistent bleibt." },
            { id: "speed-up", label: "Tempo", prompt: "Verwende kompakte Saetze und dichtere Ereignisse, um Dringlichkeit zu erzeugen." },
            { id: "slow-down", label: "Entschleunigen", prompt: "Verlangsame das Erzaehltempo mit mehr Details und inneren Monologen." },
          ],
        },
        {
          id: "character",
          label: "Figuren",
          presets: [
            { id: "sharpen-dialogue", label: "Dialog schaerfen", prompt: "Setze den Text fort und gib dem Dialog mehr Spannung, ohne die Figurenbeziehungen zu veraendern." },
            { id: "inner-monologue", label: "Innerer Monolog", prompt: "Schreibe aus der Sicht des Protagonisten einen inneren Monolog ueber die aktuellen Gefuehle." },
            { id: "character-detail", label: "Detail", prompt: "Fuege feine Details zu Mimik, Gestik oder Gewohnheiten der Figur hinzu." },
            { id: "reveal-motivation", label: "Motivation", prompt: "Deute unauffaellig die wahre Motivation einer Figur an, ohne sie direkt zu nennen." },
            { id: "conflict", label: "Konflikt", prompt: "Erzeuge einen Konflikt oder Meinungsverschiedenheit zwischen zwei Figuren." },
          ],
        },
        {
          id: "style",
          label: "Stil",
          presets: [
            { id: "cinematic", label: "Filmisch", prompt: "Schreibe mit bildhafter Kamerafuehrung und betone visuelle, akustische und olfaktorische Details." },
            { id: "poetic", label: "Lyrisch", prompt: "Verwende eine melodiösere, rhythmischere Sprache, um die Literaritaet zu erhoehen." },
            { id: "minimal", label: "Minimal", prompt: "Schreibe extrem reduziert und verzichte auf jeglichen Zierrat." },
            { id: "humor", label: "Humor", prompt: "Fuege behutsam Humor oder Selbstironie hinzu, ohne die Stimmung zu brechen." },
            { id: "sensory", label: "Sinne", prompt: "Verstaerke die Beschreibung aller fuenf Sinne fuer mehr Immersion." },
          ],
        },
      ] satisfies ContinuePresetGroup[],
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
      paragraphs: "Absaetze",
      readingTime: (min: number) => `~${min} Min. Lesezeit`,
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
      msgRegenerate: "Neu schreiben",
      msgContinue: "Weiter ausbauen",
      msgInsertContinue: "Einfuegen und fortfahren",
      regenerated: "Neu generiert",
      askAi: "AI fragen",
      quotePrefix: "Ausgewaehlter Text:",
      messagesRestored: "Letzte Unterhaltung wiederhergestellt",
      msgReply: "Antworten",
      replyTo: "Antwort auf",
      replyCancel: "Abbrechen",
      modeChat: "Chat",
      modeEdit: "Bearbeiten",
      modeAnalyze: "Analyse",
      modeChatHint: "Freie Unterhaltung, AI hilft beim Weiterschreiben",
      modeEditHint: "AI fokussiert auf austauschbare Umschreibungen",
      modeAnalyzeHint: "AI analysiert den Entwurf strukturiert",
      streamFailed: "Abgebrochen — erneut versuchen",
      retry: "Erneut",
      retryContinue: "Fortsetzen",
      newConversation: "Neues Gespräch",
      newConversationHint: "Aktuelles Gespräch löschen und neu beginnen",
      conversationCleared: "Neues Gespräch gestartet",
      summaryGenerated: "Gesprächszusammenfassung erstellt — AI behält frühere Themen",
      summaryFailed: "Zusammenfassung fehlgeschlagen — Gespräch läuft normal weiter",
      historyTab: "Verlauf",
      historyEmpty: "Noch keine vergangenen Gespräche",
      historyLoad: "Gespräch laden",
      historyDelete: "Löschen",
      historyDeleteConfirm: "Dieses Gespräch wirklich löschen?",
      historyDeleted: "Gespräch gelöscht",
      historyLoaded: "Vergangenes Gespräch geladen",
      historyMessages: (n: number) => `${n} Nachrichten`,
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
      { id: "add-tension", label: "Add tension", prompt: "Introduce an unresolved mystery or foreshadowing in the continuation to spark curiosity." },
      { id: "twist", label: "Add twist", prompt: "Introduce an unexpected plot twist that remains consistent with the existing clues." },
    ] satisfies ContinuePreset[],
    presetGroups: [
      {
        id: "plot",
        label: "Plot",
        presets: [
          { id: "continue-scene", label: "Push scene", prompt: "Continue directly from the current ending, keep the same voice, and move the scene forward." },
          { id: "end-beat", label: "Close beat", prompt: "Add a more satisfying ending beat to this section without fully ending the whole story." },
          { id: "add-tension", label: "Add tension", prompt: "Introduce an unresolved mystery or foreshadowing in the continuation to spark curiosity." },
          { id: "twist", label: "Add twist", prompt: "Introduce an unexpected plot twist that remains consistent with the existing clues." },
          { id: "speed-up", label: "Speed up", prompt: "Use tighter sentences and denser events to raise urgency in the continuation." },
          { id: "slow-down", label: "Slow down", prompt: "Slow the narrative pace with more detail and inner monologue to deepen this moment." },
        ],
      },
      {
        id: "character",
        label: "Character",
        presets: [
          { id: "sharpen-dialogue", label: "Sharpen dialogue", prompt: "Write the next passage with stronger dialogue tension while preserving the current character dynamic." },
          { id: "inner-monologue", label: "Inner monologue", prompt: "Write an inner monologue from the protagonist's point of view revealing current emotions and hesitation." },
          { id: "character-detail", label: "Character detail", prompt: "Add finer detail to the character's gestures, micro-expressions, and habitual tics." },
          { id: "reveal-motivation", label: "Reveal motivation", prompt: "Hint at a character's true motivation without spelling it out directly." },
          { id: "conflict", label: "Add conflict", prompt: "Introduce a conflict or opposing stance between two characters to heighten drama." },
        ],
      },
      {
        id: "style",
        label: "Style",
        presets: [
          { id: "cinematic", label: "Cinematic", prompt: "Continue with cinematic language, emphasizing visual, auditory, and olfactory details." },
          { id: "poetic", label: "Poetic", prompt: "Use more lyrical, rhythmic language in the continuation to raise literary quality." },
          { id: "minimal", label: "Minimal", prompt: "Continue with extreme restraint — strip modifiers, keep only core images." },
          { id: "humor", label: "Humor", prompt: "Add gentle humor or self-deprecation without breaking the overall mood." },
          { id: "sensory", label: "Sensory", prompt: "Strengthen all five senses in the continuation for deeper immersion." },
        ],
      },
    ] satisfies ContinuePresetGroup[],
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
    paragraphs: "Paragraphs",
    readingTime: (min: number) => `~${min} min read`,
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
    msgRegenerate: "Rewrite",
    msgContinue: "Continue",
    msgInsertContinue: "Insert & continue",
    regenerated: "Regenerated",
    askAi: "Ask AI",
    quotePrefix: "Selected text:",
    messagesRestored: "Previous conversation restored",
    msgReply: "Reply",
    replyTo: "Replying to",
    replyCancel: "Cancel",
    modeChat: "Chat",
    modeEdit: "Edit",
    modeAnalyze: "Analyze",
    modeChatHint: "Free conversation, AI helps with continuation",
    modeEditHint: "AI focuses on replaceable rewrites",
    modeAnalyzeHint: "AI gives structured analysis of the draft",
    streamFailed: "Interrupted — retry",
    retry: "Retry",
    retryContinue: "Continue",
    newConversation: "New chat",
    newConversationHint: "Clear current conversation and start fresh",
    conversationCleared: "Started a new conversation",
    summaryGenerated: "Conversation summary created — AI remembers earlier topics",
    summaryFailed: "Summary generation failed — conversation continues normally",
    historyTab: "History",
    historyEmpty: "No past conversations yet",
    historyLoad: "Load conversation",
    historyDelete: "Delete",
    historyDeleteConfirm: "Delete this conversation?",
    historyDeleted: "Conversation deleted",
    historyLoaded: "Loaded past conversation",
    historyMessages: (n: number) => `${n} messages`,
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
  const { user, requireAuth, refreshUser } = useAppContext();
  const { track } = useOpenPanel();
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [continueEntrySource, setContinueEntrySource] = useState<string | null>(null);
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
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "bible" | "fingerprint" | "history">("chat");
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [bibleActive, setBibleActive] = useState(false);
  const [autocompleteOn, setAutocompleteOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ai-write:autocomplete") === "on";
  });
  const [focusMode, setFocusMode] = useState(false);
  const [expandedPresetGroup, setExpandedPresetGroup] = useState<string | null>("plot");
  const [replyToIndex, setReplyToIndex] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<"chat" | "edit" | "analyze">("chat");
  const [failedStream, setFailedStream] = useState<{ instruction: string; partial: string; draftContext?: string } | null>(null);
  const [chatSummary, setChatSummary] = useState<string>("");
  const [summarizedUpTo, setSummarizedUpTo] = useState<number>(0);
  const [conversationUuid, setConversationUuid] = useState<string | null>(null);
  const [pendingNewConversation, setPendingNewConversation] = useState(false);
  const [conversationList, setConversationList] = useState<Array<{
    uuid: string;
    title: string | null;
    message_count: number;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const summaryGeneratingRef = useRef(false);
  const conversationUuidRef = useRef<string | null>(null);
  const pendingNewConversationRef = useRef(false);
  const dbSyncedForChatKeyRef = useRef<string | null>(null);
  const bibleCacheRef = useRef<{ text: string; characters: Array<{ name: string; block: string }>; storyUuid: string; version: number } | null>(null);
  const fingerprintCacheRef = useRef<{ text: string; fetchedAt: number } | null>(null);
  const bibleVersionRef = useRef(0);
  const restorePrefillRef = useRef(false);
  const restoredBlankDraftRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef("");
  const messagesRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const shouldStickEditorToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const pendingSaveAfterSignInRef = useRef(false);
  const pendingSaveResumeRef = useRef(false);
  const isProgrammaticChangeRef = useRef(false);
  const chatKeyRestoredRef = useRef<string | null>(null);

  const sourceLabel = useMemo(() => {
    if (source === "generator") return copy.sourceGenerator;
    if (source === "my-stories") return copy.sourceStory;
    if (!source) return copy.sourceUnknown;
    return copy.sourceBlank;
  }, [copy, source]);

  const wordCount = useMemo(() => getWordCount(plainText), [plainText]);
  const paragraphCount = useMemo(() => getParagraphCount(plainText), [plainText]);
  const readingMin = useMemo(() => getReadingTime(wordCount, locale), [wordCount, locale]);
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

  const chatKey = storyUuid || "blank";

  useEffect(() => {
    if (!isHydrated || chatKeyRestoredRef.current === chatKey) return;
    chatKeyRestoredRef.current = chatKey;
    try {
      const raw = window.localStorage.getItem(`${CHAT_MESSAGES_PREFIX}:${chatKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ role: "user" | "assistant"; content: string }> | null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-MAX_PERSISTED_MESSAGES));
          toast.success(copy.messagesRestored);
        }
      }
      const sumRaw = window.localStorage.getItem(`${CHAT_SUMMARY_PREFIX}:${chatKey}`);
      if (sumRaw) {
        const sumParsed = JSON.parse(sumRaw) as { summary?: string; summarizedUpTo?: number } | null;
        if (sumParsed?.summary) setChatSummary(sumParsed.summary);
        if (typeof sumParsed?.summarizedUpTo === "number") setSummarizedUpTo(sumParsed.summarizedUpTo);
      }
    } catch {
      // ignore corrupted data
    }
  }, [isHydrated, chatKey, copy.messagesRestored]);

  useEffect(() => {
    if (!isHydrated || !user || !storyUuid) return;
    if (dbSyncedForChatKeyRef.current === chatKey) return;
    dbSyncedForChatKeyRef.current = chatKey;

    let cancelled = false;
    (async () => {
      try {
        const convResp = await fetch(`/api/chat/conversations?story=${storyUuid}`);
        const convJson = await convResp.json();
        if (cancelled || convJson.code !== 0 || !Array.isArray(convJson.data)) return;

        const conversations = convJson.data as Array<{ uuid: string }>;
        if (conversations.length === 0) {
          setConversationUuid(null);
          return;
        }

        const latest = conversations[0];
        setConversationUuid(latest.uuid);

        const detailResp = await fetch(`/api/chat/conversations/${latest.uuid}`);
        const detailJson = await detailResp.json();
        if (cancelled || detailJson.code !== 0) return;

        const dbMessages = (detailJson.data?.messages ?? []).map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content as string,
        }));

        if (dbMessages.length > 0) {
          setMessages(dbMessages.slice(-MAX_PERSISTED_MESSAGES));
          try {
            window.localStorage.setItem(
              `${CHAT_MESSAGES_PREFIX}:${chatKey}`,
              JSON.stringify(dbMessages.slice(-MAX_PERSISTED_MESSAGES))
            );
          } catch {
            // ignore
          }
        }

        const sumCacheKey = `${CHAT_SUMMARY_PREFIX}:${chatKey}`;
        let shouldFetchSummary = true;
        try {
          const cached = window.localStorage.getItem(sumCacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as {
              summary?: string;
              summarizedUpTo?: number;
              noSummary?: boolean;
              checkedAt?: number;
            } | null;
            if (parsed?.summary) {
              setChatSummary(parsed.summary);
              if (typeof parsed.summarizedUpTo === "number") setSummarizedUpTo(parsed.summarizedUpTo);
              shouldFetchSummary = false;
            } else if (parsed?.noSummary && parsed.checkedAt && Date.now() - parsed.checkedAt < 86400000) {
              shouldFetchSummary = false;
            }
          }
        } catch {
          // ignore corrupted cache
        }

        if (!shouldFetchSummary) return;

        const sumResp = await fetch(`/api/chat-summary?story=${storyUuid}`);
        const sumJson = await sumResp.json();
        if (cancelled || sumJson.code !== 0) return;
        if (sumJson.data?.summary) {
          setChatSummary(sumJson.data.summary);
          setSummarizedUpTo(sumJson.data.summarized_message_count ?? 0);
        } else {
          try {
            window.localStorage.setItem(
              sumCacheKey,
              JSON.stringify({ summary: "", summarizedUpTo: 0, noSummary: true, checkedAt: Date.now() })
            );
          } catch {
            // ignore
          }
        }
      } catch {
        // silent fallback to localStorage
      }
    })();
    return () => { cancelled = true; };
  }, [isHydrated, chatKey, storyUuid, user]);

  useEffect(() => {
    if (!isHydrated || chatKeyRestoredRef.current !== chatKey) return;
    if (messages.length === 0) {
      try {
        window.localStorage.removeItem(`${CHAT_MESSAGES_PREFIX}:${chatKey}`);
      } catch {
        // ignore
      }
      return;
    }
    try {
      window.localStorage.setItem(
        `${CHAT_MESSAGES_PREFIX}:${chatKey}`,
        JSON.stringify(messages.slice(-MAX_PERSISTED_MESSAGES))
      );
    } catch {
      // ignore quota errors
    }
  }, [messages, isHydrated, chatKey]);

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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    conversationUuidRef.current = conversationUuid;
  }, [conversationUuid]);

  useEffect(() => {
    pendingNewConversationRef.current = pendingNewConversation;
  }, [pendingNewConversation]);

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
      // 读取并清理“继续续写”登录后意图:记录来源并埋点抵达
      let intentSource: string | null = null;
      try {
        const intentRaw = window.localStorage.getItem(CONTINUE_INTENT_KEY);
        if (intentRaw) {
          const intent = JSON.parse(intentRaw) as { source?: string } | null;
          if (intent?.source) {
            intentSource = intent.source;
            setContinueEntrySource(intent.source);
          }
          window.localStorage.removeItem(CONTINUE_INTENT_KEY);
        }
      } catch {
        // ignore invalid intent
      }

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

      if (intentSource) {
        track("post_auth_action_resumed", {
          source: intentSource,
          action: "continue_writing",
          source_page: intentSource || undefined,
        });
        track("ai_write_open_from_generator", {
          source_page: intentSource,
          prefill_restored: true,
          logged_in: true,
        });
      }
    } catch {
      // ignore invalid prefill
    }
  }, [content, copy.generatorRestored, isHydrated, storyUuid, title, track, continueEntrySource]);

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
          writePendingAuthResume({
            source: "story_save",
            action: "save_story",
            sourcePage: "ai-write",
            startedAt: Date.now(),
            payload: {
              title,
              content,
              plainText,
              instruction,
              storyUuid,
            },
          });
          requireAuth({ source: "story_save", action: "save_story", sourcePage: "ai-write" });
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
      requireAuth,
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

  const generateSummary = useCallback(
    async (droppedMessages: Array<{ role: "user" | "assistant"; content: string }>) => {
      if (summaryGeneratingRef.current || droppedMessages.length === 0 || !user) return;
      summaryGeneratingRef.current = true;

      try {
        const { buildSummaryPrompt } = await import("@/lib/ai-write-context");
        const oldSummary = chatSummary;
        const summaryPrompt = buildSummaryPrompt(oldSummary, droppedMessages);

        const response = await fetch("/api/chat/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "You are a conversation summarizer for a creative writing assistant. Compress the conversation into a concise summary that preserves key decisions, story direction, character details, style preferences, and unresolved questions.",
              },
              { role: "user", content: summaryPrompt },
            ],
            max_tokens: 500,
            storyId: storyUuid || undefined,
            metadata: { source: "summary" },
          }),
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let summaryText = "";

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
              const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) summaryText += delta;
            } catch {
              // ignore
            }
          }
        }

        const trimmed = summaryText.trim();
        if (trimmed) {
          setChatSummary(trimmed);
          const newSummarizedUpTo = summarizedUpTo + droppedMessages.length;
          setSummarizedUpTo(newSummarizedUpTo);

          if (storyUuid && user) {
            try {
              await fetch("/api/chat-summary", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  story_uuid: storyUuid,
                  summary: trimmed,
                  summarized_message_count: newSummarizedUpTo,
                }),
              });
            } catch {
              // non-blocking
            }
          }

          try {
            window.localStorage.setItem(
              `${CHAT_SUMMARY_PREFIX}:${chatKey}`,
              JSON.stringify({ summary: trimmed, summarizedUpTo: newSummarizedUpTo, updatedAt: new Date().toISOString() })
            );
          } catch {
            // ignore quota errors
          }
          toast.success(copy.summaryGenerated, { duration: 3000 });
          void refreshUserCredits();
        }
      } catch (err) {
        console.log("summary generation failed", err);
        toast.error(copy.summaryFailed, { duration: 4000 });
      } finally {
        summaryGeneratingRef.current = false;
      }
    },
    [chatKey, chatSummary, copy.summaryFailed, copy.summaryGenerated, refreshUserCredits, summarizedUpTo, storyUuid, user]
  );

  const performStream = useCallback(
    async (
      instructionText: string,
      options?: {
        draftContext?: string;
        mode?: "chat" | "edit" | "analyze";
        existingPartial?: string;
        captureFailure?: boolean;
      }
    ): Promise<string> => {
      const mode = options?.mode ?? chatMode;
      const effectiveDraft = options?.draftContext ?? plainText;
      const existingPartial = options?.existingPartial ?? "";
      const captureFailure = options?.captureFailure ?? true;

      setIsStreaming(true);
      setFailedStream(null);
      streamingContentRef.current = "";
      setStreamingText("");

      const controller = new AbortController();
      abortRef.current = controller;
      let appended = existingPartial;

      if (existingPartial) {
        setStreamingText(existingPartial);
      }

      try {
        const {
          tokenEstimate,
          planBudget,
          truncateHistory,
          truncateEditorContent,
          truncateBible,
        } = await import("@/lib/ai-write-context");

        let bibleText = "";
        let bibleCharacters: Array<{ name: string; block: string }> = [];

        const bibleCache = bibleCacheRef.current;
        if (bibleCache && bibleCache.storyUuid === storyUuid && bibleCache.version === bibleVersionRef.current) {
          bibleText = bibleCache.text;
          bibleCharacters = bibleCache.characters;
        } else if (storyUuid) {
          try {
            const bibleResp = await fetch(`/api/story-bible?story=${storyUuid}`, {
              signal: controller.signal,
            });
            const bibleJson = await bibleResp.json();
            if (bibleJson.code === 0 && bibleJson.data) {
              const bible = bibleJson.data;
              if (bible.characters?.length || bible.world_lore) {
                const { formatBibleForPrompt } = await import("@/lib/bible-format");
                bibleText = formatBibleForPrompt(bible);
                bibleCharacters = (bible.characters || [])
                  .filter((c: any) => c.name?.trim())
                  .map((c: any) => {
                    const lines = [`- ${c.name}${c.role ? ` (${c.role})` : ""}`];
                    if (c.personality?.trim()) lines.push(`  Personality: ${c.personality}`);
                    if (c.backstory?.trim()) lines.push(`  Backstory: ${c.backstory}`);
                    if (c.relationships?.trim()) lines.push(`  Relationships: ${c.relationships}`);
                    return { name: c.name, block: lines.join("\n") };
                  });
                bibleCacheRef.current = {
                  text: bibleText,
                  characters: bibleCharacters,
                  storyUuid,
                  version: bibleVersionRef.current,
                };
              }
            }
          } catch (err) {
            if ((err as Error)?.name === "AbortError") throw err;
          }
        }

        let fingerprintText = "";
        const fpCache = fingerprintCacheRef.current;
        if (fpCache && Date.now() - fpCache.fetchedAt < 300000) {
          fingerprintText = fpCache.text;
        } else {
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
                fingerprintText = active.sample_text.slice(0, 800);
                fingerprintCacheRef.current = { text: fingerprintText, fetchedAt: Date.now() };
              }
            }
          } catch (err) {
            if ((err as Error)?.name === "AbortError") throw err;
          }
        }

        const baseContextSuffix = (bibleText || fingerprintText)
          ? " Reference the provided character profiles, world lore, and style guidance to maintain consistency."
          : "";

        let systemPromptBase: string;
        if (mode === "analyze") {
          systemPromptBase =
            "You are a writing analysis assistant. Analyze the user's draft for consistency, pacing, character development, and plot coherence. Provide structured feedback with specific examples. Use clear headings and bullet points. Do NOT write new story content — only analyze what exists." +
            baseContextSuffix;
        } else if (mode === "edit") {
          systemPromptBase =
            "You are a creative editing assistant. Provide a polished rewrite of the text based on the user's instruction. Return only the rewritten text — it should be a direct replacement for the referenced passage, not an addition." +
            baseContextSuffix;
        } else {
          systemPromptBase =
            "You are a creative writing continuation assistant. Continue the draft according to the user's instruction and return only the text that should be appended next." +
            baseContextSuffix;
        }

        let systemPrompt = systemPromptBase;
        if (chatSummary) {
          systemPrompt += `\n\n== Previous conversation summary ==\n${chatSummary}`;
        }

        const plan = planBudget({
          system: tokenEstimate(systemPrompt),
          fingerprint: tokenEstimate(fingerprintText),
          instruction: tokenEstimate(instructionText),
        });

        const cursorOffset = editorRef.current?.state.selection.from ?? effectiveDraft.length;

        const editorRes = truncateEditorContent({
          text: effectiveDraft,
          tokenBudget: plan.editor,
          cursorOffset,
        });

        const bibleRes = bibleText
          ? truncateBible({
              bibleText,
              tokenBudget: plan.bible,
              instruction: instructionText,
              characters: bibleCharacters,
            })
          : { text: "", truncated: false };

        const compactHistory = messagesRef.current.map((m) => {
          if (m.role === "user") {
            const instrMatch = m.content.match(/Instruction:\s*([\s\S]*?)$/);
            return { role: m.role, content: instrMatch ? instrMatch[1].trim() : m.content.slice(-500) };
          }
          return { role: m.role, content: m.content };
        });

        const historyRes = truncateHistory(compactHistory, plan.history);
        const droppedMessages = historyRes.droppedCount > 0
          ? compactHistory.slice(0, historyRes.droppedCount)
          : [];

        const contextBlock = [bibleRes.text, fingerprintText ? `== Author's Writing Style ==\n${fingerprintText}` : ""]
          .filter(Boolean)
          .join("\n\n");

        let currentUserContent = `Current title: ${title || "Untitled"}\n\nCurrent draft:\n${editorRes.text}`;
        if (contextBlock) currentUserContent += `\n\n${contextBlock}`;
        currentUserContent += `\n\nInstruction:\n${instructionText}`;
        if (existingPartial) {
          currentUserContent += `\n\n== Previously generated (continue seamlessly from where this text ends) ==\n${existingPartial}`;
        }

        const finalMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...historyRes.messages,
          { role: "user", content: currentUserContent },
        ];

        const response = await fetch("/api/chat/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: finalMessages,
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

        streamingContentRef.current = appended.trim();
        void refreshUserCredits();

        if (
          droppedMessages.length >= SUMMARY_TRIGGER_THRESHOLD &&
          droppedMessages.length > summarizedUpTo &&
          user
        ) {
          void generateSummary(droppedMessages.slice(summarizedUpTo));
        }

        return appended.trim();
      } catch (error) {
        const isAbort = (error as Error)?.name === "AbortError";
        if (isAbort) {
          streamingContentRef.current = appended.trim();
          toast.success(copy.stopped);
          return appended.trim();
        }
        console.log("ai write stream failed", error);
        if (captureFailure && appended.trim()) {
          setFailedStream({
            instruction: instructionText,
            partial: appended.trim(),
            draftContext: options?.draftContext,
          });
        }
        toast.error(copy.continueFailed, { duration: 6000 });
        return "";
      } finally {
        abortRef.current = null;
        setStreamingText("");
        setIsStreaming(false);
      }
    },
    [chatMode, chatSummary, copy.continueFailed, copy.stopped, generateSummary, plainText, refreshUserCredits, source, storyUuid, summarizedUpTo, title, user]
  );

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
      requireAuth({ source: "ai_write", action: "continue_writing" });
      toast.error(copy.needLogin);
      return;
    }

    let userMsg = instruction;
    let draftOverride: string | undefined;

    if (replyToIndex !== null && messages[replyToIndex]) {
      const target = messages[replyToIndex];
      const quoteSnippet = target.content.length > 300 ? target.content.slice(0, 300) + "…" : target.content;
      userMsg = `${copy.replyTo}:\n${quoteSnippet}\n\n${instruction}`;
      if (target.role === "assistant") {
        draftOverride = plainText + "\n\n" + target.content;
      }
    }

    let activeConversationUuid = conversationUuidRef.current;

    if (
      storyUuid &&
      user &&
      (!activeConversationUuid || pendingNewConversationRef.current)
    ) {
      try {
        const resp = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            story_uuid: storyUuid,
            title: userMsg.slice(0, 100),
          }),
        });
        const json = await resp.json();
        if (json.code === 0 && json.data?.uuid) {
          activeConversationUuid = json.data.uuid;
          setConversationUuid(activeConversationUuid);
        }
      } catch {
        // non-blocking; messages still work via localStorage
      }
      setPendingNewConversation(false);
    }

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setReplyToIndex(null);

    const result = await performStream(userMsg, { draftContext: draftOverride });
    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);

      if (activeConversationUuid && storyUuid && user) {
        try {
          await fetch(`/api/chat/conversations/${activeConversationUuid}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "user", content: userMsg },
                { role: "assistant", content: result },
              ],
            }),
          });
        } catch {
          // non-blocking; localStorage cache still holds the data
        }
      }
    }
    setInstruction("");
  }, [
    copy.emptyContent,
    copy.emptyPrompt,
    copy.needLogin,
    copy.replyTo,
    instruction,
    messages,
    performStream,
    plainText,
    replyToIndex,
    requireAuth,
    storyUuid,
    user,
  ]);

  const handleRegenerate = useCallback(
    async (assistantIndex: number) => {
      if (!user) {
        requireAuth({ source: "ai_write", action: "continue_writing" });
        toast.error(copy.needLogin);
        return;
      }

      const userMsgIndex = assistantIndex - 1;
      const userMsg = messages[userMsgIndex];
      if (!userMsg || userMsg.role !== "user") return;

      const instructionText = userMsg.content;
      setMessages((prev) => prev.slice(0, userMsgIndex));

      const result = await performStream(instructionText, { captureFailure: false });
      if (result) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: instructionText },
          { role: "assistant", content: result },
        ]);
        toast.success(copy.regenerated);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: instructionText },
        ]);
      }
    },
    [copy.needLogin, copy.regenerated, messages, performStream, requireAuth, user]
  );

  const handleContinueMessage = useCallback(
    async (assistantIndex: number) => {
      if (!user) {
        requireAuth({ source: "ai_write", action: "continue_writing" });
        toast.error(copy.needLogin);
        return;
      }

      const assistantMsg = messages[assistantIndex];
      if (!assistantMsg || assistantMsg.role !== "assistant") return;

      const combinedDraft = plainText + "\n\n" + assistantMsg.content;
      const instructionText = copy.msgContinue + " — " + assistantMsg.content.slice(0, 200);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: copy.msgContinue },
      ]);

      const result = await performStream(instructionText, { draftContext: combinedDraft });
      if (result) {
        setMessages((prev) => [...prev, { role: "assistant", content: result }]);
      }
    },
    [copy.msgContinue, copy.needLogin, messages, performStream, plainText, requireAuth, user]
  );

  const handleRetryStream = useCallback(async () => {
    if (!failedStream || !user) return;
    const { instruction: failInstruction, partial, draftContext } = failedStream;
    setFailedStream(null);
    const result = await performStream(failInstruction, {
      draftContext,
      existingPartial: partial,
    });
    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    }
  }, [failedStream, performStream, user]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
    }
    setMessages([]);
    setReplyToIndex(null);
    setFailedStream(null);
    setConversationUuid(null);
    setPendingNewConversation(true);
    setInstruction("");
    try {
      window.localStorage.removeItem(`${CHAT_MESSAGES_PREFIX}:${chatKey}`);
    } catch {
      // ignore
    }
    toast.success(copy.conversationCleared);
  }, [chatKey, copy.conversationCleared, isStreaming, stopStreaming]);

  const refreshConversationList = useCallback(async () => {
    if (!storyUuid || !user) return;
    try {
      const resp = await fetch(`/api/chat/conversations?story=${storyUuid}`);
      const json = await resp.json();
      if (json.code === 0 && Array.isArray(json.data)) {
        setConversationList(json.data);
      }
    } catch {
      // ignore
    }
  }, [storyUuid, user]);

  const handleLoadConversation = useCallback(
    async (uuid: string) => {
      if (isStreaming) {
        stopStreaming();
      }
      try {
        const resp = await fetch(`/api/chat/conversations/${uuid}`);
        const json = await resp.json();
        if (json.code === 0 && json.data?.messages) {
          const msgs = (json.data.messages as Array<any>).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content as string,
          }));
          setMessages(msgs);
          setConversationUuid(uuid);
          setPendingNewConversation(false);
          setReplyToIndex(null);
          setFailedStream(null);
          try {
            window.localStorage.setItem(
              `${CHAT_MESSAGES_PREFIX}:${chatKey}`,
              JSON.stringify(msgs.slice(-MAX_PERSISTED_MESSAGES))
            );
          } catch {
            // ignore
          }
          setRightPanelTab("chat");
          toast.success(copy.historyLoaded);
        }
      } catch {
        toast.error(copy.continueFailed);
      }
    },
    [chatKey, copy.continueFailed, copy.historyLoaded, isStreaming, stopStreaming]
  );

  const handleDeleteConversation = useCallback(
    async (uuid: string) => {
      if (!window.confirm(copy.historyDeleteConfirm)) return;
      try {
        const resp = await fetch(`/api/chat/conversations/${uuid}`, { method: "DELETE" });
        const json = await resp.json();
        if (json.code === 0) {
          setConversationList((prev) => prev.filter((c) => c.uuid !== uuid));
          if (conversationUuidRef.current === uuid) {
            setConversationUuid(null);
            setPendingNewConversation(true);
            setMessages([]);
          }
          toast.success(copy.historyDeleted);
        }
      } catch {
        toast.error(copy.continueFailed);
      }
    },
    [copy.continueFailed, copy.historyDeleteConfirm, copy.historyDeleted]
  );

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
    if (!user) return;

    const resume = consumePendingAuthResume("save_story", {
      sourcePage: "ai-write",
    });
    if (resume?.source === "story_save") {
      const payload = resume.payload;
      const resumedTitle = typeof payload.title === "string" ? payload.title : "";
      const resumedContent = typeof payload.content === "string" ? payload.content : "";
      const resumedPlainText = typeof payload.plainText === "string" ? payload.plainText : resumedContent;
      const resumedInstruction = typeof payload.instruction === "string" ? payload.instruction : "";
      const resumedStoryUuid = typeof payload.storyUuid === "string" ? payload.storyUuid : "";

      if (resumedContent.trim() || resumedPlainText.trim()) {
        pendingSaveAfterSignInRef.current = true;
        pendingSaveResumeRef.current = true;
        if (resumedTitle) setTitle(resumedTitle);
        if (resumedContent) setContent(resumedContent);
        if (resumedPlainText) setPlainText(resumedPlainText);
        if (resumedInstruction) setInstruction(resumedInstruction);
        if (resumedStoryUuid) setStoryUuid(resumedStoryUuid);
        track("post_auth_action_resumed", buildPostAuthResumeTrackingPayload(resume));
      }
    }
  }, [track, user]);

  useEffect(() => {
    if (!user || !pendingSaveAfterSignInRef.current) return;
    if (!plainText.trim()) {
      if (pendingSaveResumeRef.current) return;
      pendingSaveAfterSignInRef.current = false;
      return;
    }
    pendingSaveAfterSignInRef.current = false;
    pendingSaveResumeRef.current = false;
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
        requireAuth({ source: "ai_write", action: "continue_writing" });
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
    [user, copy.needLogin, refreshUserCredits, requireAuth]
  );

  const handleSlashAI = useCallback(
    (action: "continue" | "improve" | "expand" | "summarize") => {
      if (!user) {
        requireAuth({ source: "ai_write", action: "continue_writing" });
        toast.error(copy.needLogin);
        return;
      }
      if (!plainText.trim()) {
        toast.error(copy.emptyContent);
        return;
      }
      const prompts: Record<string, string> = {
        continue: copy.presets[0].prompt,
        improve: copy.selectionActions[0].prompt,
        expand: copy.selectionActions[3].prompt,
        summarize: locale.startsWith("zh")
          ? "请总结以下内容的要点，用简洁的列表形式呈现。"
          : "Summarize the key points of the following content in a concise bullet list.",
      };
      setInstruction(prompts[action]);
    },
    [user, plainText, copy, locale, requireAuth]
  );

  const handleAskAi = useCallback(
    (selectedText: string) => {
      if (!user) {
        requireAuth({ source: "ai_write", action: "continue_writing" });
        toast.error(copy.needLogin);
        return;
      }
      setRightPanelTab("chat");
      setChatVisible(true);
      const quoted = selectedText.length > 300 ? selectedText.slice(0, 300) + "…" : selectedText;
      setInstruction((prev) => {
        const base = prev.trim();
        const quoteBlock = `${copy.quotePrefix}\n${quoted}`;
        return base ? `${base}\n\n${quoteBlock}` : quoteBlock;
      });
    },
    [copy.needLogin, copy.quotePrefix, requireAuth, user]
  );

  const handleConsistencyCheck = useCallback(async () => {
    if (!user) {
      requireAuth({ source: "ai_write", action: "continue_writing" });
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
      // Build bible context (use cache if available)
      let bibleContext = "";
      if (storyUuid) {
        const cached = bibleCacheRef.current;
        if (cached && cached.storyUuid === storyUuid && cached.version === bibleVersionRef.current && cached.text) {
          bibleContext = `\n\n== Character Profiles & World Lore ==\n${cached.text}`;
        } else {
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
  }, [copy, plainText, refreshUserCredits, requireAuth, storyUuid, user]);

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
    <section
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background"
      data-continue-entry={continueEntrySource ? "continue-entry" : "default-entry"}
    >
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
            {copy.wordCount}: {wordCount} · {copy.paragraphs}: {paragraphCount} · {copy.readingTime(readingMin)}
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
              onAskAi={handleAskAi}
              askAiLabel={copy.askAi}
              autocompleteOn={autocompleteOn}
              onToggleAutocomplete={toggleAutocomplete}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((v) => !v)}
              onSlashAI={handleSlashAI}
              title={title}
              plainText={plainText}
              isAuthenticated={!!user}
              onSignIn={() =>
                requireAuth({ source: "ai_write", action: "continue_writing" })
              }
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
              "group relative z-30 hidden w-1 cursor-col-resize bg-border/60 transition-colors hover:bg-orange-500/50 md:block",
              isResizing && "bg-orange-500"
            )}
          >
            <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
            <div className="absolute inset-y-0 left-1/2 z-30 flex -translate-x-1/2 items-center">
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border bg-background shadow-md transition",
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
          "flex flex-col overflow-hidden bg-muted/20 backdrop-blur-sm transition-[opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative",
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
          <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border/30 bg-background/50 px-2 py-1.5">
            <button
              type="button"
              aria-label="Chat tab"
              aria-pressed={rightPanelTab === "chat"}
              onClick={() => setRightPanelTab("chat")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                rightPanelTab === "chat"
                  ? "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20"
                  : "text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
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
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                rightPanelTab === "bible"
                  ? "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20"
                  : "text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
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
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                rightPanelTab === "fingerprint"
                  ? "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20"
                  : "text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon name="RiFingerprint2Line" className="size-3.5" />
              <span className="hidden sm:inline">Style</span>
            </button>
            {user && storyUuid && (
              <button
                type="button"
                aria-label="History tab"
                aria-pressed={rightPanelTab === "history"}
                onClick={() => {
                  setRightPanelTab("history");
                  void refreshConversationList();
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                  rightPanelTab === "history"
                    ? "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20"
                    : "text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon name="RiHistoryLine" className="size-3.5" />
                <span className="hidden sm:inline">{copy.historyTab}</span>
              </button>
            )}
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
              <StoryBiblePanel
                storyUuid={storyUuid}
                onBibleChange={(active) => {
                  setBibleActive(active);
                  bibleVersionRef.current++;
                  bibleCacheRef.current = null;
                }}
              />
            </div>
          )}
          {rightPanelTab === "fingerprint" && (
            <div key="fingerprint" className="animate-fade-in-up flex-1 overflow-auto">
              <StyleFingerprintPanel />
            </div>
          )}

          {/* History panel */}
          {rightPanelTab === "history" && (
            <div key="history" className="animate-fade-in-up flex-1 overflow-auto px-4 py-4">
              {conversationList.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-orange-500/8 ring-1 ring-orange-500/10">
                    <Icon name="RiHistoryLine" className="size-6 text-orange-600/60" />
                  </div>
                  <p className="max-w-[220px] text-[13px] leading-6 text-muted-foreground/70">
                    {copy.historyEmpty}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversationList.map((conv) => {
                    const isActive = conv.uuid === conversationUuid;
                    const dateStr = conv.created_at
                      ? new Date(conv.created_at).toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";
                    return (
                      <div
                        key={conv.uuid}
                        className={cn(
                          "group rounded-xl border p-3 transition",
                          isActive
                            ? "border-orange-300 bg-orange-50/40 dark:border-orange-700/30 dark:bg-orange-900/10"
                            : "border-border/30 bg-background/40 hover:border-border/50 hover:bg-muted/30"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => void handleLoadConversation(conv.uuid)}
                          className="block w-full text-left"
                        >
                          <p className="line-clamp-1 text-[13px] font-medium text-foreground/90">
                            {conv.title || copy.historyLoad}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/60">
                            <span>{copy.historyMessages(conv.message_count)}</span>
                            <span>·</span>
                            <span>{dateStr}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          title={copy.historyDelete}
                          onClick={() => void handleDeleteConversation(conv.uuid)}
                          className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground/40 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                        >
                          <Icon name="RiDeleteBin6Line" className="size-3" />
                          {copy.historyDelete}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Messages area — only in chat tab */}
          {rightPanelTab === "chat" && <div className="flex-1 overflow-auto px-4 py-5">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex h-full flex-col">
                <div className="flex flex-col items-center justify-center pb-8 pt-6 text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-orange-500/8 ring-1 ring-orange-500/10">
                    <Icon name="RiChatSmile2Line" className="size-7 text-orange-600/70" />
                  </div>
                  <p className="max-w-[240px] text-[13px] leading-6 text-muted-foreground/80">
                    {copy.messagesEmpty}
                  </p>
                </div>
                <div className="space-y-2">
                  {copy.presetGroups.map((group) => {
                    const isOpen = expandedPresetGroup === group.id;
                    return (
                      <div key={group.id} className={cn(
                        "rounded-xl border overflow-hidden transition-colors",
                        isOpen
                          ? "border-orange-200/60 bg-orange-50/30 dark:border-orange-700/30 dark:bg-orange-900/10"
                          : "border-border/30 bg-background/40 hover:border-border/50"
                      )}>
                        <button
                          type="button"
                          onClick={() => setExpandedPresetGroup(isOpen ? null : group.id)}
                          className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium text-foreground/75 transition hover:text-foreground"
                        >
                          <span>{group.label}</span>
                          <Icon
                            name="RiArrowDownSLine"
                            className={cn(
                              "size-4 text-muted-foreground/60 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isOpen && (
                          <div className="flex flex-wrap gap-1.5 px-3.5 pb-3 pt-0.5">
                            {group.presets.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                title={preset.prompt}
                                onClick={() => {
                                  setInstruction(preset.prompt);
                                  toast.success(copy.presetFilled);
                                }}
                                className="rounded-lg border border-border/40 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/70 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:hover:border-orange-600/40 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "group flex gap-2.5",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/10 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/15">
                        <Icon name="RiSparkling2Line" className="size-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        message.role === "user"
                          ? "bg-foreground/[0.04] text-foreground ring-1 ring-inset ring-border/30 dark:bg-foreground/[0.06]"
                          : "bg-background text-foreground ring-1 ring-border/40 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.06)] dark:ring-border/30"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      {message.role === "user" && (
                        <div className="mt-1.5 flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            title={copy.msgReply}
                            disabled={isStreaming}
                            onClick={() => setReplyToIndex(index)}
                            className="flex size-5 items-center justify-center rounded-md text-muted-foreground/50 transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                          >
                            <Icon name="RiReplyLine" className="size-3" />
                          </button>
                        </div>
                      )}
                      {message.role === "assistant" && (
                        <div className="mt-2.5 flex items-center gap-0.5 border-t border-border/20 pt-2 text-muted-foreground/60 opacity-0 transition group-hover:opacity-100">
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
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-muted hover:text-foreground"
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
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-muted hover:text-foreground"
                          >
                            <Icon name="RiArrowDownLine" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title={copy.msgRegenerate}
                            disabled={isStreaming}
                            onClick={() => void handleRegenerate(index)}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                          >
                            <Icon name="RiRefreshLine" className="size-3.5" />
                          </button>
                          {index === messages.length - 1 && (
                            <button
                              type="button"
                              title={copy.msgContinue}
                              disabled={isStreaming}
                              onClick={() => void handleContinueMessage(index)}
                              className="flex size-6 items-center justify-center rounded-md transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                            >
                              <Icon name="RiQuillPenLine" className="size-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title={copy.msgReply}
                            disabled={isStreaming}
                            onClick={() => setReplyToIndex(index)}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                          >
                            <Icon name="RiReplyLine" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title={copy.msgDelete}
                            onClick={() => {
                              setMessages((prev) => prev.filter((_, i) => i !== index));
                            }}
                            className="flex size-6 items-center justify-center rounded-md transition hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                          >
                            <Icon name="RiDeleteBin6Line" className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border/30 dark:bg-muted/50">
                        <Icon name="RiUser3Line" className="size-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/10 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/15">
                      <Icon name="RiSparkling2Line" className="size-4" />
                    </div>
                    <div className="min-w-0 max-w-[85%] rounded-2xl bg-background px-3.5 py-2.5 ring-1 ring-border/40 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.06)] dark:ring-border/30">
                      {streamingText ? (
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/90">
                          {streamingText}
                          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-orange-500 text-transparent">|</span>
                        </p>
                      ) : (
                        <div className="flex items-center gap-1 py-0.5">
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500/70" />
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500/70 [animation-delay:0.15s]" />
                          <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-500/70 [animation-delay:0.3s]" />
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
          {rightPanelTab === "chat" && <div className="relative border-t border-border/30 bg-background/50 p-3">
            {messages.length > 0 && !isStreaming && (
              <button
                type="button"
                title={copy.newConversation}
                onClick={handleNewConversation}
                className="absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-lg border border-border/40 bg-background/80 text-muted-foreground/70 shadow-sm backdrop-blur-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:border-orange-600/40 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                <Icon name="RiAddLine" className="size-4" />
              </button>
            )}
            {failedStream && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-700/40 dark:bg-amber-900/20">
                <Icon name="RiErrorWarningLine" className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="flex-1 text-amber-700 dark:text-amber-300">{copy.streamFailed}</span>
                <button
                  type="button"
                  onClick={() => void handleRetryStream()}
                  className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-amber-500"
                >
                  {copy.retryContinue}
                </button>
                <button
                  type="button"
                  onClick={() => setFailedStream(null)}
                  className="text-amber-600 transition hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                >
                  <Icon name="RiCloseLine" className="size-4" />
                </button>
              </div>
            )}
            {replyToIndex !== null && messages[replyToIndex] && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-xs dark:border-orange-700/30 dark:bg-orange-900/15">
                <Icon name="RiReplyLine" className="size-3.5 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-orange-700 dark:text-orange-300 font-medium">{copy.replyTo}</span>
                  <p className="mt-0.5 text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                    {messages[replyToIndex].content}
                  </p>
                </div>
                <button
                  type="button"
                  title={copy.replyCancel}
                  onClick={() => setReplyToIndex(null)}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  <Icon name="RiCloseLine" className="size-4" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-border/40 bg-background/60 p-2 shadow-sm transition focus-within:border-orange-300/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-orange-500/10 dark:focus-within:border-orange-500/30">
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
                  "flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed outline-none transition placeholder:text-muted-foreground/40",
                  isStreaming && "opacity-50"
                )}
              />
              <Button
                size="sm"
                className={cn(
                  "h-8 w-8 shrink-0 rounded-xl p-0 text-white transition active:scale-95",
                  isStreaming
                    ? "bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
                    : "bg-orange-600 hover:bg-orange-500 shadow-sm shadow-orange-500/20"
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
