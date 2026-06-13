import Empty from "@/components/blocks/empty";
import { getCreditsByUserUuid } from "@/models/credit";
import { getTranslations } from "next-intl/server";
import { getUserCredits } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import CreditsList from "@/components/console/credits-list";


export default async function MyCreditsPage() {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return <Empty message="no auth" />;
  }

  const data = await getCreditsByUserUuid(user_uuid, 1, 100);
  const userCredits = await getUserCredits(user_uuid);

  const labels = {
    trans_no: t("my_credits.table.trans_no"),
    trans_type: t("my_credits.table.trans_type"),
    credits: t("my_credits.table.credits"),
    created_at: t("my_credits.table.created_at"),
    expired_at: t("my_credits.table.expired_at"),
  };

  return (
    <CreditsList
      leftCredits={userCredits?.left_credits || 0}
      records={data || []}
      title={t("my_credits.title")}
      rechargeLabel={t("my_credits.recharge")}
      emptyMessage={t("my_credits.no_credits")}
      labels={labels}
    />
  );
}
