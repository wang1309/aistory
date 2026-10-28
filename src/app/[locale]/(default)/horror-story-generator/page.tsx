import {
  createGenreStoryGeneratorMetadata,
  createGenreStoryGeneratorPage,
} from "@/components/pages/genre-story-generator-page";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export const generateMetadata =
  createGenreStoryGeneratorMetadata("horror-story-generator");
export default createGenreStoryGeneratorPage("horror-story-generator");
