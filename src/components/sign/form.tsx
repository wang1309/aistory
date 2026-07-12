"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiGithub, SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { buildContinueTrackingPayload } from "@/components/ai-write/workbench/continue-intent";
import {
  buildAuthTrackingPayload,
  writePendingAuthAttempt,
  type AuthAction,
  type AuthProvider,
  type AuthSource,
} from "@/lib/auth-funnel";

type SignFormContextMode = "default" | "continue-ai-write";

export default function SignForm({
  redirectTo,
  contextMode = "default",
  source,
  authSource,
  authAction,
  showHeader = true,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  redirectTo?: string;
  contextMode?: SignFormContextMode;
  source?: string;
  authSource?: AuthSource;
  authAction?: AuthAction;
  showHeader?: boolean;
}) {
  const t = useTranslations();
  const { track } = useOpenPanel();

  const isContinueContext = contextMode === "continue-ai-write";
  const title = isContinueContext
    ? t("sign_modal.continue_ai_write_title")
    : t("sign_modal.sign_in_title");
  const description = isContinueContext
    ? t("sign_modal.continue_ai_write_description")
    : t("sign_modal.sign_in_description");

  const googleLabel = t("sign_modal.google_sign_in");
  const githubLabel = t("sign_modal.github_sign_in");

  const trackSignInStart = (provider: AuthProvider) => {
    const resolvedSource =
      authSource || (isContinueContext ? "ai_write" : "header");
    const resolvedAction =
      authAction || (isContinueContext ? "continue_writing" : "sign_in");

    writePendingAuthAttempt({
      source: resolvedSource,
      action: resolvedAction,
      provider,
      startedAt: Date.now(),
    });

    track(
      "auth_provider_click",
      buildAuthTrackingPayload({
        source: resolvedSource,
        action: resolvedAction,
        provider,
        context: isContinueContext ? "continue-ai-write" : "default",
      })
    );

    if (!isContinueContext) return;
    track(
      "sign_in_start_for_continue",
      buildContinueTrackingPayload({
        source_page: source,
        provider,
      })
    );
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {showHeader && (
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    trackSignInStart("google");
                    signIn("google", { redirectTo });
                  }}
                >
                  <SiGoogle className="w-4 h-4" />
                  {googleLabel}
                </Button>
              )}
              {process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    trackSignInStart("github");
                    signIn("github", { redirectTo });
                  }}
                >
                  <SiGithub className="w-4 h-4" />
                  {githubLabel}
                </Button>
              )}
            </div>

            {isContinueContext && (
              <p className="text-center text-xs text-muted-foreground">
                {t("sign_modal.continue_ai_write_safe_hint")}
              </p>
            )}

            {false && (
              <>
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Sign up
                  </a>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        By clicking continue, you agree to our{" "}
        <a href="/terms-of-service" target="_blank">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" target="_blank">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
