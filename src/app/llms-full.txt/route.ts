import {
  LLM_MARKDOWN_CONTENT_TYPE,
  llmsFullPostLines,
  llmsIntroLines,
  llmsOptionalLines,
  llmsPageLines,
  toLlmsPosts,
} from "@/lib/llms-txt";
import { getAllPosts } from "@/models/post";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const posts = toLlmsPosts(await getAllPosts(1, 1000).catch(() => undefined), {
    withContent: true,
  });

  const lines = [
    ...llmsIntroLines(),
    ...llmsPageLines(),
    ...llmsFullPostLines(posts),
    ...llmsOptionalLines(),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": LLM_MARKDOWN_CONTENT_TYPE },
  });
}
