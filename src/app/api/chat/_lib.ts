export type GrSaiChatMessage = {
  role: string;
  content: string | Array<Record<string, unknown>>;
  name?: string;
  tool_call_id?: string;
};

export type GrSaiChatTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type GrSaiChatRequestInput = {
  model?: string;
  messages: GrSaiChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: GrSaiChatTool[];
  tool_choice?: string | Record<string, unknown>;
};

export function buildGrSaiChatRequest(input: GrSaiChatRequestInput) {
  return {
    model: input.model || "gemini-3.1-flash-lite",
    messages: input.messages,
    ...(input.temperature !== undefined
      ? { temperature: input.temperature }
      : {}),
    ...(input.top_p !== undefined ? { top_p: input.top_p } : {}),
    ...(input.max_tokens !== undefined ? { max_tokens: input.max_tokens } : {}),
    ...(input.stream !== undefined ? { stream: input.stream } : {}),
    ...(input.tools ? { tools: input.tools } : {}),
    ...(input.tool_choice !== undefined
      ? { tool_choice: input.tool_choice }
      : {}),
  };
}

export function createGrSaiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
