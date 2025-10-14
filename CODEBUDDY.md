Terminal Assistant Agent Quickstart

Commands

- Install deps: pnpm install
- Dev server: pnpm dev
- Build: npm run build
- Start (production): npm run start
- Lint: npm run lint
- Analyze bundle: npm run analyze
- Docker build: npm run docker:build
- Cloudflare preview: npm run cf:preview
- Cloudflare deploy: npm run cf:deploy
- Cloudflare upload: npm run cf:upload
- Cloudflare types: npm run cf:typegen
- Database generate: npm run db:generate
- Database migrate: npm run db:migrate
- Database push: npm run db:push
- Database studio: npm run db:studio

Notes
- Lint may prompt to configure ESLint in Next.js; choose "Strict" to proceed, or run with CI flags when configured.
- Next.js dev uses --turbopack by default; remove if incompatible.

Architecture

- Framework: Next.js 15 App Router (TypeScript), Tailwind v4 with shadcn/ui and tailwindcss-animate.
- i18n and content: next-intl with JSON content for landing pages. Services in src/services/page.ts dynamically import content from src/i18n/pages/<name>/<locale>.json with fallback to en.
- App layout: src/app/[locale]/(default)/layout.tsx composes Header/Footer around children; page.tsx assembles block components (Hero, Branding, Feature*, Showcase, Stats, Pricing, Testimonial, FAQ, CTA) based on content from services/page.
- Blocks/UI: src/components/blocks/* contain landing blocks; src/components/ui/* holds reusable shadcn components.
- Contexts: src/contexts/app.tsx manages session-derived user state, invite flow (CacheKey.InviteCode), feedback modal toggles.
- Auth: next-auth (optional, gated via isAuthEnabled), Google One Tap via hooks/useOneTapLogin.
- Database: drizzle-orm with postgres-js. src/db/index.ts detects Cloudflare Workers and Hyperdrive, selecting proper connection string; src/db/config.ts drives migrations to src/db/migrations with schema from src/db/schema.ts.
- API routes: src/app/api/* implement server actions (e.g., checkout, user info, invites, demo endpoints). Respect env vars from .env.* and wrangler.toml when deploying to Cloudflare.
- Theming: src/app/theme.css and Tailwind utilities in src/app/globals.css; components.json configures shadcn aliases and Tailwind paths.
- Docs rendering: fumadocs (postinstall runs fumadocs-mdx) for documentation pages under /[locale]/docs.

Key Files

- package.json: scripts and deps
- README.md: quickstart and deploy notes
- .cursorrules: coding conventions and structure overview
- next.config.mjs, postcss.config.mjs, vercel.json, open-next.config.ts: platform configs
- src/services/page.ts: content loading pipeline and locale mapping
- src/db/*: database setup and migration tooling

Testing

- No explicit test scripts found in package.json. If tests are added, prefer npm scripts and document here. For now, rely on type checking during build and lint.

Environment

- Copy .env.example to appropriate env files (.env.development for dev, .env.production for prod).
- For Cloudflare deploy, also copy wrangler.toml.example to wrangler.toml and place vars under [vars].
