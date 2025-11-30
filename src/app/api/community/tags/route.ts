import { respData, respErr } from "@/lib/resp";
import { getPopularTags } from "@/models/storyTags";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");

    let limit = limitParam ? parseInt(limitParam, 10) || 20 : 20;
    if (!limit || limit <= 0) {
      limit = 20;
    }
    if (limit > 100) {
      limit = 100;
    }

    const tags = await getPopularTags(limit);

    return respData(tags);
  } catch (e) {
    console.log("get popular tags failed", e);
    return respErr("get popular tags failed");
  }
}
