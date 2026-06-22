import { respErr } from "@/lib/resp";
import {
  CreditsAmount,
  CreditsTransType,
  decreaseCredits,
  getUserCredits,
} from "@/services/credit";
import { getUserUuid } from "@/services/user";
import type {
  StoryOutlineChapterPlan,
  StoryOutlineExpandRequest,
} from "@/types/story-outline";
import {
  buildStoryOutlineExpandPrompt,
  normalizeStoryOutlineExpandRequest,
  parseStoryOutlineExpandResponse,
} from "./_lib";

type ExpandDeps = {
  getUserUuid: typeof getUserUuid;
  getUserCredits: typeof getUserCredits;
  decreaseCredits: typeof decreaseCredits;
  fetchModel: (prompt: string) => Promise<Response>;
};

function getDefaultDeps(): ExpandDeps {
  return {
    getUserUuid,
    getUserCredits,
    decreaseCredits,
    fetchModel: async (prompt: string) => {
      const apiKey = process.env.GRSAI_API_KEY;
      if (!apiKey) {
        throw new Error("API KEY not found");
      }

      const baseUrl = process.env.GRSAI_BASE_URL || "https://api.grsai.com";

      return fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-lite",
          stream: false,
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
    },
  };
}

export function createStoryOutlineExpandHandler(deps: ExpandDeps = getDefaultDeps()) {
  return async function POST(req: Request) {
    try {
      const body = (await req.json()) as StoryOutlineExpandRequest;
      const user_uuid = await deps.getUserUuid();

      if (!user_uuid) {
        return respErr("no auth");
      }

      const normalized = normalizeStoryOutlineExpandRequest(body);
      const userCredits = await deps.getUserCredits(user_uuid);

      if ((userCredits.left_credits || 0) < CreditsAmount.StoryOutlineExpand) {
        return respErr("insufficient credits");
      }

      const prompt = buildStoryOutlineExpandPrompt(normalized);
      const upstream = await deps.fetchModel(prompt);

      if (!upstream.ok) {
        return respErr("Failed to expand story outline");
      }

      const data = await upstream.json();
      const rawContent: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        "";

      if (!rawContent.trim()) {
        return respErr("Empty response from upstream model");
      }

      const parsed: StoryOutlineChapterPlan =
        parseStoryOutlineExpandResponse(rawContent);

      await deps.decreaseCredits({
        user_uuid,
        trans_type: CreditsTransType.StoryOutlineExpand,
        credits: CreditsAmount.StoryOutlineExpand,
      });

      return Response.json({
        ...parsed,
        creditsCharged: CreditsAmount.StoryOutlineExpand,
      });
    } catch (error) {
      console.error("Story outline expansion error:", error);
      return respErr(
        error instanceof Error ? error.message : "bad request"
      );
    }
  };
}
