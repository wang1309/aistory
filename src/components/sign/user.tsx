"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Link } from "@/i18n/navigation";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { buildUserDropdownItems } from "./user-menu";

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();

  const dropdownItems = buildUserDropdownItems({
    user,
    labels: {
      userCenter: t("user.user_center"),
      adminSystem: t("user.admin_system"),
      signOut: t("user.sign_out"),
      credits: t("user.credits"),
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-4 bg-background">
        {dropdownItems.map((item, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              key={index}
              className="flex justify-center cursor-pointer"
            >
              {item.url ? (
                <Link href={item.url as any} target={item.target} className="w-full">
                  {item.title}
                </Link>
              ) : index === dropdownItems.length - 1 ? (
                <button
                  className="w-full text-center"
                  onClick={() => signOut()}
                >
                  {item.title}
                </button>
              ) : (
                <span className="w-full text-center">{item.title}</span>
              )}
            </DropdownMenuItem>
            {index !== dropdownItems.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
