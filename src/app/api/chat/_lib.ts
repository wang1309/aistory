export type AgnesChatMessage = {
  role: string;
  content: string | Array<Record<string, unknown>>;
  name?: string;
  tool_call_id?: string;
};

export type AgnesChatTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type AgnesChatRequestInput = {
  model?: string;
  messages: AgnesChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: AgnesChatTool[];
  tool_choice?: string | Record<string, unknown>;
  chat_template_kwargs?: Record<string, unknown>;
  thinking?: Record<string, unknown>;
};

export function buildAgnesChatRequest(input: AgnesChatRequestInput) {
  return {
    model: input.model || "agnes-2.0-flash",
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
    ...(input.chat_template_kwargs
      ? { chat_template_kwargs: input.chat_template_kwargs }
      : {}),
    ...(input.thinking ? { thinking: input.thinking } : {}),
  };
}

export function createAgnesHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
