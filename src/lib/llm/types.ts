export type AiProvider = "grsai" | "apimart";

export type ModelTier = "fast" | "standard" | "creative";

export type ChatMessage = {
  role: string;
  content: string | Array<Record<string, unknown>>;
  name?: string;
  tool_call_id?: string;
};

export type ChatTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

/**
 * OpenAI-compatible Chat Completions request body.
 * Every text generation route in this app speaks this shape.
 */
export type ChatRequestBody = {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  tools?: ChatTool[];
  tool_choice?: string | Record<string, unknown>;
  response_format?: Record<string, unknown>;
  reasoning_effort?: string;
  [key: string]: unknown;
};

export type ChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type ChatProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  chatPath: string;
  chatPathNoStream: string;
  supportsResponseFormat: boolean;
  streamNonStreamRequests: boolean;
  timeoutMs: number;
};
