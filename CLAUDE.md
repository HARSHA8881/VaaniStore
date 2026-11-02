@AGENTS.md

# Project: VaaniStore

Voice-to-website builder for small Indian retail shops. Owner speaks; AI turns speech into a structured shop profile; we render a public storefront.

## Stack (do not change without asking)

- Next.js 14+ (App Router) + TypeScript (strict) + Tailwind CSS
- Supabase: Postgres, Auth, Storage (product images)
- Speech-to-text: Web Speech API in browser (primary, free) + server fallback using Groq Whisper API (`whisper-large-v3`) for uploaded/recorded audio
- LLM extraction: Google Gemini API (`gemini-2.0-flash` or newest flash model) with JSON response mode; validate with Zod
- Deploy: Vercel
- Tests: Vitest for unit tests, Playwright for one end-to-end flow

## Core data model (single source of truth: `src/lib/schema.ts`, Zod)

```
ShopProfile {
  name: string; slug: string; tagline?: string; category: string;
  about?: string; phone?: string; whatsapp?: string; upiId?: string;
  address?: { line: string; city: string; pincode?: string; mapsQuery?: string };
  hours: { day: "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun"; open?: "HH:MM"; close?: "HH:MM"; closed: boolean }[];
  products: { id: string; name: string; priceInr?: number; unit?: string; imageUrl?: string; inStock: boolean }[];
  theme: "light" | "dark";   // old "classic" | "bright" | "minimal" are read as "light"
  language: "en" | "hi" | "hinglish";
}
```

## Rules

- All AI output MUST be validated with Zod before saving. On validation failure, retry once with the error message, then show the user a manual-edit form.
- Never invent facts. If the owner didn't say a field, leave it empty and list it under "missing" so the UI can ask.
- Secrets only in `.env.local`; never commit keys. Provide `.env.example`.
- Mobile-first UI (most owners use cheap Android phones). Large buttons, minimal text, Hindi labels available.
- Keep components small; put AI prompts in `src/lib/prompts/` as separate files.
- Write clear comments explaining _why_, not just _what_.
- After every feature: run `npm run lint`, `npm run typecheck`, `npm test`.

## Project notes

- Next.js 16 with `cacheComponents`: anything reading `params`, `cookies()` or `searchParams` must sit inside `<Suspense>`. `middleware` is called `src/proxy.ts`. `revalidateTag(tag, profile)` needs two arguments.
- Drafts use `DraftProfileSchema` (name/category/city may be empty); only publishing requires `ShopProfileSchema`.
- AI routes depend on the `GenerateJson` type in `src/lib/ai/llm.ts`, so tests can pass a fake model.
- `npm run test:e2e` stubs the AI endpoints; `npm run eval` measures real model quality.
- Every API route that writes or calls AI must go through `assertSameOrigin` + `readJson` (`src/lib/http.ts`); AI routes use `guardAiRequest` and `aiErrorResponse`.
- New third-party origins (scripts, fetch targets) must be added to the CSP in `next.config.ts`, or the browser will block them.
