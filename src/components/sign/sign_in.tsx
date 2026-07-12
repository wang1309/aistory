"use client";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function SignIn() {
  const t = useTranslations();
  const { requireAuth } = useAppContext();

  return (
    <Button
      variant="default"
      onClick={() =>
        requireAuth({
          source: "header",
          action: "sign_in",
        })
      }
      className="cursor-pointer"
    >
      {t("user.sign_in")}
    </Button>
  );
}
