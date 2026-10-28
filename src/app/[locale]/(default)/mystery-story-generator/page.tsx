import {
  createGenreStoryGeneratorMetadata,
  createGenreStoryGeneratorPage,
} from "@/components/pages/genre-story-generator-page";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export const generateMetadata =
  createGenreStoryGeneratorMetadata("mystery-story-generator");
export default createGenreStoryGeneratorPage("mystery-story-generator");
