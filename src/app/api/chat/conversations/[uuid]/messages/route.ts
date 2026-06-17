import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getConversationByUuid, insertMessages, type ChatMessageInput } from "@/models/chat";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { uuid } = await params;
    const conversation = await getConversationByUuid(uuid, user_uuid);
    if (!conversation) return respErr("conversation not found");

    const { messages } = (await req.json()) as { messages?: ChatMessageInput[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return respErr("messages array is required");
    }

    const inserted = await insertMessages(
      uuid,
      user_uuid,
      conversation.story_uuid,
      messages
    );
    return respData({ count: inserted.length });
  } catch (e: any) {
    return respErr(e.message || "failed to insert messages");
  }
}
