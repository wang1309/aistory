import type { CreativePageKey } from "@/lib/creative-quota-core";

export type CreativeQuotaSignInTrigger =
  | "optimistic"
  | "backend_fallback";

export type CreativePaywallReason = "insufficient_credits";

export type CreativePaywallTrackingInput = {
  sourcePage: CreativePageKey;
  loggedIn: boolean;
  locale?: string;
  reason: CreativePaywallReason;
  productId?: string;
  productName?: string;
  pricingGroup?: string | null;
  interval?: string | null;
  currency?: string;
  paymentMethod?: "default" | "cnpay";
  httpStatus?: number;
  failureReason?:
    | "not_authenticated"
    | "session_expired"
    | "response_error"
    | "missing_checkout_url"
    | "network_error";
};

export function buildCreativeQuotaSignInTrackingPayload(
  sourcePage: CreativePageKey,
  trigger: CreativeQuotaSignInTrigger
) {
  return {
    source_page: sourcePage,
    cta_variant: "sign_in_get_more_credits",
    trigger,
  };
}

export function buildCreativePaywallTrackingPayload(
  input: CreativePaywallTrackingInput
) {
  return {
    source_page: input.sourcePage,
    logged_in: input.loggedIn,
    ...(input.locale ? { locale: input.locale } : {}),
    reason: input.reason,
    ...(input.productId ? { product_id: input.productId } : {}),
    ...(input.productName ? { product_name: input.productName } : {}),
    ...(typeof input.pricingGroup !== "undefined"
      ? { pricing_group: input.pricingGroup }
      : {}),
    ...(typeof input.interval !== "undefined"
      ? { interval: input.interval }
      : {}),
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.paymentMethod ? { payment_method: input.paymentMethod } : {}),
    ...(typeof input.httpStatus === "number"
      ? { http_status: input.httpStatus }
      : {}),
    ...(input.failureReason ? { failure_reason: input.failureReason } : {}),
  };
}
