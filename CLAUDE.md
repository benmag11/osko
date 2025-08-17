# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack (fast refresh)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Start production server
npm start

# Type checking
npx tsc --noEmit
```

The project uses Tailwind CSS v4 with the new configuration format in `tailwind.config.ts`.


## Architecture Overview

This is a Next.js 15 application for browsing and studying past exam papers, built with:
- **Framework**: Next.js 15.4.6 with App Router and React Server Components
- **Database**: Supabase (PostgreSQL with RPC functions)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query v5 for server state
- **Type Safety**: TypeScript with strict mode enabled

### Key Architectural Patterns

1. **Server Components by Default**: Pages and layouts use React Server Components for better performance. Client components are marked with 'use client' directive only when needed for interactivity.

2. **Data Fetching Strategy**:
   - Server actions in `src/lib/supabase/queries.ts` handle all database operations
   - Implements retry logic with exponential backoff for resilience
   - Uses RPC functions for complex queries (e.g., `search_questions_paginated`)
   - In-memory caching layer for frequently accessed data (e.g., available years with 5-minute TTL)
   - All queries wrapped in `withRetry` helper for automatic retry on failure

3. **Component Organization**:
   - `/components/ui/`: Reusable shadcn/ui components (button, checkbox, dialog, etc.)
   - `/components/filters/`: Filter-specific components (search, year, topic, collapsible)
   - `/components/layout/`: Layout components (exam-sidebar, nav-user, subject-switcher)
   - `/components/questions/`: Question display components (question-card, question-list)
   - `/components/landing/`: Landing page specific components (hero-section, cta-section, typewriter-word)
   - `/components/providers/`: React Query provider setup with SSR support
   - `/components/kokonutui/`: Custom UI components library (e.g., type-writer)

4. **Type System**:
   - Database types defined in `src/lib/types/database.ts`
   - Strict TypeScript configuration with path aliases (@/*)
   - Full type safety from database to UI
   - Comprehensive interface definitions for all database entities

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── subject/[slug]/    # Dynamic subject pages with not-found handling
│   └── layout.tsx         # Root layout with Providers wrapper
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── filters/          # Filter components with URL state sync
│   ├── layout/           # Layout and navigation components
│   ├── questions/        # Question display with infinite scroll
│   ├── landing/          # Landing page components
│   └── providers/        # QueryClient provider with SSR support
└── lib/                  # Core utilities
    ├── supabase/         # Database client (server/client variants)
    ├── hooks/            # Custom hooks (useQuestionsQuery, useFilterUpdates)
    ├── types/            # TypeScript type definitions
    └── utils/            # Helper functions (slug generation, URL filters)
```

## Database Schema

Main tables:
- `subjects`: Exam subjects with name, level (Higher/Ordinary/Foundation), display_order
- `topics`: Topics within subjects with display_order
- `questions`: Exam questions with year, paper_number, question_number, exam_type (normal/deferred/supplemental)
- `question_topics`: Many-to-many relationship between questions and topics

Key RPC functions:
- `search_questions_paginated`: Cursor-based pagination with multi-filter support
- `get_available_years`: Returns distinct years for a subject

## shadcn/ui Components

The project uses shadcn/ui components configured in `components.json`:
- Base color: slate
- CSS variables enabled
- Components installed: avatar, badge, button, checkbox, collapsible, dropdown-menu, input, separator, sheet, sidebar, skeleton, tooltip

To add new components:
```bash
npx shadcn@latest add [component-name]
```

## Error Handling

The application implements comprehensive error handling:
- Custom `QueryError` class for structured error information
- Retry logic with exponential backoff (max 2 retries)
- Graceful degradation with cached data fallback
- 4xx errors not retried (client errors)
- Stale cache used when fresh data unavailable

## Performance Optimizations

- Turbopack for fast development builds
- TanStack Query with 1-minute stale time, 10-minute cache time
- Server-side rendering for initial page loads
- Cursor-based pagination for efficient large dataset handling
- Debounced search inputs with `use-debounce` hook
- Request deduplication via React Query
- AbortSignal support for cancelled requests


## Authentication

The application uses Supabase Auth for user authentication with the following features:

### Auth Flow
1. **Sign Up** (`/auth/signup`): 
   - Email/password registration with email confirmation
   - Google OAuth authentication
   - Redirects to confirmation page after signup
   - Email verification required before access

2. **Sign In** (`/auth/signin`):
   - Email/password authentication
   - Google OAuth authentication
   - Redirects to `/subjects` after successful login

3. **Auth Callback** (`/auth/callback`):
   - Handles OAuth and magic link callbacks
   - Exchanges auth code for session
   - Checks onboarding status and redirects accordingly

### Middleware Protection
The `middleware.ts` file enforces authentication and onboarding flow:
- Protected routes: `/subjects`, `/subject/*` require authentication
- Unauthenticated users redirected to `/auth/signin`
- Authenticated users redirected away from auth pages
- Onboarding flow enforced via `user_profiles.onboarding_completed` check
- Users without completed onboarding redirected to `/onboarding`

### Server Actions
Authentication server actions in `src/app/auth/actions.ts`:
- `signUp()`: Creates new account with email verification
- `signIn()`: Authenticates existing users
- `signOut()`: Clears session and redirects to home
- `getUser()`: Returns current authenticated user

### Components
- `SignUpForm`: Client component with form validation and error handling
- `LoginForm`: Client component with form validation and error handling
- Both forms use `useFormStatus` for loading states

## Key Dependencies

- **motion**: Animation library (v12) used for UI components like TypewriterWord
- **@tanstack/react-query**: Server state management with built-in caching
- **@supabase/supabase-js**: Database client for PostgreSQL operations
- **lucide-react**: Icon library used throughout the application
- **use-debounce**: Hook for debouncing user inputs in search/filters

## Landing Page Architecture

The landing page (`/`) consists of modular components:
- **LandingNavigation**: Header with logo and auth links
- **HeroSection**: Main headline with value proposition
- **ExamShowcase**: Visual preview of the exam interface
- **CTASection**: Call-to-action with animated typewriter effect cycling through "keyword", "topic", "year"

## Custom Components

### TypewriterWord (`/components/landing/typewriter-word.tsx`)
A custom typewriter animation component that:
- Cycles through text sequences with typing/deleting animations
- Maintains layout stability with fixed container heights
- Configurable typing speed, delays, and loop behavior
- Used in the CTA section for engagement
- Update about this utility function and update the file strucute