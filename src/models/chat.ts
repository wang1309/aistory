import { db } from "@/db";
import { sg_chat_conversations, sg_chat_messages, sg_chat_summaries } from "@/db/schema";
import { and, desc, asc, eq, sql } from "drizzle-orm";
import { getUuid } from "@/lib/hash";

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
};

export type ChatMessageRow = {
  uuid: string;
  conversation_uuid: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | null;
};

// ---------- Conversations ----------

export async function createConversation(args: {
  story_uuid: string;
  user_uuid: string;
  title?: string;
}) {
  const now = new Date();
  const [conv] = await db()
    .insert(sg_chat_conversations)
    .values({
      uuid: getUuid(),
      story_uuid: args.story_uuid,
      user_uuid: args.user_uuid,
      title: args.title ?? null,
      message_count: 0,
      created_at: now,
      updated_at: now,
    })
    .returning();
  return conv;
}

export async function getConversationsByStory(story_uuid: string, user_uuid: string) {
  return db()
    .select({
      uuid: sg_chat_conversations.uuid,
      story_uuid: sg_chat_conversations.story_uuid,
      title: sg_chat_conversations.title,
      message_count: sg_chat_conversations.message_count,
      created_at: sg_chat_conversations.created_at,
      updated_at: sg_chat_conversations.updated_at,
    })
    .from(sg_chat_conversations)
    .where(
      and(
        eq(sg_chat_conversations.story_uuid, story_uuid),
        eq(sg_chat_conversations.user_uuid, user_uuid)
      )
    )
    .orderBy(desc(sg_chat_conversations.created_at));
}

export async function getLatestConversationByStory(story_uuid: string, user_uuid: string) {
  const [conv] = await db()
    .select()
    .from(sg_chat_conversations)
    .where(
      and(
        eq(sg_chat_conversations.story_uuid, story_uuid),
        eq(sg_chat_conversations.user_uuid, user_uuid)
      )
    )
    .orderBy(desc(sg_chat_conversations.created_at))
    .limit(1);
  return conv;
}

export async function getConversationByUuid(uuid: string, user_uuid: string) {
  const [conv] = await db()
    .select()
    .from(sg_chat_conversations)
    .where(
      and(
        eq(sg_chat_conversations.uuid, uuid),
        eq(sg_chat_conversations.user_uuid, user_uuid)
      )
    )
    .limit(1);
  return conv;
}

export async function deleteConversation(uuid: string, user_uuid: string) {
  const conv = await getConversationByUuid(uuid, user_uuid);
  if (!conv) return false;

  await db()
    .delete(sg_chat_messages)
    .where(eq(sg_chat_messages.conversation_uuid, uuid));

  await db()
    .delete(sg_chat_conversations)
    .where(eq(sg_chat_conversations.uuid, uuid));

  return true;
}

export async function updateConversationTitle(uuid: string, user_uuid: string, title: string) {
  const [conv] = await db()
    .update(sg_chat_conversations)
    .set({ title, updated_at: new Date() })
    .where(
      and(
        eq(sg_chat_conversations.uuid, uuid),
        eq(sg_chat_conversations.user_uuid, user_uuid)
      )
    )
    .returning();
  return conv;
}

// ---------- Messages ----------

export async function insertMessages(
  conversation_uuid: string,
  user_uuid: string,
  story_uuid: string,
  messages: ChatMessageInput[]
) {
  if (messages.length === 0) return [];

  const now = new Date();
  const rows = messages.map((m) => ({
    uuid: getUuid(),
    conversation_uuid,
    user_uuid,
    story_uuid,
    role: m.role,
    content: m.content,
    metadata: m.metadata ?? null,
    created_at: now,
  }));

  const inserted = await db().insert(sg_chat_messages).values(rows).returning();

  await db()
    .update(sg_chat_conversations)
    .set({
      message_count: sql`${sg_chat_conversations.message_count} + ${messages.length}`,
      updated_at: now,
    })
    .where(eq(sg_chat_conversations.uuid, conversation_uuid));

  return inserted;
}

export async function getMessagesByConversation(conversation_uuid: string, user_uuid: string) {
  return db()
    .select({
      uuid: sg_chat_messages.uuid,
      conversation_uuid: sg_chat_messages.conversation_uuid,
      role: sg_chat_messages.role,
      content: sg_chat_messages.content,
      metadata: sg_chat_messages.metadata,
      created_at: sg_chat_messages.created_at,
    })
    .from(sg_chat_messages)
    .where(
      and(
        eq(sg_chat_messages.conversation_uuid, conversation_uuid),
        eq(sg_chat_messages.user_uuid, user_uuid)
      )
    )
    .orderBy(asc(sg_chat_messages.created_at), asc(sg_chat_messages.id));
}

export async function getMessageCountByStory(story_uuid: string, user_uuid: string) {
  const [row] = await db()
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(sg_chat_messages)
    .where(
      and(
        eq(sg_chat_messages.story_uuid, story_uuid),
        eq(sg_chat_messages.user_uuid, user_uuid)
      )
    );
  return row?.count ?? 0;
}

// ---------- Summary ----------

export async function getSummaryByStory(story_uuid: string, user_uuid: string) {
  const [row] = await db()
    .select()
    .from(sg_chat_summaries)
    .where(
      and(
        eq(sg_chat_summaries.story_uuid, story_uuid),
        eq(sg_chat_summaries.user_uuid, user_uuid)
      )
    )
    .limit(1);
  return row;
}

export async function upsertSummary(args: {
  story_uuid: string;
  user_uuid: string;
  summary: string;
  summarized_message_count: number;
}) {
  const existing = await getSummaryByStory(args.story_uuid, args.user_uuid);
  const now = new Date();

  if (existing) {
    const [row] = await db()
      .update(sg_chat_summaries)
      .set({
        summary: args.summary,
        summarized_message_count: args.summarized_message_count,
        updated_at: now,
      })
      .where(eq(sg_chat_summaries.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db()
    .insert(sg_chat_summaries)
    .values({
      uuid: getUuid(),
      story_uuid: args.story_uuid,
      user_uuid: args.user_uuid,
      summary: args.summary,
      summarized_message_count: args.summarized_message_count,
      created_at: now,
      updated_at: now,
    })
    .returning();
  return row;
}
