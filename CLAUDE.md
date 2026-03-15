# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Exam paper study platform for Irish Leaving Certificate subjects ("Uncooked"). Searchable question banks with marking schemes, topic-based filtering, audio listening practice, and user progress tracking.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) — do NOT run this yourself
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is configured. The user performs all verification manually.

## Backend

- **Supabase MCP**: Always use supabase MCP for researching and exploring the database. Project ID: `ayzduhnlqbzlhrumyzue`
- **Database**: Supabase (PostgreSQL) with RPC functions for complex queries
- **Auth**: Supabase Auth (email verification + OAuth)
- **Storage**: Supabase Storage (question/marking scheme images with CDN transforms)
- **Payments**: Stripe (subscriptions, invoices, free credits system)
- **Email**: Resend (React Email templates)
- **Edge Functions**: `supabase/functions/` — Deno runtime, excluded from tsconfig

## Architecture

### Provider Chain

`RootLayout` (server) → `Providers` (client) → `QueryClientProvider` → `AuthProvider`

- **Root layout** (`src/app/layout.tsx`): Server-side prefetch of session, profile, user subjects → dehydrated into React Query
- **Providers** (`src/components/providers/providers.tsx`): Per-user QueryClient instances with cleanup on user change
- **AuthProvider** (`src/components/providers/auth-provider.tsx`): Manages session, profile, `subscriptionState` discriminated union, `hasActiveSubscription` check

### Dashboard Data Flow

`DashboardLayout` → `getDashboardBootstrap()` → `DashboardDataProvider`

The `getDashboardBootstrap` function (`src/lib/supabase/dashboard-bootstrap.ts`) is a React `cache()`-wrapped server function that fetches session, profile, user subjects, all subjects, and admin status in a single parallel batch.

### Terminology

- **"normal"** = standard exam questions (as opposed to audio). "Normal sidebar", "normal questions", etc.
- **"grinds"** = tutoring sessions (Irish term)

### Supabase Clients

- **Server**: `createServerSupabaseClient()` from `src/lib/supabase/server.ts` — cookie-based, async
- **Client**: `createClient()` from `src/lib/supabase/client.ts` — browser client
- **Admin**: `src/lib/supabase/admin.ts` — service role client

### Filter System

Filters are URL-state driven: `useUrlFilters` hook → `FilterProvider` context → URL search params as source of truth. No dual state — URL is the single source.

### Pagination

Cursor-based via Supabase RPC functions (e.g., `normal_search_questions_paginated`). React Query `useInfiniteQuery` on the client.

### Image Pipeline

Supabase Storage → custom `supabaseLoader` (`src/lib/supabase/image-loader.ts`) → Supabase Image Transformations endpoint with resize/quality params. All question/marking scheme images use `TrackedImage` component for lazy loading metrics.

### Query Keys

Centralized in `src/lib/queries/query-keys.ts`. Public data keys (subjects, topics, questions) and user-scoped keys (`queryKeys.user.profile(userId)`, etc.). Audio queries have separate keys in `audio-query-keys.ts`.

### Subscription State

`SubscriptionState` discriminated union type in `src/lib/types/database.ts`, computed in `auth-provider.tsx`. States: `loading | active | canceling | trialing | past_due | expired | free_credits | no_access`. `hasActiveSubscription` includes `active`, `past_due`, and `trialing` — must stay aligned between client (`auth-provider.tsx`) and server (`grind-actions.ts`).

### Server Actions

Located in `src/lib/supabase/` (e.g., `grind-actions.ts`, `report-actions.ts`, `admin-actions.ts`) and `src/lib/stripe/subscription-actions.ts`. All marked `'use server'`.

### Sidebar Architecture

Two separate sidebar implementations — `src/components/sidebar/normal/` and `src/components/sidebar/audio/` — sharing core components from `src/components/sidebar/core/`. Dashboard has its own sidebar in `src/components/dashboard-sidebar/`.

### Key Pages

- `/subject/[slug]` — question browser with sidebar filters
- `/audio/[slug]` — audio question browser
- `/dashboard/study` — study view
- `/dashboard/listening` — audio practice
- `/dashboard/grinds` — tutoring sessions
- `/dashboard/points` — CAO points calculator
- `/dashboard/timetable` — exam timetable with ICS downloads
- `/dashboard/settings` — account settings + billing
- `/dashboard/(admin)/reports` — admin report management
- `/ultra` — subscription marketing page
- Auth flow: `/auth/signup`, `/auth/signin`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`

## Conventions

- Server components by default; `'use client'` only when needed
- Path alias: `@/*` → `./src/*`
- Fonts: Source Serif 4 (serif), Source Sans 3 (sans), Crimson Pro (display) via CSS variables
- UI primitives: Radix UI + shadcn/ui pattern in `src/components/ui/`
- Animations: `motion` library (Framer Motion successor)
- Toasts: Sonner via `src/lib/toast.tsx`
- Date formatting: Centralized in `src/lib/utils/format-date.ts` (en-IE locale)
- Config: `GRINDS_ARE_FREE` flag in `src/lib/config/grinds.ts`
- Cache config: `src/lib/config/cache.ts` — tiered stale/gc times for static, user, dynamic data

## Development Notes

- Never start the dev server yourself. The user will perform all verification manually.
- `isProfileLoading` must start as `true` to prevent defaulted values from rendering incorrect UI on first frame
- Stripe API version `2026-01-28.clover` — `current_period_end` is on `SubscriptionItem` not `Subscription`
- PostgreSQL `CREATE OR REPLACE FUNCTION` only replaces if param names, types, AND order match exactly
- RPC functions build JSON with `jsonb_build_object` — new columns must be added to SELECT, GROUP BY, and the jsonb builder
