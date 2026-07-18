"use client";

import dynamic from "next/dynamic";
import type { CreativePageKey } from "@/lib/creative-quota-core";

const PaywallModal = dynamic(() => import("@/components/story/paywall-modal"), {
  ssr: false,
});

export function CreativeQuotaPaywall({
  open,
  onClose,
  sourcePage,
}: {
  open: boolean;
  onClose: () => void;
  sourcePage: CreativePageKey;
}) {
  return <PaywallModal open={open} onClose={onClose} sourcePage={sourcePage} />;
}
