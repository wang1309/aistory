"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import { Post } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { extractHeadings, TableOfContents } from "./toc";

type SidebarCategory = {
  uuid?: string;
  name?: string;
  title?: string;
};

function formatPostDate(iso: string, locale?: string) {
  try {
    return new Intl.DateTimeFormat(locale || "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogDetail({
  post,
  category,
}: {
  post: Post;
  category?: SidebarCategory;
}) {
  const t = useTranslations();
  const bodyRef = useRef<HTMLDivElement>(null);
  const headings = useMemo(
    () => extractHeadings(post.content ?? "", [2, 3]),
    [post.content]
  );
  const hasToc = headings.length > 0;
  const [activeSlug, setActiveSlug] = useState<string | undefined>(
    headings[0]?.slug
  );

  useEffect(() => {
    if (!bodyRef.current || headings.length === 0) return;
    const els = Array.from(
      bodyRef.current.querySelectorAll("h2, h3")
    ) as HTMLElement[];
    els.forEach((el, idx) => {
      const h = headings[idx];
      if (h) {
        el.id = h.slug;
        el.style.scrollMarginTop = "5rem";
      }
    });
    const targets = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSlug(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleNavigate = (slug: string) => {
    const el = document.getElementById(slug);
    if (!el) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    setActiveSlug(slug);
    history.replaceState(null, "", `#${slug}`);
  };

  const categoryHref = category?.name
    ? `/posts?category=${encodeURIComponent(category.name)}`
    : "";

  return (
    <section className="py-10 md:py-16">
      <div className="container">
        <Crumb post={post} />

        <header className="mt-8 max-w-3xl md:mt-10">
          {category && categoryHref && (
            <Link
              href={categoryHref}
              className="inline-flex items-center rounded-full border border-border bg-accent px-3 py-1 font-sans text-xs font-medium uppercase tracking-wider text-foreground transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {category.title || category.name}
            </Link>
          )}
          <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {(post.author_name || post.created_at) && (
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-sm text-muted-foreground">
              {post.author_name && (
                <span className="inline-flex items-center gap-2">
                  {post.author_avatar_url && (
                    <Avatar className="h-6 w-6 border">
                      <AvatarImage
                        src={post.author_avatar_url}
                        alt={post.author_name}
                      />
                    </Avatar>
                  )}
                  <span className="font-medium text-foreground">
                    {post.author_name}
                  </span>
                </span>
              )}
              {post.author_name && post.created_at && (
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
              )}
              {post.created_at && (
                <time dateTime={post.created_at}>
                  {formatPostDate(post.created_at, post.locale)}
                </time>
              )}
            </div>
          )}
        </header>

        <div
          className={
            hasToc
              ? "mt-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"
              : "mt-10"
          }
        >
          {hasToc && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                <TableOfContents
                  headings={headings}
                  activeSlug={activeSlug}
                  onNavigate={handleNavigate}
                />
              </div>
            </aside>
          )}
          <article className="min-w-0">
            <div ref={bodyRef} className="max-w-[70ch]">
              {post.content ? (
                <Markdown content={post.content} />
              ) : (
                <p className="font-sans text-sm text-muted-foreground">
                  {t("blog.no_content")}
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
