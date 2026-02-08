# Project Overview

## Purpose
Exam paper study platform for Irish Leaving Certificate subjects. Provides searchable question banks with marking schemes, topic-based filtering, and user progress tracking.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI**: React 19, Radix UI primitives, Tailwind CSS 4, Motion animations
- **State**: TanStack Query for server state, React Context for auth
- **Monitoring**: Vercel Analytics & Speed Insights

- 'normal' refers to standard exam questions so 'normal sidebar' is for the sidebar one the page that shows these questions. 

### Backend
- **supabase mcp**: Always use supabase mcp for researching and exploring backend. Project id is ayzduhnlqbzlhrumyzue.
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email verification)
- **Storage**: Supabase Storage (question/marking scheme images)
- **Payments**: Stripe (subscriptions, invoices, free credits system)
- **Email**: Resend
- **API**: Server Actions + RPC functions

## Architecture

### Data Model
- **Subjects**: Hierarchical (Higher/Ordinary/Foundation levels)
- **Questions**: Year, paper number, question number, parts, exam type (normal/deferred/supplemental)
- **Topics**: Grouped topics per subject for filtering
- **User Profiles**: Subject selections, personalized dashboard
- **Subscriptions**: Stripe-backed subscription state tracking
- **Grinds**: Tutoring session bookings
- **Images**: CDN-served with width/height metadata, lazy loading tracking
- **Word Coordinates**: OCR data for text search within question images
- **Audio Questions/Topics**: Separate tables for audio content (`audio_questions`, `audio_topics`, `audio_question_topics`)
- **Question Reports**: User-reported issues with admin statistics
- **Audit Logs**: Change tracking for questions
- **Transcripts**: Word-level timing data for audio sync

### Frontend Patterns
- **Dashboard Bootstrap**: `getDashboardBootstrap` for centralized server-side data loading
- **React Query Hydration**: `HydrationBoundary` for SSR prefetch
- **Filter & Navigation Providers**: URL-based filter state management
- **Sidebar Architecture**: Separate normal/audio implementations with mobile/desktop support

### Backend Features
- **Pagination**: Cursor-based with RPC functions (`normal_search_questions_paginated`)
- **Search**: Multi-field filtering (years, topics, exam types, question numbers, text search)
- **Query Optimization**: Postgres functions for efficient joins and filtering
- **Subscription Billing**: Stripe integration with free credits system
- **Admin**: Report system for question issues
- **Email Templates**: React Email via Resend (grinds confirmation, reminders, contact notifications)
- **Grinds Config**: `GRINDS_ARE_FREE` flag in `/lib/config/grinds`
- **Audio Player**: Synchronized transcript following with word-level timing

### Key Pages
- Landing with feature showcase
- Auth flow (signup / signin / verify / callback)
- Onboarding (subject selection)
- Dashboard home
- Study view (`/dashboard/study`)
- Grinds (`/dashboard/grinds`) — subscription-based tutoring
- Listening Practice (`/dashboard/listening`) — audio exam questions
- Points Calculator (`/dashboard/points`) — CAO points tool
- Timetable (`/dashboard/timetable`) — exam timetable with ICS calendar downloads
- Settings (with billing)
- Ultra landing (`/ultra`) — subscription marketing page
- Contact (`/contact`) — contact form
- Admin reports
- Subject pages with filtered question lists
- Audio subject pages (`/audio/[slug]`) — per-subject audio question browsing

## Development Notes
- Server components by default, client components marked explicitly
- Image optimization with Next.js Image component + custom loader
- Type-safe Supabase client (SSR-aware with cookies)
- React Query for prefetching and caching
- Never start the dev server yourself. I will perform all verification manually
