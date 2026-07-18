import { getUserUuid } from "@/services/user";
import {
  appendCreativeVisitorCookie,
  CREATIVE_PAGE_KEYS,
  getCreativeVisitorContext,
  mergePageCreativeQuota,
  migrateLegacyStoryCreativeQuota,
  readCreativeQuota,
} from "@/lib/free-quota";
import {
  buildCreativeQuotaClientStatus,
  type CreativePageKey,
} from "@/lib/creative-quota-core";
import { CreditsAmount, getUserCredits } from "@/services/credit";

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
  const creditCost =
    Number(process.env.SG_CREATIVE_COST) ||
    CreditsAmount.StoryGenerateCreativeCost;
  const credits = userUuid ? await getUserCredits(userUuid) : null;

  return appendCreativeVisitorCookie(
    Response.json(
      buildCreativeQuotaClientStatus({
        quota: status,
        creditCost,
        leftCredits: credits?.left_credits ?? null,
      })
    ),
    visitor.setCookie
  );
}
