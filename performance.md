# Dashboard Instant Load Refactor Plan

## 0. Objectives & Guardrails
- Deliver nav-to-content paint under 120 ms for repeat dashboard clicks and under 250 ms for first hit on cold cache. Measure using custom nav marks and Web Vitals LCP/FID deltas.
- Preserve 100 % of existing dashboard functionality: profile edits (`src/app/dashboard/settings/components/name-section.tsx`), subject updates, admin reports, and sign-out flows must succeed post-refactor.
- Reuse existing abstractions whenever possible (`queryKeys`, `invalidateUserCache`, Supabase query helpers). Only create new modules when no equivalent exists.
- View transitions must never show blank chrome: every navigation keeps populated UI using cached data or streamed fallbacks; skeletons appear only where data genuinely streams for the first time.
- Align with security constraints already documented in `docs/15-core-architecture.md` (user-scoped caches, RLS) and the Supabase contract in `docs/02-database-supabase.md`.

## 1. Key Findings From Current Codebase Review
- `useUserProfile` (`src/lib/hooks/use-user-profile.ts:24-115`) spins up its own auth listener, re-fetches the session, and hits `user_profiles` on every mount despite `AuthProvider` already managing the session. This duplication adds ~2 Supabase calls per navigation and causes flicker while the hook settles.
- `clearAllCache` (`src/lib/cache/cache-utils.ts:29-43`) wipes the cache and permanently rewrites default `staleTime`/`gcTime` to zero, so every subsequent query becomes an immediate network trip. This defeats the "warm cache" requirement for instant navs.
- Dashboard server pages (`src/app/dashboard/study/page.tsx:11-55`, `src/app/dashboard/settings/page.tsx:11-60`) repeatedly fetch the same profile + subject data that client components fetch again after hydration. Because the App Router layout isn’t seeding a query cache, every navigation executes the same Supabase round-trips.
- `AuthProvider` (`src/components/providers/auth-provider.tsx:24-151`) exposes only `{ user, session, isLoading }`; profile consumers (`NavUser`, `useIsAdmin`) are forced back to Supabase rather than reusing the provider’s knowledge.
- No shared server-side cache exists for per-request resources. Each RSC call creates a new Supabase client, so even intra-request composition doesn’t benefit from memoisation (`docs/02-database-supabase.md` notes existing `cache` usage elsewhere that we can mirror).
- Route links rely solely on default prefetch. Because data isn’t hydrated and most routes are forced dynamic, the router must wait for fresh RSC payloads, producing the visible blank state we’re trying to eliminate.

## 2. Core Strategy — Keep the Dashboard Shell Warm
Like Vercel’s dashboard, we’ll maintain a hot shell that always has the last known state ready to paint, then stream deltas in the background. That requires three pillars: (a) one canonical auth/profile source of truth, (b) hydrated, user-scoped caches that survive navigation, and (c) eager prefetching of the slow bits the moment intent is detected.

### 2.1 Single Source of Truth for Session & Profile Data
1. **Extend `AuthContext`** (`src/components/providers/auth-provider.tsx`) to expose `{ user, session, profile, profileError, isProfileLoading, refetchProfile }`.
   - Add an internal `fetchProfile(userId, signal)` helper that: uses `createClient`, selects only the columns the UI consumes, respects an `AbortController`, and caches the in-flight promise to avoid duplicate calls during rapid auth events.
   - Run `fetchProfile` when `SIGNED_IN`, `TOKEN_REFRESHED`, or `USER_UPDATED` fire. On `SIGNED_OUT`, clear the profile from context along with user/session.
2. **Refactor `useUserProfile`** (`src/lib/hooks/use-user-profile.ts`): replace Supabase queries with a thin `useAuth()` read. Continue returning the `{ user, profile, isLoading, error }` signature so downstream hooks stay intact. If the profile is null but a `refetchProfile` function exists, expose it so components like `NameSection` can trigger a refresh after mutations.
3. **Update dependent hooks/components**:
   - `useIsAdmin` (`src/lib/hooks/use-is-admin.ts`) should read `profile?.is_admin` from context; remove the query import.
   - `NavUser` (`src/components/layout/nav-user.tsx`) should rely on context data and call `refetchProfile` when a mutation succeeds instead of invalidating queries manually.
   - Settings dialogs (`name-section.tsx`, `change-email-dialog.tsx`) should request `refetchProfile` on success to keep the cached context in sync; retire redundant `queryClient.invalidateQueries` now that profile is centrally managed.
4. **Align server-side auth**: ensure the root layout (`src/app/layout.tsx`) still passes `initialSession` to `<Providers>` so AuthProvider starts with the SSR session and avoids a flash of loading.

### 2.2 React Query Lifecycle & Hydration
1. **Repair cache clearing utilities**:
   - Replace the `setDefaultOptions({ queries: { staleTime: 0, gcTime: 0 } })` call inside `clearAllCache` with logic that restores the canonical `QUERY_CONFIG` (`src/lib/config/cache.ts`). Store the original defaults on module init so they can be reinstated after each clear.
   - Keep `invalidateUserCache` intact for targeted resets; use it instead of full clears for `USER_UPDATED` events.
2. **Hydrate user-scoped queries at the layout layer**:
   - In `src/app/layout.tsx`, create a server-side QueryClient, prefetch the canonical user queries (`queryKeys.user.profile(user.id)`, `queryKeys.user.subjects(user.id)`), and wrap the subtree in `<HydrationBoundary state={dehydrate(queryClient)}>` before rendering `<Providers>`. This ensures client hooks open with warm caches.
   - Pass the dehydrated state into Providers via a prop (e.g. `initialQueryState`) and call `useHydrate` (from `@tanstack/react-query`) inside `Providers` so the client QueryClient matches the server state.
3. **Standardise query behaviours**:
   - Audit hooks under `src/lib/hooks` and disable `refetchOnMount`/`refetchOnWindowFocus` for user-scoped data. Use `CACHE_TIMES`’ stale/gc windows so cached data remains valid during quick navs, mirroring Vercel’s background revalidation pattern.
   - Where server components already load data (e.g. `SettingsPage`), ensure their client children use `initialData`/`placeholderData` that mirrors the hydrated cache so they render synchronously.

### 2.3 Dashboard Bootstrap Loader & Server Memoisation
1. **Introduce `getDashboardBootstrap`** (new module `src/lib/supabase/dashboard-bootstrap.ts`): a `cache(async () => …)` function that gathers, in parallel:
   - Session & profile (reusing the same column set as Section 2.1).
   - User subjects (`getUserSubjects`), all subjects (`getAllSubjects`), admin flag (`getCachedAdminStatus` already described in `docs/02-database-supabase.md`), and any lightweight dashboard metadata required on initial render.
   - This function must reuse existing query helpers rather than duplicating SQL.
2. **Consume bootstrap data in the dashboard layout** (`src/app/dashboard/layout.tsx`):
   - Await `getDashboardBootstrap` once and pass the payload to new providers (`<DashboardDataProvider>` client component) that simply writes the data into React Query using `queryClient.setQueryData` so the caches are hot before any page renders.
   - Because the App Router caches parent layouts by default, subsequent navigations reuse this hydrated shell, giving instant paints similar to Vercel’s persistent app chrome.
3. **Expose a `prefetchDashboardData` helper** that can be called from `AppSidebar` (on `useEffect` mount) to warm the caches client-side whenever the bootstrap payload is missing (e.g. after a hard refresh on a secondary route).

### 2.4 Route-Specific Instant Navigation Adjustments
- **Study (`src/app/dashboard/study/page.tsx`)**: drop the extra Supabase requests. Instead, read subjects from the bootstrap context; only hit Supabase if the cache is empty (e.g. first-time load on a new session). Remove `export const dynamic = 'force-dynamic'` unless a cookie mutation forces it—Next’s partial prerendering can still access auth cookies when `cookies()` is used inside the cached bootstrap helper. The client `StudyPageClient` should receive subjects via props and rely on the hydrated query to stay up-to-date.
- **Settings (`src/app/dashboard/settings/page.tsx`)**: feed `userEmail`, `userName`, `allSubjects`, and `userSubjects` directly from the bootstrap payload. Wrap the client component in a `HydrationBoundary` so React Query’s `queryKeys.user.subjects` stays aligned. Form submissions continue using the existing server actions; on success, call `refetchProfile` and `queryClient.invalidateQueries({ queryKey: queryKeys.user.subjects(user.id) })` so the cached dashboard shell re-renders instantly.
- **Reports (`src/app/dashboard/(admin)/reports/page.tsx`)**: run `prefetchQuery(['reports','all'])` and `prefetchQuery(['report-statistics'])` server-side when the bootstrap indicates `is_admin`. `ReportsClient` will then lift initial data from cache and avoid the loading spinner when navigating in.
- **Statistics/About**: mark these as static segments when possible (`export const dynamic = 'error'`) so the router can stream instantly from cached HTML. They don’t require Supabase data, so ensure the components render synchronously without waiting on hooks.

### 2.5 Mutation & Invalidation Strategy
- **Name changes**: After `updateUserName`, call the context `refetchProfile` and optimistically `setProfile` in `AuthProvider` so `NavUser` updates without waiting. Maintain the existing revalidation via `revalidatePath` for SSR correctness.
- **Subject updates**: On success, issue `queryClient.setQueryData(queryKeys.user.subjects(user.id), newSubjects)` inside `SubjectSection` before calling `refetchProfile`. Reuse `invalidateUserCache` only if the mutation changes multiple user-scoped queries.
- **Email/Password flows**: Continue to rely on Supabase session refresh. Once a new session arrives, AuthProvider will fetch the new profile and propagate changes automatically.
- **Admin report status changes**: Use `queryClient.invalidateQueries({ queryKey: ['reports'] })` followed by a lightweight `prefetchQuery` so the table repaints without an intermediate empty state.

### 2.6 Navigation Experience Enhancements
- Keep default `<Link prefetch />` behaviour but add intent-based prefetch in `AppSidebar`: on pointer enter (desktop) or focus (keyboard), call a debounced `prefetchDashboardData(segment)` that kicks off the relevant React Query prefetches. This mirrors Vercel’s strategy of fetching payloads when intent is likely rather than on click.
- Leverage Next.js 15 router cache: avoid calling `router.refresh()` on dashboard routes; let the cached layout persist. For client transitions (`useTransition`), start transitions only for operations that actually mutate data.
- Investigate enabling View Transitions (`app/layout.tsx` opt-in) once the data layer is stable; this preserves existing DOM for even smoother transitions without requiring skeletons.

### 2.7 Observability & Safeguards
- Instrument navigation timing with a custom hook (`src/lib/metrics/use-navigation-metrics.ts`) that wraps `router.push` and records `performance.mark` / `performance.measure`. Log to `console.debug` initially; wire to the existing telemetry endpoint when ready.
- Add server logs around `getDashboardBootstrap` to surface cache hit/miss ratios, and count Supabase round-trips so we can confirm the reduction.
- Extend E2E coverage (Playwright or Cypress) to assert that navigating between Study ↔ Settings ↔ Reports never shows an empty main area and that the DOM is populated within the target thresholds.

### 2.8 Implementation Order & Testing Checklist
1. **Cache utilities + AuthProvider refactor** (Sections 2.1 & 2.2): ship with unit tests for `clearAllCache` and integration tests ensuring `useUserProfile` renders without flashing.
2. **Bootstrap loader and layout hydration** (Section 2.3): add server-side tests verifying `getDashboardBootstrap` reuses cached results within a request and respects auth failures.
3. **Route migrations (Study, Settings, Reports)** (Section 2.4): migrate one route at a time, attach Storybook/visual tests if available to prove no regressions.
4. **Mutation wiring** (Section 2.5): confirm profile/subject edits update instantly; add Playwright steps exercising these flows.
5. **Prefetch & instrumentation** (Sections 2.6–2.7): enable intent-based prefetch and add navigation metrics; validate improvements with before/after profiling.
6. **Final regression sweep**: run lint/tests, QA all dashboard links, and confirm Supabase security policies remain untouched.

---
Implementing these steps preserves the strengths of the existing architecture (user-scoped QueryClients, robust Supabase actions) while aligning the dashboard experience with production-grade apps like Vercel’s: cached shells, background revalidation, and intentional prefetching that make navigation feel instant without peppering the UI with skeletons.
