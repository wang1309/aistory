import type { NavItem } from "@/types/blocks/base";
import type { User } from "@/types/user";

export function buildUserDropdownItems({
  user,
  labels,
}: {
  user: User;
  labels: {
    userCenter: string;
    adminSystem: string;
    signOut: string;
    credits: string;
  };
}) {
  const items: NavItem[] = [
    {
      title: user.nickname,
    },
    {
      title: `${labels.credits}: ${user.credits?.left_credits ?? 0}`,
      url: "/my-credits",
    },
    {
      title: labels.userCenter,
      url: "/creator-dashboard",
    },
  ];

  if (user.is_admin) {
    items.push({
      title: labels.adminSystem,
      url: "/admin/users",
    });
  }

  items.push({
    title: labels.signOut,
  });

  return items;
}
