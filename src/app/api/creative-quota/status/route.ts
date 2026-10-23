import { getUserUuid } from "@/services/user";
import {
  appendCreativeVisitorCookie,
  CREATIVE_PAGE_KEYS,
  getCreativeVisitorContext,
  mergePageCreativeQuota,
  migrateLegacyStoryCreativeQuota,
  QUOTA_TIERS,
  readCreativeQuota,
} from "@/lib/free-quota";
import {
  buildCreativeQuotaClientStatus,
  type CreativePageKey,
  type CreativeQuotaStatus,
  type QuotaTier,
} from "@/lib/creative-quota-core";
import { getQuotaCreditCost } from "@/lib/creative-quota";
import { getUserCredits } from "@/services/credit";

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
  const identity = userIdentity || visitor.visitorIdentity;
  const statuses = {} as Record<QuotaTier, CreativeQuotaStatus>;

  for (const tier of QUOTA_TIERS) {
    if (userIdentity) {
      if (tier === "creative") {
        await migrateLegacyStoryCreativeQuota(userIdentity);
      }
      await mergePageCreativeQuota(
        pageKey,
        visitor.visitorIdentity,
        userIdentity,
        tier
      );
    }
    statuses[tier] = await readCreativeQuota(pageKey, identity, tier);
  }

  const credits = userUuid ? await getUserCredits(userUuid) : null;
  const leftCredits = credits?.left_credits ?? null;
  const creativePayload = buildCreativeQuotaClientStatus({
    quota: statuses.creative,
    creditCost: getQuotaCreditCost("creative"),
    leftCredits,
  });
  const standardPayload = buildCreativeQuotaClientStatus({
    quota: statuses.standard,
    creditCost: getQuotaCreditCost("standard"),
    leftCredits: null,
  });

  return appendCreativeVisitorCookie(
    Response.json({
      ...creativePayload,
      tiers: {
        standard: standardPayload,
        creative: creativePayload,
      },
    }),
    visitor.setCookie
  );
}
