"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { computeDiffRanges } from "./text-diff";
import {
  setReviewHighlights,
  clearReviewHighlights,
} from "./review-highlight";
import {
  shouldShowReviewMenu,
  type ReviewMenuState,
} from "./review-menu-state";

export type SelectionAction = {
  id: string;
  label: string;
  prompt: string;
};

type ReviewState = ReviewMenuState & {
  originalText: string;
  action: SelectionAction;
};

type SelectionToolbarProps = {
  editor: Editor;
  actions: SelectionAction[];
  onProcess: (text: string, prompt: string) => Promise<string>;
  labels?: {
    processing?: string;
    accept?: string;
    retry?: string;
    reject?: string;
  };
  isAuthenticated?: boolean;
  needLoginLabel?: string;
};

export function SelectionToolbar({
  editor,
  actions,
  onProcess,
  labels,
  isAuthenticated = true,
  needLoginLabel = "Sign in required",
}: SelectionToolbarProps) {
  const [review, setReview] = useState<ReviewState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Prevent auto-accept from firing during programmatic selection changes
  const transitioningRef = useRef(false);

  const preventButtonMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const doAccept = useCallback(() => {
    clearReviewHighlights(editor);
    const pos = review?.to ?? editor.state.selection.to;
    transitioningRef.current = true;
    setReview(null);
    editor.chain().focus(pos).setTextSelection(pos).run();
    queueMicrotask(() => {
      transitioningRef.current = false;
    });
  }, [editor, review]);

  // Reset transition flag once React has committed the reviewing state
  useEffect(() => {
    if (review?.phase === "reviewing") {
      transitioningRef.current = false;
    }
  }, [review]);

  useEffect(() => {
    const editorElement = editor.view.dom;
    const isReviewing = review?.phase === "reviewing";

    editorElement.classList.toggle("ai-write-review-selection", isReviewing);

    return () => {
      editorElement.classList.remove("ai-write-review-selection");
    };
  }, [editor, review?.phase]);

  const applyResult = useCallback(
    (
      from: number,
      originalText: string,
      result: string,
      action: SelectionAction
    ) => {
      transitioningRef.current = true;

      const diffRanges = computeDiffRanges(originalText, result);

      editor
        .chain()
        .insertContentAt({ from, to: from + originalText.length }, result)
        .setTextSelection({ from, to: from + result.length })
        .run();

      const absoluteRanges = diffRanges.map((r) => ({
        from: r.from + from,
        to: r.to + from,
      }));
      setReviewHighlights(editor, absoluteRanges);

      setReview({
        phase: "reviewing",
        from,
        to: from + result.length,
        originalText,
        action,
      });

      editor.commands.focus();
    },
    [editor]
  );

  const doReject = useCallback(() => {
    if (!review) return;
    clearReviewHighlights(editor);
    transitioningRef.current = true;
    const cursorPos = review.from + review.originalText.length;
    setReview(null);
    editor
      .chain()
      .insertContentAt(
        { from: review.from, to: review.to },
        review.originalText
      )
      .focus(cursorPos)
      .setTextSelection(cursorPos)
      .run();
    queueMicrotask(() => {
      transitioningRef.current = false;
    });
  }, [editor, review]);

  // Esc = reject when in reviewing phase
  useEffect(() => {
    if (!review || review.phase !== "reviewing") return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        doReject();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [review, doReject]);

  const doRetry = useCallback(async () => {
    if (!review) return;
    const { from, originalText, action } = review;

    transitioningRef.current = true;
    clearReviewHighlights(editor);
    editor
      .chain()
      .insertContentAt(
        { from, to: from + originalText.length },
        originalText
      )
      .setTextSelection({ from, to: from + originalText.length })
      .run();

    setReview({
      phase: "processing",
      from,
      to: from + originalText.length,
      originalText,
      action,
    });

    try {
      const result = await onProcess(originalText, action.prompt);
      applyResult(from, originalText, result, action);
    } catch {
      transitioningRef.current = false;
      setReview(null);
    }
  }, [editor, review, onProcess, applyResult]);

  const handleAction = useCallback(
    async (action: SelectionAction) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, "\n");
      if (!selectedText.trim()) return;

      setReview({
        phase: "processing",
        from,
        to,
        originalText: selectedText,
        action,
      });

      try {
        const result = await onProcess(selectedText, action.prompt);
        applyResult(from, selectedText, result, action);
      } catch {
        setReview(null);
      }
    },
    [editor, onProcess, applyResult]
  );

  return (
    <BubbleMenu
      ref={menuRef}
      editor={editor}
      shouldShow={({ view, from, to }) => {
        const selectedText = view.state.doc.textBetween(from, to, "\n");
        const activeElement = document.activeElement;

        return shouldShowReviewMenu({
          hasEditorFocus: view.hasFocus(),
          isChildOfMenu:
            activeElement instanceof Node
              ? Boolean(menuRef.current?.contains(activeElement))
              : false,
          isEditable: editor.isEditable,
          selectionFrom: from,
          selectionTo: to,
          selectedText,
          review,
        });
      }}
      options={{ placement: "top" }}
      className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-background px-1 py-1 shadow-lg"
    >
      {!review ? (
        actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onMouseDown={preventButtonMouseDown}
            onClick={() => void handleAction(action)}
            title={isAuthenticated ? action.label : needLoginLabel}
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition",
              isAuthenticated
                ? "text-muted-foreground hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                : "cursor-not-allowed text-muted-foreground/50 hover:bg-muted"
            )}
          >
            {action.label}
            {!isAuthenticated && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3"
                aria-hidden
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        ))
      ) : review.phase === "processing" ? (
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span className="text-xs text-muted-foreground">{labels?.processing || "Processing..."}</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            onMouseDown={preventButtonMouseDown}
            onClick={doAccept}
            className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            {labels?.accept || "Accept"}
          </button>
          <button
            type="button"
            onMouseDown={preventButtonMouseDown}
            onClick={() => void doRetry()}
            className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
          >
            {labels?.retry || "Retry"}
          </button>
          <button
            type="button"
            onMouseDown={preventButtonMouseDown}
            onClick={doReject}
            className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {labels?.reject || "Reject"}
            <kbd className="ml-1 rounded bg-red-100 px-1 text-[10px] font-normal text-red-600 dark:bg-red-900/30 dark:text-red-300">
              Esc
            </kbd>
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
