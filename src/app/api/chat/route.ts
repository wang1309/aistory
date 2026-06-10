import { respErr } from "@/lib/resp";
import {
  buildAgnesChatRequest,
  createAgnesHeaders,
  type AgnesChatRequestInput,
} from "./_lib";

function getAgnesBaseUrl() {
  return (process.env.AGNES_BASE_URL || "https://apihub.agnes-ai.com").replace(
    /\/$/,
    ""
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgnesChatRequestInput;

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return respErr("messages are required");
    }

    const apiKey = process.env.AGNES_API_KEY;
    if (!apiKey) {
      return respErr("AGNES_API_KEY not configured");
    }

    const payload = buildAgnesChatRequest(body);
    const response = await fetch(`${getAgnesBaseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: createAgnesHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return respErr(`Agnes API error: ${response.status} ${errorText}`);
    }

    if (payload.stream) {
      if (!response.body) {
        return respErr("No response body from Agnes API");
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ||
            "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return respErr(`Agnes chat proxy failed: ${error}`);
  }
}
