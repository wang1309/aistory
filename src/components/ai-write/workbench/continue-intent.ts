import { buildContinueSignInRedirect } from "./_lib";

export const GENERATOR_PREFILL_KEY = "ai-write:generator-prefill";
export const CONTINUE_INTENT_KEY = "ai-write:continue-intent";

export type ContinueIntentPayload = {
  redirectTo: string;
  source?: string;
  prefill: {
    title: string;
    content: string;
  };
};

/**
 * 规整生成器预填标题：去首尾空白，超过 30 字截断加省略号。
 * 与各生成器现有的 `prompt.substring(0, 30) + "..."` 行为保持一致。
 */
export function normalizeGeneratorPrefillTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed.length <= 30) {
    return trimmed;
  }

  return `${trimmed.slice(0, 30)}...`;
}

/**
 * 构造登录后恢复“继续 AI 续写”所需的最小状态：
 * - redirectTo: 登录后落地的 AI Write 路由
 * - source: 来源生成器标识，用于埋点与提示
 * - prefill: 标题 + 正文，落地后恢复到编辑器
 */
export function buildContinueIntentPayload({
  source,
  title,
  content,
  storyUuid,
}: {
  source?: string;
  title: string;
  content: string;
  storyUuid?: string;
}): ContinueIntentPayload {
  return {
    redirectTo: buildContinueSignInRedirect({ storyUuid, source }),
    source,
    prefill: {
      title: normalizeGeneratorPrefillTitle(title),
      content,
    },
  };
}

/**
 * 统一封装 OpenPanel 漏斗事件的基础字段，
 * 所有“结果页继续续写”相关事件都带上 entry_point=result_continue。
 */
export function buildContinueTrackingPayload(
  payload: Record<string, unknown>
) {
  return {
    entry_point: "result_continue",
    ...payload,
  };
}
