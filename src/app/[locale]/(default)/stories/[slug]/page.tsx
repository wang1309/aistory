import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoryBySlug, getAllStorySlugs } from "@/lib/get-story";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

// Generate static params for all stories
export async function generateStaticParams() {
  const slugs = getAllStorySlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const story = getStoryBySlug(slug, locale);

  if (!story) {
    return {
      title: "Story Not Found",
    };
  }

  return {
    title: `${story.title} | AI Story Generator`,
    description: story.summary,
    openGraph: {
      title: story.title,
      description: story.summary,
      images: [story.image],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary,
      images: [story.image],
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug, locale } = await params;
  const story = getStoryBySlug(slug, locale);

  if (!story) {
    notFound();
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href={`/${locale}`}>
          <Button variant="ghost" className="mb-6">
            <Icon name="RiArrowLeftLine" className="size-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Story header */}
        <div className="mb-8">
          {/* Featured image */}
          <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden mb-6">
            <Image
              src={story.image}
              alt={story.imageAlt}
              fill
              className="object-cover"
              priority
            />
            {/* Genre badge */}
            <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-sm font-semibold">
              {story.genre}
            </div>
          </div>

          {/* Title and metadata */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1.5">
              <Icon name="RiFileTextLine" className="size-4" />
              <span>{story.wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="RiRobot2Line" className="size-4" />
              <span>{story.model}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="RiCalendarLine" className="size-4" />
              <span>{new Date(story.generatedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {story.summary}
          </p>
        </div>

        {/* Story content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="rounded-2xl border-2 border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm p-8 md:p-12">
            <div className="text-base md:text-lg leading-[1.8] whitespace-pre-wrap text-foreground/90">
              {story.content}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-3">Create Your Own Story</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Generate unique, creative stories with AI in seconds. Try different genres, lengths, and styles!
          </p>
          <Link href={`/${locale}/#craft_story`}>
            <Button size="lg" className="rounded-full">
              <Icon name="RiMagicLine" className="size-5 mr-2" />
              Start Creating
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
