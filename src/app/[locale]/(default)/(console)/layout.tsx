import ConsoleLayout from "@/components/console/layout";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getTranslations } from "next-intl/server";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";


export default async function ConsoleLayoutPage({ children }: { children: ReactNode }) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const t = await getTranslations();
  // NOTE: 如需恢复暂时隐藏的导航项（My Orders / My Credits / My Invites / API Keys），
  // 可以将下面这些对象重新插入到 sidebar.nav.items 中：
  // {
  //   title: t("user.my_orders"),
  //   url: "/my-orders",
  //   icon: "RiOrderPlayLine",
  //   is_active: false,
  // },
  // {
  //   title: t("my_credits.title"),
  //   url: "/my-credits",
  //   icon: "RiBankCardLine",
  //   is_active: false,
  // },
  // {
  //   title: t("my_invites.title"),
  //   url: "/my-invites",
  //   icon: "RiMoneyCnyCircleFill",
  //   is_active: false,
  // },
  // {
  //   title: t("api_keys.title"),
  //   url: "/api-keys",
  //   icon: "RiKey2Line",
  //   is_active: false,
  // },

  const sidebar: Sidebar = {
    nav: {
      items: [
        {
          title: t("creation_dashboard.nav_title"),
          url: "/creator-dashboard",
          icon: "RiDashboardLine",
          is_active: false,
        },
        {
          title: t("my_stories.title"),
          url: "/my-stories",
          icon: "RiBookOpenLine",
          is_active: false,
        },
      ],
    },
  };

  return <ConsoleLayout sidebar={sidebar}>{children}</ConsoleLayout>;
}
