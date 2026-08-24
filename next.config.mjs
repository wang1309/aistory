import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  async redirects() {
    // ai-tools module tools live under /ai-tools/<slug>. Keep old root-level
    // URLs (and their locale variants) working with permanent redirects.
    const toolSlugs = [
      "emoji-translator",
      "elf-name-generator",
      "pen-name-generator",
      "gang-name-generator",
      "band-name-generator",
      "random-nfl-team-generator",
      "middle-name-generator",
    ];
    const prefixedLocales = ["zh", "de", "ja", "ko", "ru"];
    return toolSlugs.flatMap((slug) => [
      {
        source: `/${slug}`,
        destination: `/ai-tools/${slug}`,
        permanent: true,
      },
      ...prefixedLocales.map((locale) => ({
        source: `/${locale}/${slug}`,
        destination: `/${locale}/ai-tools/${slug}`,
        permanent: true,
      })),
    ]);
  },
};

// Make sure experimental mdx flag is enabled
const configWithMDX = {
  ...nextConfig,
  experimental: {
    mdxRs: true,
  },
};

export default withBundleAnalyzer(withNextIntl(withMDX(configWithMDX)));

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
