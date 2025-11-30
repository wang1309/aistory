import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getUserStats } from "@/models/userStats";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const stats = await getUserStats(user_uuid);

    return respData(stats);
  } catch (e) {
    console.log("get user stats failed", e);
    return respErr("get user stats failed");
  }
}
