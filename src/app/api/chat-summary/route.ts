import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getSummaryByStory, upsertSummary } from "@/models/chat";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const story_uuid = new URL(req.url).searchParams.get("story");
    if (!story_uuid) return respErr("story is required");

    const summary = await getSummaryByStory(story_uuid, user_uuid);
    return respData(summary ?? null);
  } catch (e: any) {
    return respErr(e.message || "failed to fetch summary");
  }
}

export async function PUT(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { story_uuid, summary, summarized_message_count } = (await req.json()) as {
      story_uuid?: string;
      summary?: string;
      summarized_message_count?: number;
    };

    if (!story_uuid) return respErr("story_uuid is required");
    if (!summary?.trim()) return respErr("summary is required");

    const row = await upsertSummary({
      story_uuid,
      user_uuid,
      summary: summary.trim(),
      summarized_message_count: summarized_message_count ?? 0,
    });
    return respData(row);
  } catch (e: any) {
    return respErr(e.message || "failed to save summary");
  }
}
