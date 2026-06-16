"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RiCloseLine, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

function getCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      search: "查找",
      replace: "替换",
      replaceAll: "全部替换",
      noResults: "无结果",
      of: "/",
    };
  }
  return {
    search: "Find",
    replace: "Replace",
    replaceAll: "Replace All",
    noResults: "No results",
    of: "/",
  };
}

type SearchReplaceProps = {
  editor: Editor;
  onClose: () => void;
};

type Match = { from: number; to: number };

function findMatches(editor: Editor, query: string): Match[] {
  if (!query) return [];
  const results: Match[] = [];
  const lowerQuery = query.toLowerCase();
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text.toLowerCase();
    let index = 0;
    while (index < text.length) {
      const found = text.indexOf(lowerQuery, index);
      if (found === -1) break;
      results.push({ from: pos + found, to: pos + found + query.length });
      index = found + 1;
    }
  });
  return results;
}

export function SearchReplace({ editor, onClose }: SearchReplaceProps) {
  const locale = useLocale();
  const copy = getCopy(locale);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const results = findMatches(editor, searchQuery);
    setMatches(results);
    if (results.length > 0) {
      setCurrentIndex(0);
      scrollToMatch(results[0]);
    }
  }, [searchQuery, editor]);

  const scrollToMatch = useCallback(
    (match: Match) => {
      editor.chain().focus().setTextSelection(match).run();
      const domAtPos = editor.view.domAtPos(match.from);
      const node = domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [editor]
  );

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    scrollToMatch(matches[next]);
  }, [matches, currentIndex, scrollToMatch]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
    scrollToMatch(matches[prev]);
  }, [matches, currentIndex, scrollToMatch]);

  const handleReplace = useCallback(() => {
    if (matches.length === 0) return;
    const match = matches[currentIndex];
    editor.chain().focus().setTextSelection(match).insertContent(replaceQuery).run();
    const newMatches = findMatches(editor, searchQuery);
    setMatches(newMatches);
    if (newMatches.length > 0) {
      const idx = Math.min(currentIndex, newMatches.length - 1);
      setCurrentIndex(idx);
      scrollToMatch(newMatches[idx]);
    }
  }, [editor, matches, currentIndex, replaceQuery, searchQuery, scrollToMatch]);

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0) return;
    const reversedMatches = [...matches].reverse();
    editor.chain().focus().command(({ tr }) => {
      for (const match of reversedMatches) {
        tr.replaceWith(match.from, match.to, editor.schema.text(replaceQuery));
      }
      return true;
    }).run();
    setMatches([]);
    setCurrentIndex(0);
  }, [editor, matches, replaceQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goNext();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        goPrev();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  return (
    <div className="absolute right-3 top-12 z-20 flex flex-col gap-2 rounded-lg border border-border/60 bg-popover p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <Input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={copy.search}
          className="h-8 w-48 text-sm"
        />
        <span className="min-w-[50px] text-xs text-muted-foreground">
          {matches.length > 0
            ? `${currentIndex + 1}${copy.of}${matches.length}`
            : searchQuery
              ? copy.noResults
              : ""}
        </span>
        <button type="button" onClick={goPrev} className="rounded p-1 hover:bg-muted" disabled={matches.length === 0}>
          <RiArrowUpLine className="size-4" />
        </button>
        <button type="button" onClick={goNext} className="rounded p-1 hover:bg-muted" disabled={matches.length === 0}>
          <RiArrowDownLine className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowReplace(!showReplace)}
          className={cn("rounded px-1.5 py-0.5 text-xs hover:bg-muted", showReplace && "bg-muted")}
        >
          {copy.replace}
        </button>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted">
          <RiCloseLine className="size-4" />
        </button>
      </div>
      {showReplace && (
        <div className="flex items-center gap-2">
          <Input
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder={copy.replace}
            className="h-8 w-48 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleReplace} disabled={matches.length === 0} className="h-7 text-xs">
            {copy.replace}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReplaceAll} disabled={matches.length === 0} className="h-7 text-xs">
            {copy.replaceAll}
          </Button>
        </div>
      )}
    </div>
  );
}
