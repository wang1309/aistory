"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import SignForm from "@/components/sign/form";

export default function SignModal() {
  const t = useTranslations();
  const { showSignModal, setShowSignModal, signModalContext } = useAppContext();

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isContinueContext = signModalContext.mode === "continue-ai-write";
  const continueRedirect =
    isContinueContext ? signModalContext.redirectTo : undefined;
  const continueSource = isContinueContext ? signModalContext.source : undefined;
  const title = isContinueContext
    ? t("sign_modal.continue_ai_write_title")
    : t("sign_modal.sign_in_title");
  const description = isContinueContext
    ? t("sign_modal.continue_ai_write_description")
    : t("sign_modal.sign_in_description");

  if (isDesktop) {
    return (
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <SignForm
            redirectTo={continueRedirect}
            contextMode={signModalContext.mode}
            source={continueSource}
            showHeader={false}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showSignModal} onOpenChange={setShowSignModal}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <SignForm
          redirectTo={continueRedirect}
          contextMode={signModalContext.mode}
          source={continueSource}
          showHeader={false}
          className="px-4"
        />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t("sign_modal.cancel_title")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
