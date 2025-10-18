export interface Story {
  slug: string;
  title: string;
  genre: string;
  wordCount: number;
  model: string;
  summary: string;
  content: string;
  image: string;
  imageAlt: string;
  generatedAt: string;
  author?: string;
}

export interface StoriesData {
  [slug: string]: Story;
}
