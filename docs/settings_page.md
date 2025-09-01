# Settings Page Documentation

## Overview
The Settings Page is a comprehensive user account management interface located at `/dashboard/settings` that allows authenticated users to modify their personal information, authentication credentials, and subject selections. The feature employs a modular architecture with separate sections for name, email, password, and subject management, each with its own dedicated component and state management logic.

## Architecture
The Settings Page follows a server-side rendering (SSR) pattern with client-side interactivity. The main page component (`page.tsx`) performs server-side data fetching for user profile and subjects, then passes this data to a client component (`settings-client.tsx`) that orchestrates the various interactive sections. Each section is self-contained with its own state management, validation, and server action integration.

Key architectural decisions:
- **SSR for Initial Data**: Reduces client-side fetching and improves performance
- **Server Actions**: Direct database mutations without API endpoints
- **Transactional Updates**: RPC functions ensure data consistency for subject updates
- **Optimistic UI Updates**: Immediate feedback with proper error rollback
- **Cache Invalidation**: Strategic cache updates to maintain UI consistency across the app

## File Structure
```
src/app/dashboard/settings/
├── page.tsx                          # Server component - fetches initial data
├── settings-client.tsx               # Client component - orchestrates sections
├── actions.ts                        # Server actions for all mutations
└── components/
    ├── name-section.tsx              # Name editing with inline save/cancel
    ├── email-section.tsx             # Email change trigger with dialog
    ├── change-email-dialog.tsx       # Multi-step email change with OTP
    ├── password-section.tsx          # Password change with dialog
    └── subject-section.tsx           # Subject selection with expand/collapse

Related files:
├── src/components/settings/settings-section.tsx    # Reusable section wrapper
├── src/components/subjects/subject-selector.tsx    # Subject selection UI
├── src/components/subjects/subject-card.tsx        # Individual subject cards
├── src/components/subjects/selected-subject-card.tsx # Selected subject display
├── src/lib/supabase/queries.ts                    # Database queries and RPC calls
├── src/lib/cache/cache-utils.ts                   # Cache management utilities
├── src/lib/queries/query-keys.ts                  # React Query cache keys
├── src/lib/hooks/use-user-profile.ts              # User profile hook
└── src/lib/types/database.ts                      # TypeScript type definitions
```

## Core Components

### Page Component (`page.tsx`)
Server component that handles initial data fetching and authentication:
```typescript
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Parallel fetch of profile and subjects
  const [allSubjects, userSubjectsData] = await Promise.all([
    getAllSubjects(),
    getUserSubjects(user.id)
  ])
  
  return <SettingsClient 
    userEmail={user.email}
    userName={profile?.name}
    allSubjects={allSubjects}
    userSubjects={userSubjects}
  />
}
```

### Settings Client (`settings-client.tsx`)
Client component that organizes sections using the SettingsSection wrapper:
```typescript
<SettingsSection title="Account">
  <div className="divide-y divide-stone-200">
    <NameSection initialName={userName} />
    <EmailSection currentEmail={userEmail} />
    <PasswordSection />
  </div>
</SettingsSection>
```

### Name Section (`name-section.tsx`)
Inline editing with immediate save/cancel functionality:
- **State Management**: Tracks original value, current value, and dirty state
- **UI Pattern**: Shows action buttons only when focused or changed
- **Cache Invalidation**: Updates user profile cache on successful save
- **Keyboard Support**: Enter to save, Escape to cancel

Key implementation:
```typescript
const handleSave = useCallback(async () => {
  const result = await updateUserName(name)
  if (!result.error) {
    originalName.current = name
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.user.profile(user.id) 
    })
  }
}, [name, queryClient, user?.id])
```

### Email Section with Change Dialog
Multi-step email change process with security verification:

**Step 1: Password Verification**
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: user.email!,
  password,
})
```

**Step 2: Email Entry and OTP Request**
```typescript
const { error } = await supabase.auth.updateUser({
  email: newEmail,
})
```

**Step 3: OTP Verification**
```typescript
const { error } = await supabase.auth.verifyOtp({
  email: newEmail,
  token,
  type: 'email_change',
})
```

### Password Section
Dialog-based password change with triple validation:
- Current password verification
- New password requirements (min 6 characters)
- Confirmation password matching

### Subject Section
Expandable subject management with transactional updates:
```typescript
const handleSave = useCallback(() => {
  startTransition(async () => {
    const result = await updateUserSubjects(selectedSubjectIds)
    if (!result.error) {
      setIsExpanded(false)
    }
  })
}, [selectedSubjectIds])
```

## Data Flow

### Subject Update Flow (Transactional)
1. User modifies subject selections in UI
2. Component calls `updateUserSubjects` server action
3. Server action invokes `saveUserSubjects` from queries
4. `saveUserSubjects` calls RPC function `update_user_subjects`
5. RPC function executes atomic transaction:
   - Deletes all existing user_subjects records
   - Inserts new subject selections
   - Returns success with count
6. Server action revalidates paths
7. UI updates with new subject list

### Name Update Flow
1. User edits name in input field
2. On save, `updateUserName` server action is called
3. Server validates input and updates `user_profiles` table
4. Cache is invalidated for user profile
5. Sidebar and other components automatically update

### Email Change Flow
1. Password verification through Supabase Auth
2. New email submission triggers OTP send
3. 6-digit OTP verification
4. Session refresh on success
5. Full cache invalidation to update email throughout app

## Key Functions and Hooks

### Server Actions (`actions.ts`)

**updateUserName**
- Validates name length (1-100 characters)
- Updates user_profiles table
- Revalidates settings path

**updateUserSubjects**
- Validates subject IDs array
- Calls saveUserSubjects with retry logic
- Revalidates multiple paths (settings, dashboard, study)

**requestEmailChange**
- Validates email format
- Verifies password
- Triggers Supabase email change flow

**verifyEmailChangeOtp**
- Validates 6-digit OTP
- Completes email change
- Returns flag for cache invalidation

### Database Functions

**RPC: update_user_subjects**
```sql
CREATE FUNCTION update_user_subjects(
  p_user_id uuid, 
  p_subject_ids uuid[]
) RETURNS jsonb
-- Transactional function that:
-- 1. Deletes all existing subjects
-- 2. Inserts new subjects
-- 3. Returns success with count
-- Automatically rolls back on error
```

**RPC: get_user_subjects_sorted**
```sql
CREATE FUNCTION get_user_subjects_sorted(
  p_user_id uuid
) RETURNS TABLE(...)
-- Returns user subjects with full subject data
-- Sorted by name ASC, level ASC
```

## Integration Points

### Cache Management
- **Query Keys**: User-scoped keys prevent data leakage between users
- **Invalidation Strategy**: Targeted invalidation for performance
- **Cache Times**: Configured in `CACHE_TIMES.USER_DATA`

### Authentication Integration
- Supabase Auth for password verification
- OTP-based email change flow
- Session management and refresh

### Database Integration
- Direct table updates for name changes
- RPC functions for complex operations
- Row Level Security (RLS) policies enforce access control

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key

### Cache Configuration
```typescript
CACHE_TIMES.USER_DATA = {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
}
```

## Type Definitions

### Core Types
```typescript
interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  created_at: string | null
}

interface UserSubjectWithSubject extends UserSubject {
  subject: Subject
}
```

## Implementation Details

### Inline Editing Pattern (Name Section)
The name section implements a sophisticated inline editing pattern:
1. **Focus Detection**: Tracks focus state to show/hide action buttons
2. **Dirty State**: Compares current value with original to enable save
3. **Blur Handling**: Preserves action buttons when clicking them
4. **Keyboard Shortcuts**: Enter saves, Escape cancels
5. **Loading States**: Disables input during save operation

### Multi-Step Dialog Pattern (Email Change)
The email change implements a wizard-like flow:
1. **Step Management**: State machine for navigation between steps
2. **Progress Indication**: Visual feedback for completed steps
3. **Error Recovery**: Per-step error handling with retry capability
4. **Auto-submission**: OTP submits automatically when 6 digits entered
5. **Cooldown Timer**: Rate limiting for OTP resend

### Expandable Section Pattern (Subject Selection)
The subject section uses expand/collapse for progressive disclosure:
1. **Collapsed State**: Shows summary of selected subjects
2. **Expanded State**: Full selector with search and filtering
3. **Change Detection**: Compares sets to determine if save needed
4. **Transition Hook**: Uses React's useTransition for smooth updates

## Dependencies

### External Dependencies
- `@tanstack/react-query`: Cache management and data fetching
- `@supabase/supabase-js`: Database and authentication
- `lucide-react`: Icon components
- `next/navigation`: Path revalidation

### Internal Dependencies
- UI components from `@/components/ui`
- Subject components from `@/components/subjects`
- Supabase utilities from `@/lib/supabase`
- Cache utilities from `@/lib/cache`

## API Reference

### Server Actions
```typescript
updateUserName(name: string): Promise<{
  success?: boolean
  data?: { name: string }
  error?: string
}>

updateUserSubjects(subjectIds: string[]): Promise<{
  success?: boolean
  error?: string
}>

updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{
  success?: boolean
  message?: string
  error?: string
}>

requestEmailChange(
  newEmail: string, 
  password: string
): Promise<{
  success?: boolean
  message?: string
  error?: string
}>

verifyEmailChangeOtp(
  newEmail: string,
  token: string
): Promise<{
  success?: boolean
  message?: string
  error?: string
  requiresCacheInvalidation?: boolean
}>
```

## Security Considerations

### Row Level Security (RLS)
All database operations are protected by RLS policies:
- `user_profiles`: Users can only view/update their own profile
- `user_subjects`: Users can only manage their own subject selections
- RPC functions use `SECURITY DEFINER` for controlled elevated access

### Authentication Verification
- Every server action verifies the current user session
- Password verification required for sensitive operations
- OTP verification for email changes

### Input Validation
- Name: Length limits and trimming
- Email: Regex validation and uniqueness checks
- Password: Minimum length and matching confirmation
- Subject IDs: Array validation and UUID format

## UI/UX Patterns

### Visual Design
- **Card-based Layout**: Cream-colored cards with stone borders
- **Section Dividers**: Horizontal lines between account sections
- **Action Buttons**: Consistent placement and styling
- **Loading States**: Spinners and disabled states during operations

### Interaction Patterns
- **Inline Editing**: Immediate feedback for simple changes
- **Dialog Confirmation**: Multi-step flows for complex operations
- **Progressive Disclosure**: Expand/collapse for advanced options
- **Optimistic Updates**: UI updates before server confirmation

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in dialogs
- Error announcements for screen readers

### Responsive Design
- Mobile-first approach
- Collapsible sections on small screens
- Touch-friendly button sizes
- Adaptive grid layouts

## Other Notes

### Performance Optimizations
- Server-side data fetching reduces client requests
- Parallel promise resolution for initial data
- Selective cache invalidation minimizes refetches
- Memoized computations in subject selector

### Error Handling
- Graceful degradation when profile fetch fails
- Retry logic with exponential backoff
- User-friendly error messages
- Rollback on transaction failures

### Recent Improvements
- Transaction-based subject updates prevent partial state
- Improved sidebar caching for name changes
- Consolidated subject management UI
- Enhanced email change flow with OTP verification
- Bordered card design replacing shadows for better visual hierarchy