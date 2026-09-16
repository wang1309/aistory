import { respErr } from "@/lib/resp";
import {
  buildGrSaiChatRequest,
  createGrSaiHeaders,
  type GrSaiChatRequestInput,
} from "./_lib";

function getGrSaiBaseUrl() {
  return (process.env.GRSAI_BASE_URL || "https://api.grsai.com").replace(
    /\/$/,
    ""
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GrSaiChatRequestInput;

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return respErr("messages are required");
    }

    const apiKey = process.env.GRSAI_API_KEY;
    if (!apiKey) {
      return respErr("GRSAI_API_KEY not configured");
    }

    const payload = buildGrSaiChatRequest(body);
    const response = await fetch(`${getGrSaiBaseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: createGrSaiHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return respErr(`GRSAI API error: ${response.status} ${errorText}`);
    }

    if (payload.stream) {
      if (!response.body) {
        return respErr("No response body from GRSAI API");
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
    return respErr(`GRSAI chat proxy failed: ${error}`);
  }
}
