import { redirect } from "@/i18n/navigation";
import { newStripeClient } from "@/integrations/stripe";
import { handleCheckoutSession } from "@/services/stripe";
import {
  appendPaymentSuccessMarker,
  getPaymentSuccessPath,
} from "@/lib/payment-resume";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const order_no = searchParams.get("order_no");

  const locale = searchParams.get("locale") || "en";
  let redirectUrl = "";

  try {
    if (!session_id || !order_no) {
      throw new Error("invalid params");
    }

    const client = newStripeClient();

    const session = await client
      .stripe()
      .checkout.sessions.retrieve(session_id);

    await handleCheckoutSession(client.stripe(), session);

    console.log("stripe callback session: ", session);

    redirectUrl = appendPaymentSuccessMarker(
      getPaymentSuccessPath({
        resumePath: session.metadata?.resume_path,
        configuredSuccessPath: process.env.NEXT_PUBLIC_PAY_SUCCESS_URL,
        locale,
      })
    );
  } catch (e) {
    console.log("handle stripe callback failed: ", e);
    redirectUrl = process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/";
  }

  redirect({
    href: redirectUrl,
    locale: locale,
  });
}
