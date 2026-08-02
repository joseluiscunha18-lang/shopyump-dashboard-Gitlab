# Shopyump Dashboard (Next.js)

Phase 1 migration of the Shopyump seller dashboard from static HTML/JS to
Next.js 15 (App Router, TypeScript, Tailwind 4), per
`Shopyump_Dashboard_Architecture.docx`. Design tokens are ported from
`Marketplace-main` so both apps share the same brand color, type scale
and skeleton-loading feel.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in real Supabase project values
npm run dev
```

Required env vars (see `.env.local.example` for the full list and
comments):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the same
  shared Supabase project the legacy dashboard already uses.
- `NEXT_PUBLIC_WEB_URL` — used to build "view my store" links.
- `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` — leave empty locally; set to
  `.shopyump.com` in production so the session cookie is readable by
  both `shopyump.com` and `dashboard.shopyump.com` (architecture doc §5.2).

## Before this goes live — read this first

1. **Verify the schema.** `types/database.ts` is hand-reconstructed from
   the legacy app's Supabase queries (there was no schema/migration file
   in the original zip). Run
   `supabase gen types typescript --project-id <id>` against the real
   project and reconcile any drift — field names, nullability, and the
   `pedidos.status` enum values in particular.
2. **Confirm RLS policies exist on every table** (`lojas`, `produtos`,
   `pedidos`, `visitas`, `admins`). The app has no server-side
   authorization layer of its own beyond "does this row's `loja_id`
   belong to the signed-in user's store" — that check only holds if RLS
   enforces it at the database level.
3. **Confirm the storage bucket names** in `lib/storage.ts`
   (`BUCKETS.produtos`, `BUCKETS.lojas`) against the real project — `Logo`
   was inferred from a URL in the legacy `manifest.json`; the products
   bucket name is a guess and almost certainly needs correcting.
4. **Add real PWA icons** at `public/icons/icon-192.png` and
   `icon-512.png` (referenced by `app/manifest.ts` but not included here).
5. **OneSignal push** (`lib/push.ts`) is a wiring stub, not a working
   integration — the legacy app's `firebase-messaging-sw.js` /
   `OneSignalSDKWorker.js` service workers were not ported. Order-alert
   push notifications will not fire until this is finished.

## What's implemented

| Area | Status |
|---|---|
| Supabase clients (browser/server/middleware), session refresh | Done |
| Route protection (`middleware.ts` + `getUserContext()`) | Done |
| Login, Register, Verify email, Forgot/Reset password | Done — real Supabase Auth calls, original validation rules preserved |
| Onboarding (4-step wizard + success screen) | Done — writes the `lojas` row, slug-from-name preserved |
| Dashboard home (stats + live pending orders) | Done — realtime scoped to `loja_id` (see architecture doc §6.3 fix) |
| Products (list, create, edit, toggle active, delete) | Done — photo upload, tag-based size/color variants |
| Orders (list with status filters, detail, status transitions, realtime) | Done |
| Store settings (name, description, contacts, social links, visible sections) | Done — core fields from `editar-loja.js`; not every legacy field (e.g. per-policy `observacoes` notes) has a form control yet |
| Profile, Security (password change) | Done |
| PWA manifest | Done via `app/manifest.ts` (icons still needed, see above) |
| Push notifications | Stubbed, not wired |
| Admin panel | Not migrated — out of Phase 1 scope per the architecture doc |

## What's simplified vs. the legacy app

The legacy `criar-produto.js` is 1,884 lines covering a lot of
micro-interaction polish (drag-reorder photos, per-field inline
validation animations, etc.) beyond the core data it collects. This
migration preserves every **field and business rule** (variants,
promo pricing, category, photo storage) but re-implements the
interaction layer more simply as a first pass — polish items (drag
reordering, richer validation states) are natural follow-ups once this
is confirmed working end-to-end against a real Supabase project.

## Verifying

```bash
npm run build   # production build — passes in an environment with
                 # network access to fonts.googleapis.com (this sandbox
                 # doesn't have that; see note in build output if you
                 # hit a font-fetch error, it's network-only, not a code issue)
npx tsc --noEmit  # typecheck only, no network required — currently clean
```
