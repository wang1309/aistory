import { respData, respErr } from "@/lib/resp";

import { getUserUuid } from "@/services/user";
import { insertFeedback } from "@/models/feedback";
import { getUuid } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    let { content, rating } = await req.json();
    if (!content) {
      return respErr("invalid params");
    }

    let user_uuid = await getUserUuid();

    // 如果用户未登录，生成匿名用户ID
    if (!user_uuid) {
      user_uuid = `anonymous-${getUuid()}`;
      console.log("Anonymous user feedback, generated ID:", user_uuid);
    } else {
      console.log("Logged in user feedback, user_uuid:", user_uuid);
    }

    const feedback = {
      user_uuid: user_uuid,
      content: content,
      rating: rating,
      created_at: new Date(),
      status: "created",
    };

    const dbFeedback = await insertFeedback(feedback);

    return respData(dbFeedback);
  } catch (e) {
    console.log("add feedback failed", e);
    return respErr("add feedback failed");
  }
}
