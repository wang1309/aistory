import { getUserUuid } from "@/services/user";
import {
  appendCreativeVisitorCookie,
  CREATIVE_PAGE_KEYS,
  getCreativeVisitorContext,
  mergePageCreativeQuota,
  migrateLegacyStoryCreativeQuota,
  readCreativeQuota,
} from "@/lib/free-quota";
import type { CreativePageKey } from "@/lib/creative-quota-core";

function isCreativePageKey(value: string | null): value is CreativePageKey {
  return !!value && (CREATIVE_PAGE_KEYS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const pageKey = new URL(request.url).searchParams.get("page");
  if (!isCreativePageKey(pageKey)) {
    return Response.json({ code: "invalid_page" }, { status: 400 });
  }

  const visitor = getCreativeVisitorContext(request.headers.get("cookie"));
  const userUuid = await getUserUuid();
  const userIdentity = userUuid ? `user:${userUuid}` : null;
  if (userIdentity) {
    await migrateLegacyStoryCreativeQuota(userIdentity);
    await mergePageCreativeQuota(pageKey, visitor.visitorIdentity, userIdentity);
  }

  const status = await readCreativeQuota(pageKey, userIdentity || visitor.visitorIdentity);
  return appendCreativeVisitorCookie(Response.json(status), visitor.setCookie);
}
