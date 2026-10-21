import { resolveModelTier } from "@/lib/llm/models";
import type { ChatMessage, ChatRequestBody, ChatTool } from "@/lib/llm/types";

export type GrSaiChatMessage = ChatMessage;
export type GrSaiChatTool = ChatTool;

export type GrSaiChatRequestInput = ChatRequestBody & {
  messages: ChatMessage[];
};

/**
 * Build an OpenAI-compatible request body for the active provider.
 * `stream` is always explicit because APIMart's documented default differs
 * between its streaming and non-streaming endpoints.
 */
export function buildGrSaiChatRequest(input: GrSaiChatRequestInput) {
  return {
    model: resolveModelTier(input.model),
    messages: input.messages,
    // Internal fields such as storyId/metadata must never reach the provider.
    stream: input.stream ?? false,
    ...(input.temperature !== undefined
      ? { temperature: input.temperature }
      : {}),
    ...(input.top_p !== undefined ? { top_p: input.top_p } : {}),
    ...(input.max_tokens !== undefined ? { max_tokens: input.max_tokens } : {}),
    ...(input.tools ? { tools: input.tools } : {}),
    ...(input.tool_choice !== undefined
      ? { tool_choice: input.tool_choice }
      : {}),
    ...(input.response_format !== undefined
      ? { response_format: input.response_format }
      : {}),
    ...(input.reasoning_effort !== undefined
      ? { reasoning_effort: input.reasoning_effort }
      : {}),
  };
}

export function createGrSaiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
