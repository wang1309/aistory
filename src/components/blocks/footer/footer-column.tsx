"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface FooterColumnLink {
  title: string;
  url?: string;
  target?: string;
}

export interface FooterColumnGroup {
  /** 稳定 id,用于 aria-controls 关联。 */
  id: string;
  title: string;
  items: FooterColumnLink[];
}

interface FooterColumnProps {
  /** 稳定 id,用于 aria-controls 关联标题按钮与折叠面板。 */
  columnId: string;
  title: string;
  /** 扁平链接列表(多数列)。 */
  items?: FooterColumnLink[];
  /** 嵌套子分类(如 AI Write 的 Story Generator)。传入时替代 items 渲染子手风琴。 */
  groups?: FooterColumnGroup[];
  /**
   * 顶级标题是否可折叠(默认 true)。
   * false 时标题为静态文本、面板常开,折叠职责下沉到 groups 子分类。
   */
  collapsible?: boolean;
}

/**
 * Footer 分类手风琴列(全端可折叠,默认收起)。
 * 折叠用 CSS grid-template-rows 0fr->1fr 过渡,不依赖 framer-motion;
 * 链接始终渲染在 DOM 中,收起只是视觉折叠,SEO 抓取不受影响。
 */
export default function FooterColumn({
  columnId,
  title,
  items,
  groups,
  collapsible = true,
}: FooterColumnProps) {
  const [open, setOpen] = useState(false);
  const panelId = `footer-panel-${columnId}`;

  const panel = groups ? (
    <div className="space-y-1 pb-2">
      {groups.map((group) => (
        <FooterSubGroup key={group.id} group={group} />
      ))}
    </div>
  ) : (
    <LinkList items={items ?? []} className="pt-4" />
  );

  return (
    <div className="min-w-0 py-1">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            {title}
          </span>
          <Chevron open={open} className="size-3.5" />
        </button>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
          {title}
        </p>
      )}

      {collapsible ? (
        <div
          id={panelId}
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">{panel}</div>
        </div>
      ) : (
        <div className="pt-1">{panel}</div>
      )}
    </div>
  );
}

/**
 * 嵌套子分类手风琴,默认收起。
 * 静态标题列(如 AI Write)的折叠职责在这一层。
 */
function FooterSubGroup({ group }: { group: FooterColumnGroup }) {
  const [open, setOpen] = useState(false);
  const panelId = `footer-subgroup-${group.id}`;

  return (
    <div className="border-l border-border/40 pl-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-1.5 py-2 text-left"
      >
        <Chevron open={open} className="size-3" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
          {group.title}
        </span>
      </button>

      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <LinkList items={group.items} className="pb-3" />
        </div>
      </div>
    </div>
  );
}

function LinkList({
  items,
  className,
}: {
  items: FooterColumnLink[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3 text-sm text-muted-foreground", className)}>
      {items.map((item, i) => (
        <li key={i} className="transition-colors hover:text-foreground">
          <Link
            href={item.url || ""}
            target={item.target}
            className="[overflow-wrap:anywhere]"
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-muted-foreground/60 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open && "rotate-180",
        className
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  );
}
