# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


# Tone and Behavior

Criticism is welcome.
Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
Please tell me if there is a better approach than the one I am taking.
Please tell me if there is a relevant standard or convention that I appear to be unaware of.
Be skeptical.
Be concise.
Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
Occasional pleasantries are fine.
Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.


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
- The project uses Tailwind v4


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
   - `/components/landing/`: Landing page specific components
   - `/components/providers/`: React Query provider setup with SSR support

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


## Rules
- Before you do any work, MUST view files in claude/tasks/context_session_x md file to get the
full context (x being the id of the session we are operate, if file doesnt exist, then create
one )
- context_session_x-md should contain most of context of what we did, overall plan, and sub
agents will continusly add context to the file
- After you finish the work, MUST update the •claude/tasks/context_session_x.md file to make
sure others can get full context of what you did

### Sub agents
You have access to 1 sub agent:
- shadn-ui-builder: all task related to UI building & tweaking HAVE TO consult this agent
Sub agents will do research about the implementation, but you will do the actual implementation;
When passing task to sub agent, make sure you pass the context file, e.g. '.claude/tasks/
session_context_x.md',
After each sub agent finish the work, make sure you read the related documentation they created
to get full context of the plan before you start executing