export function buildCreatorDashboardActivityLabels(
  t: (key: string) => string
) {
  return {
    title: t("creation_dashboard.activity.title"),
    description: t("creation_dashboard.activity.description"),
    weekdays: Array.from({ length: 7 }).map((_, i) =>
      t(`creation_dashboard.activity.weekdays.${i}`)
    ),
    trend_title: t("creation_dashboard.activity.trend_title"),
    trend_hint: t("creation_dashboard.activity.trend_hint"),
    empty: t("creation_dashboard.activity.empty"),
  };
}
