import { getPricingPage } from "@/services/page";
import { respData, respErr } from "@/lib/resp";

// GET /api/pricing?locale=zh
// 返回 pricing page 数据(items 含套餐价格/积分),供 client 弹窗展示
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") || "en";
    const pricing = await getPricingPage(locale);
    return respData(pricing);
  } catch (e) {
    console.log("get pricing failed:", e);
    return respErr("failed to load pricing");
  }
}
