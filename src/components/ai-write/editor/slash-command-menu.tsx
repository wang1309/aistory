"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useLocale } from "next-intl";
import {
  RiText,
  RiH1,
  RiH2,
  RiH3,
  RiBold,
  RiItalic,
  RiUnderline,
  RiStrikethrough,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiCodeLine,
  RiSeparator,
  RiTableLine,
  RiListCheck2,
  RiMagicLine,
  RiEditLine,
  RiExpandDiagonalLine,
  RiFileReduceLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import {
  closeSlashCommand,
  getSlashCommandState,
  getSlashStorage,
  setSlashStorage,
  type SlashRange,
} from "./slash-command";

type SlashCopy = {
  textTitle: string;
  textDesc: string;
  heading1Title: string;
  heading1Desc: string;
  heading2Title: string;
  heading2Desc: string;
  heading3Title: string;
  heading3Desc: string;
  boldTitle: string;
  boldDesc: string;
  italicTitle: string;
  italicDesc: string;
  underlineTitle: string;
  underlineDesc: string;
  strikeTitle: string;
  strikeDesc: string;
  bulletListTitle: string;
  bulletListDesc: string;
  orderedListTitle: string;
  orderedListDesc: string;
  quoteTitle: string;
  quoteDesc: string;
  codeBlockTitle: string;
  codeBlockDesc: string;
  dividerTitle: string;
  dividerDesc: string;
  tableTitle: string;
  tableDesc: string;
  taskListTitle: string;
  taskListDesc: string;
  aiContinueTitle: string;
  aiContinueDesc: string;
  aiImproveTitle: string;
  aiImproveDesc: string;
  aiExpandTitle: string;
  aiExpandDesc: string;
  aiSummarizeTitle: string;
  aiSummarizeDesc: string;
};

function getCopy(locale: string): SlashCopy {
  if (locale.startsWith("zh")) {
    return {
      textTitle: "正文",
      textDesc: "普通段落文本",
      heading1Title: "标题 1",
      heading1Desc: "大标题",
      heading2Title: "标题 2",
      heading2Desc: "中标题",
      heading3Title: "标题 3",
      heading3Desc: "小标题",
      boldTitle: "粗体",
      boldDesc: "加粗强调文字",
      italicTitle: "斜体",
      italicDesc: "倾斜文字",
      underlineTitle: "下划线",
      underlineDesc: "文字下方加线",
      strikeTitle: "删除线",
      strikeDesc: "中划线标记",
      bulletListTitle: "无序列表",
      bulletListDesc: "圆点项目符号",
      orderedListTitle: "有序列表",
      orderedListDesc: "数字编号列表",
      quoteTitle: "引用",
      quoteDesc: "引用块样式",
      codeBlockTitle: "代码块",
      codeBlockDesc: "等宽代码片段",
      dividerTitle: "分割线",
      dividerDesc: "水平分隔线",
      tableTitle: "表格",
      tableDesc: "插入 3×3 表格",
      taskListTitle: "任务列表",
      taskListDesc: "带勾选框的列表",
      aiContinueTitle: "AI 续写",
      aiContinueDesc: "让 AI 继续写下去",
      aiImproveTitle: "AI 润色",
      aiImproveDesc: "优化当前内容的表达",
      aiExpandTitle: "AI 扩写",
      aiExpandDesc: "扩展当前内容，增加细节",
      aiSummarizeTitle: "AI 总结",
      aiSummarizeDesc: "总结当前内容要点",
    };
  }
  return {
    textTitle: "Text",
    textDesc: "Plain paragraph",
    heading1Title: "Heading 1",
    heading1Desc: "Large section title",
    heading2Title: "Heading 2",
    heading2Desc: "Medium section title",
    heading3Title: "Heading 3",
    heading3Desc: "Small section title",
    boldTitle: "Bold",
    boldDesc: "Emphasize text",
    italicTitle: "Italic",
    italicDesc: "Italicized text",
    underlineTitle: "Underline",
    underlineDesc: "Underlined text",
    strikeTitle: "Strikethrough",
    strikeDesc: "Struck-through text",
    bulletListTitle: "Bullet List",
    bulletListDesc: "Unordered bullet list",
    orderedListTitle: "Ordered List",
    orderedListDesc: "Numbered list",
    quoteTitle: "Quote",
    quoteDesc: "Blockquote style",
    codeBlockTitle: "Code Block",
    codeBlockDesc: "Monospaced code snippet",
    dividerTitle: "Divider",
    dividerDesc: "Horizontal rule",
    tableTitle: "Table",
    tableDesc: "Insert a 3×3 table",
    taskListTitle: "Task List",
    taskListDesc: "Checklist with checkboxes",
    aiContinueTitle: "AI Continue",
    aiContinueDesc: "Let AI continue writing",
    aiImproveTitle: "AI Improve",
    aiImproveDesc: "Polish and refine the content",
    aiExpandTitle: "AI Expand",
    aiExpandDesc: "Add more details and depth",
    aiSummarizeTitle: "AI Summarize",
    aiSummarizeDesc: "Summarize the key points",
  };
}

type Icon = React.ComponentType<{ className?: string }>;

type SlashContext = {
  onAIAction?: (action: "continue" | "improve" | "expand" | "summarize") => void;
};

type SlashItem = {
  id: string;
  icon: Icon;
  title: string;
  description: string;
  keywords: string[];
  run: (editor: Editor, ctx?: SlashContext) => void;
};

function buildItems(copy: SlashCopy): SlashItem[] {
  return [
    {
      id: "text",
      icon: RiText,
      title: copy.textTitle,
      description: copy.textDesc,
      keywords: ["text", "paragraph", "normal", "正文", "段落"],
      run: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      id: "heading1",
      icon: RiH1,
      title: copy.heading1Title,
      description: copy.heading1Desc,
      keywords: ["h1", "heading", "title", "大标题", "标题"],
      run: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: "heading2",
      icon: RiH2,
      title: copy.heading2Title,
      description: copy.heading2Desc,
      keywords: ["h2", "heading", "subtitle", "中标题"],
      run: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: "heading3",
      icon: RiH3,
      title: copy.heading3Title,
      description: copy.heading3Desc,
      keywords: ["h3", "heading", "小标题"],
      run: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: "bold",
      icon: RiBold,
      title: copy.boldTitle,
      description: copy.boldDesc,
      keywords: ["bold", "strong", "粗体", "加粗"],
      run: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      id: "italic",
      icon: RiItalic,
      title: copy.italicTitle,
      description: copy.italicDesc,
      keywords: ["italic", "em", "斜体"],
      run: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      id: "underline",
      icon: RiUnderline,
      title: copy.underlineTitle,
      description: copy.underlineDesc,
      keywords: ["underline", "下划线"],
      run: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
    {
      id: "strike",
      icon: RiStrikethrough,
      title: copy.strikeTitle,
      description: copy.strikeDesc,
      keywords: ["strike", "strikethrough", "delete", "删除线"],
      run: (editor) => editor.chain().focus().toggleStrike().run(),
    },
    {
      id: "bulletList",
      icon: RiListUnordered,
      title: copy.bulletListTitle,
      description: copy.bulletListDesc,
      keywords: ["bullet", "list", "unordered", "ul", "无序列表", "列表"],
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: "orderedList",
      icon: RiListOrdered,
      title: copy.orderedListTitle,
      description: copy.orderedListDesc,
      keywords: ["ordered", "list", "ol", "numbered", "有序列表", "编号"],
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: "quote",
      icon: RiDoubleQuotesL,
      title: copy.quoteTitle,
      description: copy.quoteDesc,
      keywords: ["quote", "blockquote", "引用"],
      run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "codeBlock",
      icon: RiCodeLine,
      title: copy.codeBlockTitle,
      description: copy.codeBlockDesc,
      keywords: ["code", "codeblock", "代码", "代码块"],
      run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: "divider",
      icon: RiSeparator,
      title: copy.dividerTitle,
      description: copy.dividerDesc,
      keywords: ["divider", "hr", "rule", "separator", "分割线", "分隔线"],
      run: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      id: "table",
      icon: RiTableLine,
      title: copy.tableTitle,
      description: copy.tableDesc,
      keywords: ["table", "grid", "表格"],
      run: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      id: "taskList",
      icon: RiListCheck2,
      title: copy.taskListTitle,
      description: copy.taskListDesc,
      keywords: ["task", "todo", "check", "checkbox", "任务", "待办", "清单"],
      run: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: "ai-continue",
      icon: RiMagicLine,
      title: copy.aiContinueTitle,
      description: copy.aiContinueDesc,
      keywords: ["ai", "continue", "write", "续写", "继续", "生成"],
      run: (_editor, ctx) => ctx?.onAIAction?.("continue"),
    },
    {
      id: "ai-improve",
      icon: RiEditLine,
      title: copy.aiImproveTitle,
      description: copy.aiImproveDesc,
      keywords: ["ai", "improve", "polish", "润色", "优化", "改善"],
      run: (_editor, ctx) => ctx?.onAIAction?.("improve"),
    },
    {
      id: "ai-expand",
      icon: RiExpandDiagonalLine,
      title: copy.aiExpandTitle,
      description: copy.aiExpandDesc,
      keywords: ["ai", "expand", "detail", "扩写", "扩展", "详细"],
      run: (_editor, ctx) => ctx?.onAIAction?.("expand"),
    },
    {
      id: "ai-summarize",
      icon: RiFileReduceLine,
      title: copy.aiSummarizeTitle,
      description: copy.aiSummarizeDesc,
      keywords: ["ai", "summarize", "summary", "总结", "摘要", "概括"],
      run: (_editor, ctx) => ctx?.onAIAction?.("summarize"),
    },
  ];
}

function filterItems(items: SlashItem[], query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    if (item.id.toLowerCase().includes(q)) return true;
    return item.keywords.some((k) => k.toLowerCase().includes(q));
  });
}

function applyItem(editor: Editor, range: SlashRange, item: SlashItem, ctx?: SlashContext) {
  editor.chain().focus().deleteRange(range).run();
  item.run(editor, ctx);
}

type MenuPos = { left: number; top: number };

type Props = {
  editor: Editor;
  onAIAction?: (action: "continue" | "improve" | "expand" | "summarize") => void;
};

export function SlashCommandMenu({ editor, onAIAction }: Props) {
  const locale = useLocale();
  const copy = useMemo(() => getCopy(locale), [locale]);
  const items = useMemo(() => buildItems(copy), [copy]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const highlightedRef = useRef(0);

  const [active, setActive] = useState(false);
  const [range, setRange] = useState<SlashRange>({ from: -1, to: -1 });
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [pos, setPos] = useState<MenuPos>({ left: 0, top: 0 });

  const filtered = useMemo(() => filterItems(items, query), [items, query]);

  useEffect(() => {
    highlightedRef.current = highlighted;
  }, [highlighted]);

  const syncState = useCallback(() => {
    const s = getSlashCommandState(editor);
    setActive(s.active);
    setRange(s.range);
    setQuery((prev) => (prev === s.query ? prev : s.query));
  }, [editor]);

  const handleClose = useCallback(() => {
    closeSlashCommand(editor);
  }, [editor]);

  useEffect(() => {
    editor.on("transaction", syncState);
    editor.on("selectionUpdate", syncState);
    editor.on("blur", handleClose);
    return () => {
      editor.off("transaction", syncState);
      editor.off("selectionUpdate", syncState);
      editor.off("blur", handleClose);
      setSlashStorage(editor, {});
    };
  }, [editor, syncState, handleClose]);

  useLayoutEffect(() => {
    if (!active || !containerRef.current) return;
    const coords = editor.view.coordsAtPos(range.from);
    const rect = containerRef.current.getBoundingClientRect();
    setPos({ left: coords.left - rect.left, top: coords.bottom - rect.top + 6 });
  }, [editor, active, range.from]);

  useEffect(() => {
    if (active && filtered.length > 0) {
      if (highlighted >= filtered.length) setHighlighted(0);
    }
  }, [active, filtered.length, highlighted]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    if (!active || filtered.length === 0) {
      setSlashStorage(editor, {});
      return;
    }

    const clamp = (i: number) =>
      ((i % filtered.length) + filtered.length) % filtered.length;

    setSlashStorage(editor, {
      onNext: () => setHighlighted((i) => clamp(i + 1)),
      onPrev: () => setHighlighted((i) => clamp(i - 1)),
      onEnter: () => {
        const item = filtered[highlightedRef.current];
        if (!item) return;
        applyItem(editor, range, item, { onAIAction });
      },
      onEscape: handleClose,
    });

    return () => {
      setSlashStorage(editor, {});
    };
  }, [editor, active, range, filtered, handleClose, onAIAction]);

  if (!active || filtered.length === 0) return null;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-30">
      <div
        className="pointer-events-auto absolute max-h-72 w-64 overflow-y-auto rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg"
        style={{ left: pos.left, top: pos.top }}
      >
        {filtered.map((item, i) => (
          <button
            key={item.id}
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHighlighted(i)}
            onClick={() => applyItem(editor, range, item, { onAIAction })}
            className={cn(
              "flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition",
              i === highlighted
                ? "bg-orange-50 dark:bg-orange-900/20"
                : "hover:bg-muted"
            )}
          >
            <item.icon className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-300" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-tight">
                {item.title}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
