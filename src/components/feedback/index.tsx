"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Github, Mail, MessageCircle, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useState } from "react";
import { SocialItem } from "@/types/blocks/base";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Feedback({
  socialLinks,
}: {
  socialLinks?: SocialItem[];
}) {
  const t = useTranslations();

  const { user, setShowSignModal, showFeedback, setShowFeedback } =
    useAppContext();

  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubmit = async () => {
    console.log("handleSubmit called", { user, feedback, rating });
    console.log("=== Frontend Turnstile Debug ===");
    console.log("Turnstile Token:", turnstileToken ? `Present (length: ${turnstileToken.length})` : "MISSING");
    console.log("Site Key:", siteKey ? "Configured" : "MISSING");

    // 允许未登录用户提交反馈，后端会自动处理
    console.log("User status:", user ? "Logged in" : "Anonymous");

    if (!feedback.trim()) {
      console.log("Feedback is empty");
      toast.error("Please enter your feedback");
      return;
    }

    if (!turnstileToken) {
      console.log("❌ Turnstile token is missing - user may not have completed verification");
      toast.error("Please complete the verification");
      return;
    }

    console.log("✓ All validations passed, sending request...");

    try {
      setLoading(true);
      console.log("Submitting feedback...");

      const req = {
        content: feedback,
        rating: rating,
        turnstileToken: turnstileToken,
      };

      const resp = await fetch("/api/add-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });

      console.log("Response status:", resp.status);

      if (!resp.ok) {
        toast.error("Submit failed with status " + resp.status);
        return;
      }

      const { code, message } = await resp.json();
      console.log("Response data:", { code, message });

      if (code !== 0) {
        toast.error(message);
        return;
      }

      toast.success("Thank you for your feedback!");

      setFeedback("");
      setRating(null);
      setTurnstileToken("");
      setShowFeedback(false);
    } catch (error) {
      console.log("Submit error:", error);
      toast.error("Failed to submit, please try again later");
    } finally {
      setLoading(false);
    }
  };

  const ratings = [
    { emoji: "😞", value: 1 },
    { emoji: "😐", value: 5 },
    { emoji: "😊", value: 10 },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => setShowFeedback(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {t("feedback.title")}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t("feedback.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Textarea
              placeholder={t("feedback.placeholder")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[150px] text-base resize-none"
            />
          </div>

          <div className="mt-4 flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              {t("feedback.rating_tip")}
            </p>
            <div className="flex flex-row gap-2">
              {ratings.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setRating(item.value)}
                  className={`p-2 text-2xl rounded-lg hover:bg-secondary transition-colors ${
                    rating === item.value ? "bg-secondary" : ""
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          {siteKey && (
            <div className="mt-4">
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => {
                  console.log("✓ Turnstile verification successful, token received");
                  setTurnstileToken(token);
                }}
                onError={() => {
                  console.log("❌ Turnstile error occurred");
                  setTurnstileToken("");
                }}
                onExpire={() => {
                  console.warn("⚠️ Turnstile token expired");
                  setTurnstileToken("");
                }}
              />
            </div>
          )}

          {!siteKey && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
              ⚠️ Turnstile not configured - NEXT_PUBLIC_TURNSTILE_SITE_KEY missing
            </div>
          )}

          <div className="mt-6 flex justify-start items-center gap-4">
            {socialLinks && socialLinks.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("feedback.contact_tip")}
                </p>
                <div className="flex gap-4">
                  {socialLinks?.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title={link.title}
                    >
                      <Icon name={link.icon || ""} className="text-xl" />
                    </a>
                  ))}
                </div>
              </>
            )}
            <div className="flex-1"></div>
            <div className="flex gap-3">
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? t("feedback.loading") : t("feedback.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
