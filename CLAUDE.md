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
- **API**: Server Actions + RPC functions

## Architecture

### Data Model
- **Subjects**: Hierarchical (Higher/Ordinary/Foundation levels)
- **Questions**: Year, paper number, question number, parts, exam type (normal/deferred/supplemental)
- **Topics**: Grouped topics per subject for filtering
- **User Profiles**: Subject selections, personalized dashboard
- **Images**: CDN-served with width/height metadata, lazy loading tracking
- **Word Coordinates**: OCR data for text search within question images

### Backend Features
- **Pagination**: Cursor-based with RPC functions (`normal_search_questions_paginated`)
- **Search**: Multi-field filtering (years, topics, exam types, question numbers, text search)
- **Query Optimization**: Postgres functions for efficient joins and filtering
- **Admin**: Report system for question issues

### Key Pages
- Landing with feature showcase
- Auth flow (signup/signin/verify/onboarding)
- Dashboard (study view, settings, admin reports)
- Subject pages with filtered question lists

## Development Notes
- Server components by default, client components marked explicitly
- Image optimization with Next.js Image component + custom loader
- Type-safe Supabase client (SSR-aware with cookies)
- React Query for prefetching and caching
- Never start the dev server yourself. I will perform all verification manually
