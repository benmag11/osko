# Settings & User Profile Documentation

## Overview
The Settings & User Profile system provides a comprehensive interface for users to manage their account information, authentication credentials, and subject preferences. Built with Next.js App Router, React Server Components, and Supabase, it implements secure, real-time profile management with optimistic updates and robust validation.

## Architecture
The settings system follows a modular architecture with clear separation of concerns:
- **Server Components**: Initial data fetching and SSR in `page.tsx`
- **Client Components**: Interactive UI elements with real-time updates
- **Server Actions**: Secure backend operations for data mutations
- **Database Layer**: PostgreSQL with RLS policies via Supabase
- **State Management**: TanStack Query for caching and optimistic updates

### Design Patterns
- **Progressive Enhancement**: Forms work without JavaScript, enhanced with client-side features
- **Optimistic UI**: Immediate feedback with rollback on errors
- **Component Composition**: Modular sections for maintainability
- **Server-First Validation**: Security checks before client validation

## File Structure
```
src/app/dashboard/settings/
├── page.tsx                    # Server component entry point
├── settings-client.tsx         # Main client component orchestrator
├── actions.ts                  # Server actions for all settings operations
└── components/
    ├── name-section.tsx        # Name editing with inline save
    ├── email-section.tsx       # Email management trigger
    ├── change-email-dialog.tsx # Multi-step email change flow
    ├── password-section.tsx    # Password change dialog
    └── subject-section.tsx     # Subject preferences management

src/components/settings/
└── settings-section.tsx       # Reusable settings section wrapper

src/lib/
├── hooks/
│   └── use-user-profile.ts    # User profile data hook
├── cache/
│   └── cache-utils.ts         # Cache invalidation utilities
└── queries/
    └── query-keys.ts          # React Query cache keys
```

## Core Components

### Settings Page (`page.tsx`)
Server component that fetches initial data and renders the settings interface:

```typescript
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()
  
  // Fetch subjects in parallel
  const [allSubjects, userSubjectsData] = await Promise.all([
    getAllSubjects(),
    getUserSubjects(user.id)
  ])
  
  return (
    <DashboardPage>
      <SettingsClient 
        userEmail={user.email || ''}
        userName={profile?.name || ''}
        allSubjects={allSubjects}
        userSubjects={userSubjects}
      />
    </DashboardPage>
  )
}
```

### Settings Client (`settings-client.tsx`)
Orchestrates the settings UI, organizing sections into Account and Subjects groups:

```typescript
export function SettingsClient({ userEmail, userName, allSubjects, userSubjects }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Account">
        <div className="divide-y divide-stone-200">
          <NameSection initialName={userName} />
          <EmailSection currentEmail={userEmail} />
          <PasswordSection />
        </div>
      </SettingsSection>
      
      <SettingsSection title="Subjects">
        <SubjectSection 
          allSubjects={allSubjects}
          userSubjects={userSubjects}
        />
      </SettingsSection>
    </div>
  )
}
```

## Data Flow

### User Profile Data Model
The `user_profiles` table structure in PostgreSQL:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Profile State Management
User profile data flows through the application via the `useUserProfile` hook:

```typescript
export function useUserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Validate session
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      // Fetch profile with user ID
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })
}
```

## Key Functions and Hooks

### Name Management (`name-section.tsx`)
Inline editing with optimistic updates and keyboard shortcuts:

```typescript
const handleSave = useCallback(async () => {
  if (!isDirty) return
  
  setIsSaving(true)
  const result = await updateUserName(name)
  
  if (result.error) {
    setError(result.error)
  } else {
    originalName.current = name
    // Invalidate cache to update sidebar
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.user.profile(user.id) 
    })
  }
}, [name, isDirty, queryClient, user?.id])
```

Features:
- Real-time validation
- Enter to save, Escape to cancel
- Visual feedback for dirty state
- Automatic blur after save

### Email Change Workflow (`change-email-dialog.tsx`)
Three-step secure email change process:

1. **Password Verification**:
```typescript
const result = await verifyPasswordForEmailChange(password)
if (result.success) setStep('email')
```

2. **Email Request & OTP Generation**:
```typescript
const result = await requestEmailChange(newEmail, password)
// Sends 6-digit OTP to new email
if (result.success) setStep('verification')
```

3. **OTP Verification**:
```typescript
const result = await verifyEmailChangeOtp(newEmail, otp)
if (result.success) {
  // Refresh session with new email
  await supabase.auth.refreshSession()
  // Invalidate cache globally
  await invalidateUserCache(queryClient)
}
```

### Password Management (`password-section.tsx`)
Secure password update with validation:

```typescript
export async function updatePassword(currentPassword, newPassword, confirmPassword) {
  // Validation checks
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }
  
  // Verify current password
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  
  if (passwordError) {
    return { error: 'Current password is incorrect' }
  }
  
  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
}
```

## Integration Points

### Authentication Integration
Settings integrate with Supabase Auth for:
- Session validation before operations
- Password verification for sensitive changes
- Email change OTP flow
- Session refresh after email updates

### Cache Management
Strategic cache invalidation ensures UI consistency:

```typescript
export async function invalidateUserCache(queryClient: QueryClient) {
  // Invalidate all user-scoped queries
  await queryClient.invalidateQueries({ queryKey: ['user'] })
  
  // Remove stale data
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user-profile-anonymous'] })
}
```

### Database Integration
RLS policies ensure secure data access:

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

## Configuration

### Environment Variables
Required Supabase configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Cache Configuration
Settings use configured cache times:
```typescript
USER_DATA: {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
}
```

## Type Definitions

### User Profile Types
```typescript
interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
}

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}
```

### Server Action Results
```typescript
type ServerActionResult = 
  | { success: true; data?: any; message?: string }
  | { success: false; error: string; code?: string }
```

## Implementation Details

### Name Editing Flow
1. User focuses input field → Shows save/cancel buttons
2. User types name → Marks field as dirty
3. User presses Enter or clicks save → Validates and saves
4. Success → Updates cache, hides buttons, blurs input
5. Error → Shows inline error message

### Email Change Security
1. **Password Gate**: Requires current password before proceeding
2. **OTP Verification**: 6-digit code sent to new email
3. **Auto-submit**: OTP submits automatically when complete
4. **Resend Throttling**: 60-second cooldown between resends
5. **Session Refresh**: Updates auth session after success

### Subject Management
1. **Expandable Interface**: Collapsed view shows current subjects
2. **Level Indicators**: Visual dots for Higher (salmon) vs Ordinary (sky)
3. **Mutual Exclusion**: Selecting one level deselects the other
4. **Batch Updates**: All changes saved in single transaction
5. **Path Revalidation**: Updates dashboard and study pages

### Form Validation Patterns
All forms implement multi-layer validation:

```typescript
// Client-side validation
if (!name || name.trim().length === 0) {
  return { error: 'Name cannot be empty' }
}

// Server-side validation
if (name.length > 100) {
  return { error: 'Name must be less than 100 characters' }
}

// Database constraints
CHECK (char_length(name) > 0)
```

## Dependencies

### External Dependencies
- `@supabase/supabase-js`: Database and auth client
- `@tanstack/react-query`: State management and caching
- `lucide-react`: Icon components
- `next/navigation`: Routing and navigation

### Internal Dependencies
- `/lib/supabase/server`: Server-side Supabase client
- `/lib/supabase/queries`: Database query functions
- `/lib/cache/cache-utils`: Cache invalidation utilities
- `/components/ui/*`: Shared UI components

## API Reference

### Server Actions

#### `updateUserName(name: string)`
Updates the user's display name.
- Validates name length (1-100 characters)
- Updates `user_profiles` table
- Revalidates settings page
- Returns success with updated name or error

#### `requestEmailChange(newEmail: string, password: string)`
Initiates email change process.
- Validates email format
- Verifies password
- Sends OTP to new email
- Returns success message or error

#### `verifyEmailChangeOtp(newEmail: string, token: string)`
Completes email change.
- Validates 6-digit OTP
- Updates user email in auth system
- Triggers cache invalidation
- Returns success or specific error

#### `updatePassword(currentPassword: string, newPassword: string, confirmPassword: string)`
Changes user password.
- Validates password requirements
- Verifies current password
- Updates auth password
- Returns success or error

#### `updateUserSubjects(subjectIds: string[])`
Updates user's subject preferences.
- Validates subject array
- Uses database transaction
- Revalidates multiple pages
- Returns success or error

## Other Notes

### Security Considerations
1. **Server-Side Validation**: All mutations validated on server before database operations
2. **RLS Policies**: Database-level security ensures users can only modify own data
3. **Password Requirements**: Minimum 6 characters, must differ from current
4. **Session Validation**: Every operation checks for valid, non-expired session
5. **CSRF Protection**: Supabase Auth provides built-in CSRF protection

### Performance Optimizations
1. **Parallel Data Fetching**: Subjects and profile loaded simultaneously
2. **Optimistic Updates**: UI updates immediately, rolls back on error
3. **Selective Cache Invalidation**: Only affected queries are invalidated
4. **Debounced Validation**: Prevents excessive validation calls
5. **Lazy Loading**: Dialogs load content only when opened

### Accessibility Features
1. **ARIA Labels**: All interactive elements properly labeled
2. **Keyboard Navigation**: Full keyboard support with shortcuts
3. **Focus Management**: Proper focus flow through dialogs
4. **Error Announcements**: Screen reader announces errors
5. **Visual Feedback**: Clear state indicators for all interactions

### Error Recovery
1. **Graceful Degradation**: Forms work without JavaScript
2. **Retry Logic**: Database operations retry on transient failures
3. **Rollback Support**: Failed operations restore previous state
4. **User Feedback**: Clear error messages with recovery instructions
5. **Session Recovery**: Automatic session refresh on expiry

### Mobile Considerations
1. **Responsive Layout**: Settings adapt to mobile viewports
2. **Touch Targets**: Buttons sized for touch interaction
3. **Collapsible Sections**: Subjects section expands for editing
4. **Simplified Navigation**: Single-column layout on mobile
5. **Input Types**: Appropriate keyboard types for email/password