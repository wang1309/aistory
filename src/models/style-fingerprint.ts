import { db } from "@/db";
import { sg_style_fingerprints } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getFingerprintsForUser(userUuid: string) {
  return db()
    .select()
    .from(sg_style_fingerprints)
    .where(eq(sg_style_fingerprints.user_uuid, userUuid))
    .orderBy(sg_style_fingerprints.created_at);
}

export async function getActiveFingerprint(userUuid: string) {
  const [fp] = await db()
    .select()
    .from(sg_style_fingerprints)
    .where(
      and(
        eq(sg_style_fingerprints.user_uuid, userUuid),
        eq(sg_style_fingerprints.is_active, true)
      )
    );
  return fp;
}

export async function getFingerprintByUuid(uuid: string, userUuid: string) {
  const [fp] = await db()
    .select()
    .from(sg_style_fingerprints)
    .where(
      and(eq(sg_style_fingerprints.uuid, uuid), eq(sg_style_fingerprints.user_uuid, userUuid))
    );
  return fp;
}

export async function createFingerprint(
  userUuid: string,
  data: {
    name?: string;
    sample_text: string;
    style_summary?: string;
  }
) {
  const uuid = crypto.randomUUID();
  const [fp] = await db()
    .insert(sg_style_fingerprints)
    .values({
      uuid,
      user_uuid: userUuid,
      name: data.name || "Default",
      sample_text: data.sample_text,
      style_summary: data.style_summary || null,
      is_active: false,
    })
    .returning();
  return fp;
}

export async function updateFingerprint(
  uuid: string,
  userUuid: string,
  data: {
    name?: string;
    sample_text?: string;
    style_summary?: string;
  }
) {
  const [fp] = await db()
    .update(sg_style_fingerprints)
    .set({ ...data, updated_at: new Date() })
    .where(and(eq(sg_style_fingerprints.uuid, uuid), eq(sg_style_fingerprints.user_uuid, userUuid)))
    .returning();
  return fp;
}

export async function activateFingerprint(uuid: string, userUuid: string) {
  // Deactivate all for this user
  await db()
    .update(sg_style_fingerprints)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(sg_style_fingerprints.user_uuid, userUuid));

  // Activate the target
  const [fp] = await db()
    .update(sg_style_fingerprints)
    .set({ is_active: true, updated_at: new Date() })
    .where(and(eq(sg_style_fingerprints.uuid, uuid), eq(sg_style_fingerprints.user_uuid, userUuid)))
    .returning();
  return fp;
}

export async function deactivateAllFingerprints(userUuid: string) {
  await db()
    .update(sg_style_fingerprints)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(sg_style_fingerprints.user_uuid, userUuid));
}

export async function deleteFingerprint(uuid: string, userUuid: string) {
  const [fp] = await db()
    .delete(sg_style_fingerprints)
    .where(and(eq(sg_style_fingerprints.uuid, uuid), eq(sg_style_fingerprints.user_uuid, userUuid)))
    .returning();

  // If deleted the active one, activate the first remaining
  if (fp?.is_active) {
    const remaining = await db()
      .select()
      .from(sg_style_fingerprints)
      .where(eq(sg_style_fingerprints.user_uuid, userUuid))
      .limit(1);
    if (remaining[0]) {
      await db()
        .update(sg_style_fingerprints)
        .set({ is_active: true, updated_at: new Date() })
        .where(eq(sg_style_fingerprints.uuid, remaining[0].uuid));
      remaining[0].is_active = true;
    }
  }

  return fp;
}
