/**
 * 统一埋点:同时推 Clarity + GA(若已注入)
 * - Clarity:window.clarity("event", name)  —— 自定义事件,可在 Clarity 后台按事件名筛选
 * - GA:window.gtag("event", name, params)  —— 走 GA4 事件
 *
 * 两端任一未注入都会静默跳过(不报错),方便本地无埋点环境调试。
 */
export function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      clarity?: (cmd: string, ...args: unknown[]) => void;
      gtag?: (...args: unknown[]) => void;
    };
    if (typeof w.clarity === "function") {
      w.clarity("event", eventName);
    }
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, params || {});
    }
  } catch (e) {
    console.log("track failed:", e);
  }
}
