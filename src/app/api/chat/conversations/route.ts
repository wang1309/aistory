import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { createConversation, getConversationsByStory } from "@/models/chat";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const story_uuid = new URL(req.url).searchParams.get("story");
    if (!story_uuid) return respErr("story is required");

    const conversations = await getConversationsByStory(story_uuid, user_uuid);
    return respData(conversations);
  } catch (e: any) {
    return respErr(e.message || "failed to fetch conversations");
  }
}

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { story_uuid, title } = (await req.json()) as {
      story_uuid?: string;
      title?: string;
    };
    if (!story_uuid) return respErr("story_uuid is required");

    const conv = await createConversation({ story_uuid, user_uuid, title });
    return respData(conv);
  } catch (e: any) {
    return respErr(e.message || "failed to create conversation");
  }
}
