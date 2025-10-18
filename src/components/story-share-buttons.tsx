"use client";

import { useState } from "react";
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
} from "react-share";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Icon from "@/components/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoryShareButtonsProps {
  storyTitle: string;
  wordCount: number;
  model: string;
  locale: string;
  inviteCode?: string;
  className?: string;
  translations: {
    title: string;
    copy_link: string;
    share_twitter: string;
    share_facebook: string;
    share_linkedin: string;
    link_copied: string;
    share_text_template: string;
  };
}

export default function StoryShareButtons({
  storyTitle,
  wordCount,
  model,
  locale,
  inviteCode,
  className = "",
  translations,
}: StoryShareButtonsProps) {
  const [open, setOpen] = useState(false);

  // Base URL
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";

  // Share URL with invite code
  const getShareUrl = (platform: string) => {
    if (!inviteCode) {
      // Fallback to homepage if no invite code
      return `${baseUrl}/${locale === "en" ? "" : locale}?utm_source=${platform}&utm_medium=share&utm_campaign=story_share`;
    }
    return `${baseUrl}/i/${inviteCode}?utm_source=${platform}&utm_medium=share&utm_campaign=story_share`;
  };

  // OG Image URL
  const ogImageUrl = `${baseUrl}/api/og-story?title=${encodeURIComponent(
    storyTitle
  )}&wordCount=${wordCount}&model=${encodeURIComponent(model)}&locale=${locale}`;

  // Share text based on locale
  const shareText = translations.share_text_template.replace("{wordCount}", String(wordCount));

  // Handle copy link
  const handleCopyLink = async () => {
    const url = getShareUrl("clipboard");
    try {
      await navigator.clipboard.writeText(url);
      toast.success(translations.link_copied);
      setOpen(false);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Icon name="RiShareLine" className="size-4 mr-1" />
          <span className="hidden sm:inline">{translations.title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{translations.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Icon name="RiLinkLine" className="size-4 mr-2" />
          {translations.copy_link}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Twitter */}
        <DropdownMenuItem
          className="cursor-pointer p-0"
          onSelect={(e) => e.preventDefault()}
        >
          <TwitterShareButton
            url={getShareUrl("twitter")}
            title={shareText}
            className="w-full flex items-center px-2 py-1.5 hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <TwitterIcon size={20} round className="mr-2" />
            <span className="flex-1 text-left text-sm">
              {translations.share_twitter}
            </span>
          </TwitterShareButton>
        </DropdownMenuItem>

        {/* Facebook */}
        <DropdownMenuItem
          className="cursor-pointer p-0"
          onSelect={(e) => e.preventDefault()}
        >
          <FacebookShareButton
            url={getShareUrl("facebook")}
            hashtag="#AIStoryGenerator"
            className="w-full flex items-center px-2 py-1.5 hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <FacebookIcon size={20} round className="mr-2" />
            <span className="flex-1 text-left text-sm">
              {translations.share_facebook}
            </span>
          </FacebookShareButton>
        </DropdownMenuItem>

        {/* LinkedIn */}
        <DropdownMenuItem
          className="cursor-pointer p-0"
          onSelect={(e) => e.preventDefault()}
        >
          <LinkedinShareButton
            url={getShareUrl("linkedin")}
            title={storyTitle}
            summary={shareText}
            source="AI Story Generator"
            className="w-full flex items-center px-2 py-1.5 hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <LinkedinIcon size={20} round className="mr-2" />
            <span className="flex-1 text-left text-sm">
              {translations.share_linkedin}
            </span>
          </LinkedinShareButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
