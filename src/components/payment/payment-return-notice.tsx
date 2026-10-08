"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import { removePaymentSuccessMarker } from "@/lib/payment-resume";

export default function PaymentReturnNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("payment_return");
  const { track } = useOpenPanel();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || searchParams.get("payment") !== "success") return;

    shown.current = true;
    track("payment_returned_to_task", { return_path: pathname });
    toast.success(t("title"), { description: t("description") });

    const nextUrl = removePaymentSuccessMarker(
      `${pathname}?${searchParams}${window.location.hash}`
    );
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, t, track]);

  return null;
}
