"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function VerificationModal({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations();
  const { showVerificationModal, setShowVerificationModal, verificationCallback } = useAppContext();

  const [turnstileToken, setTurnstileToken] = React.useState<string>("");
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // 重置状态
  const resetState = () => {
    setTurnstileToken("");
    setIsVerifying(false);
  };

  // 当模态框关闭时重置状态
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setShowVerificationModal(open);
  };

  // Turnstile 验证成功回调
  const handleTurnstileSuccess = (token: string) => {
    console.log("✓ Turnstile verification successful in modal");
    setTurnstileToken(token);
    setIsVerifying(false);
  };

  // Turnstile 错误回调
  const handleTurnstileError = () => {
    console.log("❌ Turnstile error occurred in modal");
    setTurnstileToken("");
    setIsVerifying(false);
  };

  // Turnstile 过期回调
  const handleTurnstileExpire = () => {
    console.warn("⚠️ Turnstile token expired in modal");
    setTurnstileToken("");
    setIsVerifying(false);
  };

  // 确认验证
  const handleConfirmVerification = () => {
    if (!turnstileToken) {
      return;
    }

    setIsVerifying(true);

    // 调用全局回调函数
    if (verificationCallback) {
      verificationCallback(turnstileToken);
    }

    // 关闭模态框并重置状态
    setShowVerificationModal(false);
    resetState();
  };

  // 使用 useEffect 来处理模态框关闭时的状态重置
  React.useEffect(() => {
    if (!showVerificationModal) {
      resetState();
    }
  }, [showVerificationModal]);

  return (
    <Dialog open={showVerificationModal} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="shield-check" className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {title || t("verification.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description || t("verification.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {siteKey ? (
            <div className="flex justify-center">
              <Turnstile
                siteKey={siteKey}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
              />
            </div>
          ) : (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm text-center">
              ⚠️ {t("verification.not_configured")}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowVerificationModal(false)}
            disabled={isVerifying}
          >
            {t("verification.cancel")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirmVerification}
            disabled={!turnstileToken || isVerifying}
          >
            {isVerifying ? (
              <>
                <Icon name="RiLoader4Line" className="mr-2 h-4 w-4 animate-spin" />
                {t("verification.verifying")}
              </>
            ) : (
              <>
                <Icon name="check" className="mr-2 h-4 w-4" />
                {t("verification.confirm")}
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("verification.footer_text")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}