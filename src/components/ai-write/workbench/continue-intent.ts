import { buildContinueSignInRedirect } from "./_lib";

export const GENERATOR_PREFILL_KEY = "ai-write:generator-prefill";
export const CONTINUE_INTENT_KEY = "ai-write:continue-intent";

export type BackstoryContinuationContext = {
  outputLanguage: string;
  worldview: string;
  roleType: string;
  tone: string;
  length: string;
};

export type ContinueEntryMode = "direct" | "post_auth";

export type ContinueIntentPayload = {
  redirectTo: string;
  source?: string;
  entryMode: ContinueEntryMode;
  prefill: {
    title: string;
    content: string;
    context?: BackstoryContinuationContext;
  };
};

/**
 * 透传生成器选中的稳定选项标识（语言/世界观/角色定位/基调/篇幅），
 * 仅用于 AI 续写的写作上下文，绝不包含用户输入或生成的正文。
 */
export function buildBackstoryContinuationContext(
  context: BackstoryContinuationContext
) {
  return context;
}

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
  entryMode = "direct",
  context,
}: {
  source?: string;
  title: string;
  content: string;
  storyUuid?: string;
  entryMode?: ContinueEntryMode;
  context?: BackstoryContinuationContext;
}): ContinueIntentPayload {
  return {
    redirectTo: buildContinueSignInRedirect({ storyUuid, source }),
    source,
    entryMode,
    prefill: {
      title: normalizeGeneratorPrefillTitle(title),
      content,
      ...(context ? { context } : {}),
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
