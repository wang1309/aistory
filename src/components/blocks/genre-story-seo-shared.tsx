import { Link } from "@/i18n/navigation";
import type { GenreStoryLink } from "@/types/blocks/genre-story-generate";

export function assertGenreSeoHref(
  href: string | null | undefined,
  allowed: readonly string[]
): void {
  if (
    process.env.NODE_ENV !== "production" &&
    href &&
    !allowed.includes(href)
  ) {
    throw new Error(
      `Genre SEO content points to an unapproved href: ${href}. Allowed: ${allowed.join(", ")}`
    );
  }
}

export function GenreSeoLink({
  link,
  allowed,
  className,
}: {
  link: GenreStoryLink;
  allowed: readonly string[];
  className?: string;
}) {
  assertGenreSeoHref(link.href, allowed);

  if (!link.href) {
    return <span className={className}>{link.label}</span>;
  }

  return (
    <Link href={link.href as never} className={className}>
      {link.label}
    </Link>
  );
}
