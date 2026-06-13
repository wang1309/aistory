import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUserUuid } from "@/services/user";
import { getUserStats } from "@/models/userStats";
import { getDailyStoryStatsByUser } from "@/models/storyAnalytics";
import DashboardView from "@/components/console/dashboard-view";
import { buildCreatorDashboardActivityLabels } from "@/components/console/creator-dashboard-lib";

export default async function CreatorDashboardPage() {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/creator-dashboard`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const stats = await getUserStats(user_uuid);

  const dailyStats = await getDailyStoryStatsByUser({
    user_uuid,
    days: 30,
  });

  const totalStories = stats?.total_stories ?? 0;
  const totalWords = stats?.total_words ?? 0;
  const creationDays = stats?.creation_days ?? 0;
  const currentStreak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;

  const cards = [
    {
      key: "total_stories",
      title: t("creation_dashboard.cards.total_stories.title"),
      value: totalStories.toLocaleString(),
      description: t("creation_dashboard.cards.total_stories.description"),
    },
    {
      key: "total_words",
      title: t("creation_dashboard.cards.total_words.title"),
      value: totalWords.toLocaleString(),
      description: t("creation_dashboard.cards.total_words.description"),
    },
    {
      key: "creation_days",
      title: t("creation_dashboard.cards.creation_days.title"),
      value: creationDays.toLocaleString(),
      description: t("creation_dashboard.cards.creation_days.description"),
    },
    {
      key: "streak",
      title: t("creation_dashboard.cards.streak.title"),
      value: currentStreak.toLocaleString(),
      description: t("creation_dashboard.cards.streak.description", {
        longest_streak: longestStreak.toLocaleString(),
      }),
    },
  ];

  const activityLabels = buildCreatorDashboardActivityLabels(t);

  return (
    <DashboardView
      title={t("creation_dashboard.title")}
      description={t("creation_dashboard.description")}
      stats={cards}
      dailyStats={dailyStats}
      activityLabels={activityLabels}
    />
  );
}
