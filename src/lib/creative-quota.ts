import { getUserUuid } from "@/services/user";
import {
  CreditsAmount,
  CreditsTransType,
  decreaseCredits,
  getUserCredits,
} from "@/services/credit";
import {
  appendCreativeVisitorCookie,
  checkIpHardCap,
  getCreativeVisitorContext,
  incrementPageCreativeQuota,
  incrementIpHardCap,
  mergePageCreativeQuota,
  migrateLegacyStoryCreativeQuota,
  readCreativeQuota,
  type CreativePageKey,
  type CreativeQuotaStatus,
  type QuotaTier,
} from "@/lib/free-quota";
import { resolveQuotaTier } from "@/lib/creative-quota-core";

type GateKind =
  | "skip"
  | "free"
  | "credits"
  | "free_quota_exceeded"
  | "insufficient_credits"
  | "rate_limited";

export type CreativeQuotaGate = {
  kind: GateKind;
  pageKey: CreativePageKey;
  tier: QuotaTier | null;
  userUuid: string;
  quota: CreativeQuotaStatus | null;
  cost: number;
  setCookie?: string;
};

export function getQuotaCreditCost(tier: QuotaTier): number {
  if (tier === "standard") {
    return (
      Number(process.env.SG_STANDARD_COST) ||
      CreditsAmount.StoryGenerateStandardCost
    );
  }

  return (
    Number(process.env.SG_CREATIVE_COST) ||
    CreditsAmount.StoryGenerateCreativeCost
  );
}

export async function prepareCreativeQuota({
  pageKey,
  model,
  request,
}: {
  pageKey: CreativePageKey;
  model?: string;
  request: Request;
}): Promise<CreativeQuotaGate> {
  const visitor = getCreativeVisitorContext(request.headers.get("cookie"));
  const userUuid = await getUserUuid();
  const base = {
    pageKey,
    tier: null as QuotaTier | null,
    userUuid,
    quota: null,
    cost: 0,
    setCookie: visitor.setCookie,
  };

  const ipCap = await checkIpHardCap();
  if (ipCap.used >= ipCap.limit) {
    return { ...base, kind: "rate_limited" };
  }

  await incrementIpHardCap();

  const tier = resolveQuotaTier(model);
  if (!tier) {
    return { ...base, kind: "skip" };
  }

  const visitorIdentity = visitor.visitorIdentity;
  const accountIdentity = userUuid ? `user:${userUuid}` : null;
  if (accountIdentity) {
    if (tier === "creative") {
      await migrateLegacyStoryCreativeQuota(accountIdentity);
    }
    await mergePageCreativeQuota(
      pageKey,
      visitorIdentity,
      accountIdentity,
      tier
    );
  }

  const identity = accountIdentity || visitorIdentity;
  const quota = await readCreativeQuota(pageKey, identity, tier);
  if (quota.used < quota.limit) {
    await incrementPageCreativeQuota(pageKey, identity, tier);
    return {
      ...base,
      tier,
      kind: "free",
      quota,
      setCookie: visitor.setCookie,
    };
  }

  if (!userUuid) {
    return { ...base, tier, kind: "free_quota_exceeded", quota };
  }

  const cost = getQuotaCreditCost(tier);
  const credits = await getUserCredits(userUuid);
  if ((credits.left_credits || 0) < cost) {
    return { ...base, tier, kind: "insufficient_credits", quota, cost };
  }

  return { ...base, tier, kind: "credits", quota, cost };
}

export async function commitCreativeQuotaCharge(gate: CreativeQuotaGate): Promise<void> {
  if (gate.kind !== "credits" || !gate.userUuid || !gate.tier) return;

  try {
    await decreaseCredits({
      user_uuid: gate.userUuid,
      trans_type:
        gate.tier === "standard"
          ? CreditsTransType.StoryGenerateStandard
          : CreditsTransType.StoryGenerateCreative,
      credits: gate.cost,
    });
  } catch (error) {
    console.log("Quota credit charge failed", error instanceof Error ? error.name : "unknown");
  }
}

export function withCreativeVisitorCookie(response: Response, gate: CreativeQuotaGate): Response {
  return appendCreativeVisitorCookie(response, gate.setCookie);
}

export function creativeQuotaErrorResponse(gate: CreativeQuotaGate): Response | null {
  if (gate.kind === "skip" || gate.kind === "free" || gate.kind === "credits") return null;

  const tier = gate.tier || "creative";
  const response = Response.json(
    gate.kind === "rate_limited"
      ? {
          code: "rate_limited",
          tier: gate.tier,
          message: "too many requests today, please try again later",
          remaining: 0,
        }
      : gate.kind === "free_quota_exceeded"
        ? {
            code: "free_quota_exceeded",
            tier,
            message: `daily free ${tier} limit reached, login to continue`,
            remaining: 0,
            limit: gate.quota?.limit || 3,
            need: "login",
          }
        : {
            code: "insufficient_credits",
            tier,
            message: `insufficient credits for ${tier} model`,
            remaining: 0,
            need: gate.cost,
            left: 0,
          },
    { status: gate.kind === "insufficient_credits" ? 402 : 429 }
  );
  return withCreativeVisitorCookie(response, gate);
}
