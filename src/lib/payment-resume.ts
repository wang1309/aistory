const PAYMENT_RESUME_ORIGIN = "https://storiesgenerator.local";

export function normalizePaymentResumePath(
  value: unknown,
  locale: string
): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return null;
  }

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (
    decodedValue.startsWith("//") ||
    decodedValue.includes("\\") ||
    /[\r\n]/.test(decodedValue)
  ) {
    return null;
  }

  try {
    const url = new URL(value, PAYMENT_RESUME_ORIGIN);
    if (url.origin !== PAYMENT_RESUME_ORIGIN) {
      return null;
    }

    const localePrefix = `/${locale}`;
    const pathname =
      url.pathname === localePrefix
        ? "/"
        : url.pathname.startsWith(`${localePrefix}/`)
          ? url.pathname.slice(localePrefix.length)
          : url.pathname;

    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getPaymentSuccessPath({
  resumePath,
  configuredSuccessPath,
  locale,
}: {
  resumePath: unknown;
  configuredSuccessPath: unknown;
  locale: string;
}): string {
  return (
    normalizePaymentResumePath(resumePath, locale) ||
    normalizePaymentResumePath(configuredSuccessPath, locale) ||
    "/"
  );
}

export function appendPaymentSuccessMarker(path: string): string {
  const url = new URL(path, PAYMENT_RESUME_ORIGIN);
  url.searchParams.set("payment", "success");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function removePaymentSuccessMarker(path: string): string {
  const url = new URL(path, PAYMENT_RESUME_ORIGIN);
  url.searchParams.delete("payment");
  return `${url.pathname}${url.search}${url.hash}`;
}
