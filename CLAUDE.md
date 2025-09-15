# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint with ESLint and Next.js rules
```

### Environment Setup
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
- Supabase project should have the database schema with tables: subjects, topics, questions, question_topics, user_profiles, user_subjects
- Database functions: search_questions_paginated, get_available_years

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router, React 19, TypeScript 5
- **Database**: Supabase with PostgreSQL, Row Level Security (RLS)
- **State Management**: TanStack Query v5 for server state, URL state for filters
- **UI Components**: shadcn/ui with Radix UI primitives, Tailwind CSS v4
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Custom warm color palette design system

### Project Structure
```
src/
   app/                    # Next.js App Router pages
      auth/              # Authentication pages and actions
      dashboard/         # Protected dashboard pages
      subject/[slug]/    # Dynamic subject pages
      onboarding/        # User onboarding flow
   components/
      ui/               # shadcn/ui components
      layout/           # Navigation, sidebars, headers
      auth/             # Authentication forms
      filters/          # Question filtering system
      questions/        # Question display components
      onboarding/       # User setup components
      landing/          # Landing page sections
      providers/        # React context providers
   lib/
      supabase/         # Database client and queries
      types/            # TypeScript definitions
      hooks/            # Custom React hooks
      utils/            # Utility functions
      auth/             # Authentication utilities
      cache/            # Cache management
      config/           # Configuration files
      queries/          # Query key factories
   middleware.ts         # Auth middleware for route protection
```

## Key Architectural Patterns

### Database Integration
- **Server Queries**: Use `src/lib/supabase/queries.ts` for server-side operations with retry logic
- **Client Queries**: Use `src/lib/supabase/client-queries.ts` for client-side TanStack Query integration
- **Query Builders**: Centralized query parameter building in `src/lib/supabase/query-builders.ts`
- **Type Safety**: Generated types in `src/lib/types/database.ts` from Supabase schema

### Authentication Architecture
- **SSR Support**: Server-side session initialization in layout.tsx:34
- **Client Management**: Separate Supabase clients for server (`server.ts`) and browser (`client.ts`)
- **Middleware Protection**: Route-level authentication in `middleware.ts`
- **User Profile System**: Automatic profile creation and management

### State Management Patterns
- **Query Client Isolation**: Per-user QueryClient instances to prevent cache leakage (providers.tsx:42)
- **URL State**: Filter state persisted in URL parameters using `useFilterUpdates` hook
- **Optimistic Updates**: TanStack Query for server state with caching strategies
- **Session Management**: AuthProvider with session state synchronization

### Component Architecture
- **shadcn/ui Integration**: Pre-configured components in `components.json` with custom aliases
- **Design System**: Custom color palette with warm tones (tailwind.config.ts:62-129)
- **Responsive Design**: Mobile-first with sidebar collapse patterns
- **Accessibility**: ARIA labels and semantic HTML throughout

## Core Features

### Question Filtering System
- Advanced filtering by year, topic, question number, and exam type
- Real-time search with debouncing
- URL state persistence for shareable filtered views
- Server-side pagination with cursor-based navigation

### User Management
- OAuth and email authentication flows
- User profile completion during onboarding
- Subject selection and management
- Admin role detection with `use-is-admin` hook

### Exam Paper Viewer
- Dynamic subject pages with slug-based routing
- Infinite scroll for question lists
- Image optimization for Supabase storage
- Responsive question card layout

## Important Implementation Details

### Database Queries
- All queries include retry logic with exponential backoff
- Error handling with custom `QueryError` class
- Abort signal support for request cancellation
- Typed query parameters and responses

### Performance Optimizations
- Turbopack for fast development builds
- Image optimization with Next.js Image component
- Query result caching with TanStack Query
- Code splitting at route level

### Security Considerations
- RLS policies enforced at database level
- Environment variable validation
- CSRF protection via Supabase Auth
- User session isolation in query cache

### Custom Hooks
- `useFilterUpdates`: URL state management for filters
- `useUserProfile`: User profile data with caching
- `useUserSubjects`: User's selected subjects
- `useTopics`: Subject topics with hierarchical structure
- `useIsAdmin`: Admin role detection

## Design System

### Color Palette (Warm Theme)
- **Backgrounds**: Cream tones (cream-50 to cream-300)
- **Accents**: Salmon and coral for interactive elements
- **Text**: Warm grays for better readability
- **Interactive**: Sky blue for contrast and CTA elements

### Typography
- **Serif**: Source Serif 4 for headings and emphasis
- **Sans**: Source Sans 3 for body text and UI
- **Mono**: JetBrains Mono for code elements

### Component Conventions
- Consistent padding and spacing using Tailwind utilities
- Hover states with color and opacity transitions
- Focus states for accessibility compliance
- Loading skeletons for better UX during data fetching

## Development Guidelines

### Code Patterns
- Server Actions for form handling and mutations
- Client Components only when necessary for interactivity
- TypeScript strict mode with proper type annotations
- Error boundaries for graceful error handling

### File Naming
- kebab-case for components and files
- PascalCase for component exports
- camelCase for functions and variables
- SCREAMING_SNAKE_CASE for constants

### Import Conventions
- Absolute imports using @ alias for src directory
- Group imports: React, Next.js, third-party, local
- Type-only imports where applicable
- Consistent import ordering

## Testing Considerations
- No test framework currently configured
- Consider Jest + React Testing Library for unit tests
- Playwright for E2E testing (browser automation available)
- Database testing with Supabase local development

## Deployment Notes
- Built for Vercel deployment with Next.js optimizations
- Environment variables required for Supabase connection
- Image optimization configured for Supabase storage
- Static generation where possible for performance


# NEVER STARTS THE DEV SERVER YOURSELF OR TRY AND OPEN THE WEBSITE. NEVER KILL WEBSITE SERVERS YOURSELF.
# Never run npm run dev, i will always do it.