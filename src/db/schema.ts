import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "sg_users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Orders table
export const orders = pgTable("sg_orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

// API Keys table
export const apikeys = pgTable("sg_apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

// Credits table
export const credits = pgTable("sg_credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// Categories table
export const categories = pgTable("sg_categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }),
  sort: integer().notNull().default(0),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
});

// Posts table
export const posts = pgTable("sg_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
  category_uuid: varchar({ length: 255 }),
});

// Affiliates table
export const affiliates = pgTable("sg_affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = pgTable("sg_feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

export const sg_stories = pgTable(
  "sg_stories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 200 }),
    prompt: text(),
    content: text().notNull(),
    word_count: integer().notNull().default(0),
    model_used: varchar({ length: 50 }),
    settings: jsonb().$type<Record<string, unknown>>(),
    status: varchar({ length: 20 }).notNull().default("draft"),
    visibility: varchar({ length: 20 }).notNull().default("private"),
    source_category: varchar({ length: 50 }),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_stories_uuid_unique_idx").on(table.uuid),
    index("sg_stories_user_created_idx").on(table.user_uuid, table.created_at),
  ]
);

export const sg_user_stats = pgTable("sg_user_stats", {
  user_uuid: varchar({ length: 255 }).primaryKey(),
  total_stories: integer().notNull().default(0),
  total_words: integer().notNull().default(0),
  creation_days: integer().notNull().default(0),
  longest_streak: integer().notNull().default(0),
  current_streak: integer().notNull().default(0),
  last_creation_date: date(),
  updated_at: timestamp({ withTimezone: true }),
});

export const sg_story_likes = pgTable(
  "sg_story_likes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    story_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_story_likes_story_user_unique_idx").on(
      table.story_uuid,
      table.user_uuid
    ),
    index("sg_story_likes_story_idx").on(table.story_uuid),
    index("sg_story_likes_user_idx").on(table.user_uuid),
  ]
);

export const sg_story_comments = pgTable(
  "sg_story_comments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    story_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    parent_id: integer(),
    root_id: integer(),
    is_deleted: boolean().notNull().default(false),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
    deleted_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("sg_story_comments_story_root_created_idx").on(
      table.story_uuid,
      table.root_id,
      table.created_at
    ),
    index("sg_story_comments_user_idx").on(table.user_uuid),
    index("sg_story_comments_parent_idx").on(table.parent_id),
  ]
);

export const sg_tags = pgTable("sg_tags", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar({ length: 64 }).notNull().unique(),
  name: varchar({ length: 64 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
});

export const sg_story_tag_relations = pgTable(
  "sg_story_tag_relations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    story_uuid: varchar({ length: 255 }).notNull(),
    tag_id: integer().notNull(),
    created_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_story_tag_relations_story_tag_unique_idx").on(
      table.story_uuid,
      table.tag_id
    ),
    index("sg_story_tag_relations_story_idx").on(table.story_uuid),
    index("sg_story_tag_relations_tag_idx").on(table.tag_id),
  ]
);

// Story Bible: persistent character and world profiles per story
export const sg_story_bibles = pgTable(
  "sg_story_bibles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    story_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    characters: jsonb().$type<
      Array<{
        name: string;
        role: string;
        personality: string;
        backstory: string;
        relationships: string;
      }>
    >(),
    world_lore: text(),
    style_note: text(),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_story_bibles_uuid_unique_idx").on(table.uuid),
    index("sg_story_bibles_story_idx").on(table.story_uuid),
    index("sg_story_bibles_user_idx").on(table.user_uuid),
  ]
);

// Style Fingerprint: user writing style profiles (multiple per user, one active)
export const sg_style_fingerprints = pgTable(
  "sg_style_fingerprints",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull().default("Default"),
    sample_text: text().notNull(),
    style_summary: text(),
    is_active: boolean().notNull().default(false),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimeZone: true }),
  },
  (table) => [
    uniqueIndex("sg_style_fingerprints_uuid_unique_idx").on(table.uuid),
    index("sg_style_fingerprints_user_idx").on(table.user_uuid),
  ]
);

// Chat Conversation: one per "new chat" action, linked to a story
export const sg_chat_conversations = pgTable(
  "sg_chat_conversations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    story_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 500 }),
    message_count: integer().notNull().default(0),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_chat_conversations_uuid_unique_idx").on(table.uuid),
    index("sg_chat_conversations_story_user_idx").on(table.story_uuid, table.user_uuid, table.created_at),
  ]
);

// Chat Message: individual user/assistant messages within a conversation
export const sg_chat_messages = pgTable(
  "sg_chat_messages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    conversation_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    story_uuid: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 20 }).notNull(),
    content: text().notNull(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    created_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_chat_messages_uuid_unique_idx").on(table.uuid),
    index("sg_chat_messages_conversation_idx").on(table.conversation_uuid, table.created_at),
    index("sg_chat_messages_story_idx").on(table.story_uuid, table.user_uuid, table.created_at),
  ]
);

// Chat Summary: one per story (spans all conversations), for long-term context
export const sg_chat_summaries = pgTable(
  "sg_chat_summaries",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    story_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    summary: text().notNull(),
    summarized_message_count: integer().notNull().default(0),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sg_chat_summaries_uuid_unique_idx").on(table.uuid),
    uniqueIndex("sg_chat_summaries_story_user_unique_idx").on(table.story_uuid, table.user_uuid),
  ]
);
