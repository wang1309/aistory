import type { AgnesChatMessage } from "../_lib";

const INPUT_PRICE_PER_MILLION_TOKENS = 0.15;
const OUTPUT_PRICE_PER_MILLION_TOKENS = 0.3;
const CREDIT_VALUE_USD = 0.001;
const ONE_MILLION = 1_000_000;

function estimateContentTokens(content: AgnesChatMessage["content"]) {
  if (typeof content === "string") {
    return Math.max(1, Math.ceil(content.length / 4));
  }

  return content.reduce((total, block) => {
    if (block.type === "text" && typeof block.text === "string") {
      return total + Math.max(1, Math.ceil(block.text.length / 4));
    }

    if (block.type === "image_url") {
      return total + 256;
    }

    return total + 8;
  }, 0);
}

export function estimateMessageTokens(messages: AgnesChatMessage[]) {
  return messages.reduce((total, message) => {
    return total + 4 + estimateContentTokens(message.content);
  }, 0);
}

export function calculateContinueChatCredits({
  promptTokens,
  completionTokens,
}: {
  promptTokens: number;
  completionTokens: number;
}) {
  const inputCostUsd =
    (promptTokens * INPUT_PRICE_PER_MILLION_TOKENS) / ONE_MILLION;
  const outputCostUsd =
    (completionTokens * OUTPUT_PRICE_PER_MILLION_TOKENS) / ONE_MILLION;
  const inputCredits = inputCostUsd / CREDIT_VALUE_USD;
  const outputCredits = outputCostUsd / CREDIT_VALUE_USD;

  return Math.max(1, Math.ceil(inputCredits + outputCredits));
}

export function estimateMaxContinueChatCredits({
  messages,
  maxTokens,
}: {
  messages: AgnesChatMessage[];
  maxTokens: number;
}) {
  return calculateContinueChatCredits({
    promptTokens: estimateMessageTokens(messages),
    completionTokens: maxTokens,
  });
}
