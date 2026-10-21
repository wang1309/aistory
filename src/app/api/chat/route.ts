import { respErr } from "@/lib/resp";
import { fetchChatCompletion } from "@/lib/llm";
import {
  buildGrSaiChatRequest,
  type GrSaiChatRequestInput,
} from "./_lib";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GrSaiChatRequestInput;

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return respErr("messages are required");
    }

    const payload = buildGrSaiChatRequest(body);
    const response = await fetchChatCompletion({ body: payload });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return respErr(
        errorData?.error?.message || `AI API error: ${response.status}`
      );
    }

    // The wrapper already returns the normalized body and SSE headers.
    return response;
  } catch (error) {
    return respErr(`AI chat proxy failed: ${error}`);
  }
}
