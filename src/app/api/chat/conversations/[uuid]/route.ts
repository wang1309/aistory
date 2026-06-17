import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  getConversationByUuid,
  getMessagesByConversation,
  deleteConversation,
  updateConversationTitle,
} from "@/models/chat";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { uuid } = await params;
    const conversation = await getConversationByUuid(uuid, user_uuid);
    if (!conversation) return respErr("conversation not found");

    const messages = await getMessagesByConversation(uuid, user_uuid);
    return respData({ conversation, messages });
  } catch (e: any) {
    return respErr(e.message || "failed to fetch conversation");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { uuid } = await params;
    const ok = await deleteConversation(uuid, user_uuid);
    if (!ok) return respErr("conversation not found");
    return respData({ ok: true });
  } catch (e: any) {
    return respErr(e.message || "failed to delete conversation");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth");

    const { uuid } = await params;
    const { title } = (await req.json()) as { title?: string };
    if (!title?.trim()) return respErr("title is required");

    const conv = await updateConversationTitle(uuid, user_uuid, title.trim());
    if (!conv) return respErr("conversation not found");
    return respData(conv);
  } catch (e: any) {
    return respErr(e.message || "failed to update conversation");
  }
}
