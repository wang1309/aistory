import { getOrdersByPaidEmail, getOrdersByUserUuid } from "@/models/order";
import { getUserEmail, getUserUuid } from "@/services/user";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getStripeBilling } from "@/services/order";
import OrdersList from "@/components/console/orders-list";


export default async function MyOrdersPage() {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-orders`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  let orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    orders = await getOrdersByPaidEmail(user_email);
  }

  const ordersWithBilling = await Promise.all(
    (orders || []).map(async (order) => {
      let billing_url: string | undefined;

      if (
        order.stripe_session_id &&
        order.stripe_session_id.startsWith("cs_")
      ) {
        let sub_id = order.sub_id;
        if (!sub_id && order.paid_detail) {
          try {
            const paid_detail = JSON.parse(order.paid_detail);
            sub_id = paid_detail.subscription;
          } catch {}
        }
        if (sub_id) {
          try {
            const billing = await getStripeBilling(sub_id);
            billing_url = billing.url;
          } catch {}
        }
      }

      return { ...order, billing_url };
    })
  );

  const labels = {
    order_no: t("my_orders.table.order_no"),
    email: t("my_orders.table.email"),
    product_name: t("my_orders.table.product_name"),
    amount: t("my_orders.table.amount"),
    interval: t("my_orders.table.interval"),
    paid_at: t("my_orders.table.paid_at"),
    manage_billing: t("my_orders.table.manage_billing"),
    interval_month: t("my_orders.table.interval_month"),
    interval_year: t("my_orders.table.interval_year"),
    interval_one_time: t("my_orders.table.interval_one_time"),
  };

  return (
    <OrdersList
      orders={ordersWithBilling}
      title={t("my_orders.title")}
      emptyMessage={t("my_orders.no_orders")}
      labels={labels}
    />
  );
}
