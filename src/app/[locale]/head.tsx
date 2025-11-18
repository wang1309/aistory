import StructuredData from "@/components/seo/structured-data";
import { setRequestLocale } from "next-intl/server";

export default async function LocaleHead({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <StructuredData locale={locale} type="WebApplication" />
      <StructuredData locale={locale} type="FAQPage" />
    </>
  );
}
