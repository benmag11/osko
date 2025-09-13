# Codebase File Structure Overview

## Root Configuration Files
- package.json - Project dependencies and scripts
- tsconfig.json - TypeScript configuration
- tailwind.config.ts - Tailwind CSS configuration
- components.json - shadcn/ui components configuration
- middleware.ts - Next.js middleware for auth
- CLAUDE.md - AI assistant instructions

## Source Code Structure (src/)

### App Directory (src/app/)
- layout.tsx - Root layout with providers
- page.tsx - Landing page
- globals.css - Global styles
- error.tsx - Error boundary
- global-error.tsx - Global error handler

#### Authentication (src/app/auth/)
- actions.ts - Server actions for auth
- oauth-actions.ts - OAuth authentication actions
- callback/route.ts - Auth callback handler
- signin/page.tsx - Sign in page
- signup/page.tsx - Sign up page
- verify/page.tsx - Email verification page

#### Dashboard (src/app/dashboard/)
- layout.tsx - Dashboard layout wrapper
- page.tsx - Main dashboard page
- (admin)/layout.tsx - Admin layout wrapper
- (admin)/reports/page.tsx - Admin reports page
- (admin)/reports/reports-client.tsx - Reports client component
- about/page.tsx - About page
- about/components/ - About page components
- settings/page.tsx - Settings page
- settings/actions.ts - Settings server actions
- settings/settings-client.tsx - Settings client component
- settings/components/ - Settings components
- statistics/page.tsx - Statistics page
- study/page.tsx - Study page
- study/study-page-client.tsx - Study client component

#### Subject Pages (src/app/subject/)
- [slug]/page.tsx - Dynamic subject pages
- [slug]/not-found.tsx - Subject not found page

#### Onboarding (src/app/onboarding/)
- page.tsx - Onboarding page
- onboarding-client.tsx - Onboarding client component
- actions.ts - Onboarding server actions

### Components Directory (src/components/)

#### Admin Components (src/components/admin/)
- audit-history.tsx - Audit history display
- question-edit-modal.tsx - Question editing modal
- report-details-dialog.tsx - Report details dialog
- reports-table.tsx - Reports data table

#### Authentication Components (src/components/auth/)
- login-form.tsx - Login form component
- signup-form.tsx - Signup form component
- oauth-buttons.tsx - OAuth provider buttons
- otp-verification-form.tsx - OTP verification

#### Filter Components (src/components/filters/)
- applied-filters-display.tsx - Display applied filters
- clear-filters-button.tsx - Clear all filters button
- filter-tag.tsx - Individual filter tag
- question-filter-accordion.tsx - Question number filter
- search-filter.tsx - Search input filter
- topic-filter-accordion.tsx - Topic selection filter
- year-filter-accordion.tsx - Year selection filter

#### Landing Page Components (src/components/landing/)
- hero-section.tsx - Hero section
- navigation.tsx - Landing page navigation

#### Layout Components (src/components/layout/)
- app-sidebar.tsx - Main application sidebar
- dashboard-breadcrumb.tsx - Breadcrumb navigation
- dashboard-page.tsx - Dashboard page wrapper
- exam-sidebar.tsx - Exam viewing sidebar
- floating-sidebar-trigger.tsx - Mobile sidebar trigger
- mobile-navbar.tsx - Mobile navigation bar
- nav-filters.tsx - Navigation filters
- nav-user.tsx - User navigation menu
- subject-dropdown.tsx - Subject selection dropdown
- subject-switcher.tsx - Subject switcher component

#### Onboarding Components (src/components/onboarding/)
- name-step.tsx - Name input step
- progress-indicator.tsx - Progress indicator
- subject-selection-step.tsx - Subject selection step

#### Provider Components (src/components/providers/)
- auth-provider.tsx - Authentication context provider
- providers.tsx - All providers wrapper
- zoom-provider.tsx - Zoom context provider for question scaling

#### Question Components (src/components/questions/)
- filtered-questions-view.tsx - Filtered questions display
- question-card.tsx - Individual question card
- question-list.tsx - Question list container
- question-report-dialog.tsx - Report question dialog
- zoom-controls.tsx - Zoom control UI component

#### Settings Components (src/components/settings/)
- settings-section.tsx - Settings section wrapper

#### Subject Components (src/components/subjects/)
- selected-subject-card.tsx - Selected subject display
- subject-card.tsx - Subject selection card
- subject-selector.tsx - Subject selector component

#### UI Components (src/components/ui/)
- All shadcn/ui components (accordion, button, card, dialog, etc.)
- Custom UI components (sidebar, collapsible, etc.)

### Library Directory (src/lib/)

#### Authentication (src/lib/auth/)
- client-auth.ts - Client-side auth utilities

#### Cache Management (src/lib/cache/)
- cache-monitor.ts - Cache monitoring utilities
- cache-utils.ts - Cache utility functions

#### Configuration (src/lib/config/)
- cache.ts - Cache configuration

#### Custom Hooks (src/lib/hooks/)
- use-audit-history.ts - Audit history hook
- use-filter-updates.ts - Filter updates hook
- use-is-admin.ts - Admin detection hook
- use-mobile.ts - Mobile detection hook
- use-questions-query.ts - Questions query hook
- use-safe-timeout.ts - Safe timeout hook
- use-session-storage.ts - Session storage hook for persisting client state
- use-topics.ts - Topics data hook
- use-user-profile.ts - User profile hook
- use-user-subjects.ts - User subjects hook

#### Query Management (src/lib/queries/)
- query-keys.ts - TanStack Query key factory

#### Supabase Integration (src/lib/supabase/)
- client.ts - Supabase browser client
- server.ts - Supabase server client
- queries.ts - Server-side queries
- queries-client.ts - Client-side queries
- client-queries.ts - Client query functions
- query-builders.ts - Query parameter builders
- admin-actions.ts - Admin server actions
- admin-context.ts - Admin context utilities
- report-actions.ts - Report server actions

#### Type Definitions (src/lib/types/)
- database.ts - Database type definitions

#### Utility Functions (src/lib/utils/)
- utils.ts - General utilities
- form-validation.ts - Form validation utilities
- format-date.ts - Date formatting utilities
- format-name.ts - Name formatting utilities
- slug.ts - Slug generation utilities
- storage.ts - Storage utility functions for sessionStorage/localStorage
- subject-icons.ts - Subject icon mapping
- url-filters.ts - URL filter utilities

## Public Directory
- Static assets and public files

## Documentation (docs/)
- 01-authentication-system.md - Authentication system documentation
- 02-database-supabase.md - Database and Supabase integration
- 03-question-system.md - Question system architecture
- 04-subject-management.md - Subject management documentation
- 05-user-dashboard.md - User dashboard features
- 06-settings-profile.md - Settings and profile management
- 07-admin-features.md - Admin features and reports
- 08-onboarding-flow.md - User onboarding flow
- 09-ui-components.md - UI components documentation
- 10-layout-navigation.md - Layout and navigation system
- 11-landing-page.md - Landing page documentation
- 12-state-management-hooks.md - State management and hooks
- 13-caching-performance.md - Caching and performance
- 14-utilities-helpers.md - Utility functions and helpers
- 15-core-architecture.md - Core architecture overview
- FILE_TREE.md - This file - project structure overview