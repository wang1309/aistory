import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Blog as BlogType, BlogItem } from "@/types/blocks/blog";
import { Link } from "@/i18n/navigation";
import { Category } from "@/types/category";
import { useTranslations } from "next-intl";

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

export default function Blog({
  blog,
  categories,
  category,
}: {
  blog: BlogType;
  categories: Pick<Category, "uuid" | "name" | "title">[];
  category?: string;
}) {
  const t = useTranslations();

  if (blog.disabled) {
    return null;
  }

  const items = blog.items ?? [];
  const [lead, ...rest] = items;

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container">
        {/* Editorial masthead */}
        <header className="mb-10 max-w-2xl md:mb-14">
          <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {blog.label || t("blog.title")}
          </p>
          <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {blog.title}
          </h1>
          {blog.description && (
            <p className="font-sans text-base leading-[1.7] text-muted-foreground md:text-lg">
              {blog.description}
            </p>
          )}
        </header>

        {/* Category filter */}
        {categories && categories.length > 0 && (
          <nav
            aria-label={t("blog.category")}
            className="mb-10 flex flex-wrap items-center gap-2 border-b border-border pb-8 md:mb-14"
          >
            <FilterLink href="/posts" active={!category} label={t("blog.all")} />
            {categories.map((c) => (
              <FilterLink
                key={c.uuid}
                href={`/posts?category=${encodeURIComponent(c.name)}`}
                active={category === c.name}
                label={c.title || c.name}
              />
            ))}
          </nav>
        )}

        {/* Posts */}
        {items.length > 0 ? (
          <div className="flex flex-col gap-14 md:gap-20">
            {lead && (
              <LeadCard
                item={lead}
                readMore={blog.read_more_text}
                featuredLabel={t("blog.featured")}
              />
            )}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-x-10 gap-y-14 border-t border-border pt-14 md:grid-cols-2 xl:grid-cols-3">
                {rest.map((item, idx) => (
                  <PostCard
                    key={idx}
                    item={item}
                    readMore={blog.read_more_text}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-border pt-12">
            <p className="font-display text-xl text-muted-foreground">
              {t("blog.no_content")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center rounded-full px-4 py-2 font-sans text-sm font-medium transition-[background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function PostLink({
  item,
  className,
  children,
}: {
  item: BlogItem;
  className?: string;
  children: ReactNode;
}) {
  if (item.url) {
    return (
      <a
        href={item.url}
        target={item.target || "_blank"}
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={`/posts/${item.slug}`} className={className}>
      {children}
    </Link>
  );
}

function CoverMedia({
  item,
  className,
}: {
  item: BlogItem;
  className?: string;
}) {
  if (item.cover_url) {
    return (
      <div className={`overflow-hidden ${className ?? ""}`}>
        <img
          src={item.cover_url}
          alt={item.title || ""}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }
  const initial = (item.title || "").trim().charAt(0).toUpperCase() || "·";
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-accent ${className ?? ""}`}
    >
      <span className="select-none font-display text-5xl font-semibold text-primary/30 md:text-6xl">
        {initial}
      </span>
    </div>
  );
}

function MetaRow({
  item,
  className,
}: {
  item: BlogItem;
  className?: string;
}) {
  const date = item.created_at
    ? formatPostDate(item.created_at, item.locale)
    : null;

  if (!item.author_name && !date) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-muted-foreground ${className ?? ""}`}
    >
      {item.author_name && (
        <span className="inline-flex items-center gap-1.5">
          {item.author_avatar_url && (
            <img
              src={item.author_avatar_url}
              alt=""
              loading="lazy"
              className="size-5 rounded-full border border-border object-cover"
            />
          )}
          <span className="font-medium text-foreground/80">
            {item.author_name}
          </span>
        </span>
      )}
      {item.author_name && date && (
        <span aria-hidden="true" className="text-border">
          ·
        </span>
      )}
      {date && <time dateTime={item.created_at}>{date}</time>}
    </div>
  );
}

function LeadCard({
  item,
  readMore,
  featuredLabel,
}: {
  item: BlogItem;
  readMore?: string;
  featuredLabel?: string;
}) {
  return (
    <PostLink
      item={item}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <article className="grid items-center gap-8 md:grid-cols-12 lg:gap-12">
        <CoverMedia
          item={item}
          className="aspect-[16/9] rounded-2xl md:col-span-7 md:aspect-[16/10]"
        />
        <div className="md:col-span-5">
          {(featuredLabel || item.category_title) && (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 font-sans text-xs font-medium uppercase tracking-[0.2em]">
              {featuredLabel && <span className="text-primary">{featuredLabel}</span>}
              {featuredLabel && item.category_title && (
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
              )}
              {item.category_title && (
                <span className="text-muted-foreground">
                  {item.category_title}
                </span>
              )}
            </p>
          )}
          <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-4xl">
            {item.title}
          </h2>
          {item.description && (
            <p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground md:text-lg">
              {item.description}
            </p>
          )}
          <MetaRow item={item} className="mt-5" />
          {readMore && (
            <span className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-primary">
              {readMore}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </article>
    </PostLink>
  );
}

function PostCard({ item, readMore }: { item: BlogItem; readMore?: string }) {
  return (
    <PostLink
      item={item}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <article className="transition-[transform,color] duration-300 ease-out group-hover:-translate-y-0.5">
        <CoverMedia item={item} className="aspect-[16/9] rounded-xl" />
        <div className="mt-5">
          {item.category_title && (
            <p className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {item.category_title}
            </p>
          )}
          <h3 className="font-display text-xl font-semibold leading-[1.25] text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-2 line-clamp-3 font-sans text-sm leading-[1.7] text-muted-foreground md:text-base">
              {item.description}
            </p>
          )}
          {(item.author_name || item.created_at || readMore) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <MetaRow item={item} />
              {readMore && (
                <span className="inline-flex items-center gap-2 font-sans text-xs font-medium text-primary">
                  {readMore}
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </PostLink>
  );
}
