import { Story, StoriesData } from "@/types/story";

/**
 * Get all example stories for a specific locale
 * @param locale - The locale (en, zh, ja, ko, de)
 * @returns All stories from the locale-specific stories file
 */
export function getAllStories(locale: string = 'en'): StoriesData {
  try {
    const stories = require(`@/i18n/pages/stories/${locale}.json`);
    return stories as StoriesData;
  } catch (error) {
    // Fallback to English if locale not found
    const stories = require("@/i18n/pages/stories/en.json");
    return stories as StoriesData;
  }
}

/**
 * Get a single story by slug for a specific locale
 * @param slug - The story slug
 * @param locale - The locale (en, zh, ja, ko, de)
 * @returns The story object or undefined if not found
 */
export function getStoryBySlug(slug: string, locale: string = 'en'): Story | undefined {
  const stories = getAllStories(locale);
  return stories[slug];
}

/**
 * Get all story slugs for static page generation
 * @returns Array of story slugs
 */
export function getAllStorySlugs(): string[] {
  const stories = getAllStories();
  return Object.keys(stories);
}

/**
 * Get stories by genre
 * @param genre - The genre to filter by
 * @returns Array of stories matching the genre
 */
export function getStoriesByGenre(genre: string): Story[] {
  const stories = getAllStories();
  return Object.values(stories).filter(story =>
    story.genre.toLowerCase().includes(genre.toLowerCase())
  );
}

/**
 * Get latest stories (sorted by generatedAt date)
 * @param limit - Maximum number of stories to return
 * @returns Array of latest stories
 */
export function getLatestStories(limit?: number): Story[] {
  const stories = getAllStories();
  const sortedStories = Object.values(stories).sort((a, b) => {
    return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
  });

  return limit ? sortedStories.slice(0, limit) : sortedStories;
}
