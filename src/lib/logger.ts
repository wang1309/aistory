export type LogLevel = "debug" | "info" | "warn" | "error";

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: LogLevel = isProd ? "error" : "debug";

// In production, disable noisy console methods globally
if (isProd && typeof console !== "undefined") {
  console.log = () => {};
  // Some environments may use console.debug/info; disable them as well
  // @ts-ignore
  console.debug = () => {};
  // @ts-ignore
  console.info = () => {};
}

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[minLevel];
}

function baseLog(level: LogLevel, ...args: any[]) {
  if (!shouldLog(level)) return;

  if (level === "error") {
    console.error(...args);
  } else if (level === "warn") {
    console.warn(...args);
  } else {
    console.log(...args);
  }
}

export const logger = {
  debug: (...args: any[]) => baseLog("debug", ...args),
  info: (...args: any[]) => baseLog("info", ...args),
  warn: (...args: any[]) => baseLog("warn", ...args),
  error: (...args: any[]) => baseLog("error", ...args),
};
