import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getUuid } from "@/lib/hash";
import {
  getFingerprintsForUser,
  getActiveFingerprint,
  createFingerprint,
  updateFingerprint,
  activateFingerprint,
  deactivateAllFingerprints,
  deleteFingerprint,
} from "@/models/style-fingerprint";

// GET — list all fingerprints for user
export async function GET() {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const fingerprints = await getFingerprintsForUser(user_uuid);
    const active = await getActiveFingerprint(user_uuid);

    return respData({ fingerprints, activeUuid: active?.uuid || null });
  } catch (e: any) {
    return respErr(e.message || "failed to fetch fingerprints");
  }
}

// POST — create a new fingerprint
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await req.json();
    const { name, sample_text } = body as {
      name?: string;
      sample_text?: string;
    };

    const fp = await createFingerprint(user_uuid, {
      name: name || "Default",
      sample_text: sample_text?.trim() || "(draft)",
    });

    return respData(fp);
  } catch (e: any) {
    return respErr(e.message || "failed to create fingerprint");
  }
}

// PATCH — update or activate a fingerprint
export async function PATCH(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await req.json();
    const { uuid, action, name, sample_text } = body as {
      uuid?: string;
      action?: "activate" | "deactivate" | "update";
      name?: string;
      sample_text?: string;
    };

    if (action === "deactivate") {
      await deactivateAllFingerprints(user_uuid);
      return respData({ ok: true });
    }

    if (!uuid) {
      return respErr("uuid is required");
    }

    if (action === "activate") {
      const fp = await activateFingerprint(uuid, user_uuid);
      if (!fp) return respErr("not found");
      return respData(fp);
    }

    // Default: update
    const fp = await updateFingerprint(uuid, user_uuid, { name, sample_text });
    if (!fp) return respErr("not found");
    return respData(fp);
  } catch (e: any) {
    return respErr(e.message || "failed to update fingerprint");
  }
}

// DELETE — delete a fingerprint
export async function DELETE(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const url = new URL(req.url);
    const uuid = url.searchParams.get("uuid");
    if (!uuid) {
      return respErr("uuid is required");
    }

    const fp = await deleteFingerprint(uuid, user_uuid);
    if (!fp) return respErr("not found");
    return respData({ ok: true });
  } catch (e: any) {
    return respErr(e.message || "failed to delete fingerprint");
  }
}
