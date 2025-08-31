# Onboarding Flow Documentation

## Overview
The onboarding flow is a two-step process that collects essential user information after authentication. It ensures new users complete their profile setup (name) and select their study subjects with appropriate levels (Higher/Ordinary) before accessing the main application features. The flow is mandatory for all new users and integrates seamlessly with the authentication system.

## Architecture
The onboarding system follows a client-server architecture with server-side validation and database persistence. It uses Next.js App Router with server components for initial data fetching, client components for interactive forms, and server actions for data mutation. The architecture ensures data consistency through transactional operations and proper error handling with rollback capabilities.

### Design Patterns
- **Multi-step Form Pattern**: Sequential data collection with progress indication
- **Optimistic UI Updates**: Using React's `useTransition` for smooth loading states
- **Server Action Pattern**: Type-safe server mutations with proper error handling
- **Middleware Protection**: Route-level access control based on onboarding status
- **Component Composition**: Reusable step components with clear separation of concerns

## File Structure
```
src/
├── app/onboarding/
│   ├── page.tsx                    # Server component entry point, fetches subjects
│   ├── onboarding-client.tsx       # Main client orchestrator for multi-step flow
│   └── actions.ts                   # Server actions for data persistence
├── components/onboarding/
│   ├── name-step.tsx               # Step 1: Name collection form
│   ├── subject-selection-step.tsx  # Step 2: Subject and level selection
│   ├── subject-card.tsx            # Individual subject selection card
│   ├── selected-subject-card.tsx   # Display card for selected subjects
│   └── progress-indicator.tsx      # Visual progress tracker
├── middleware.ts                    # Route protection and onboarding checks
├── app/auth/callback/route.ts      # OAuth callback with profile creation
├── lib/supabase/queries.ts         # Database operations (saveUserSubjects)
├── lib/types/database.ts           # TypeScript types for user_profiles, user_subjects
└── lib/utils/subject-icons.ts      # Icon mapping for subjects
```

## Core Components

### OnboardingPage (Server Component)
```tsx
// src/app/onboarding/page.tsx
export default async function OnboardingPage() {
  // Fetch all subjects from the database
  const subjects = await getAllSubjects()
  
  // Handle case where no subjects are available
  if (!subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        {/* Fallback UI with refresh prompt */}
      </div>
    )
  }
  
  return <OnboardingClient subjects={subjects} />
}
```
The server component fetches all available subjects from the database and passes them to the client component. It includes error handling for the edge case where no subjects are available.

### OnboardingClient (Main Orchestrator)
```tsx
// src/app/onboarding/onboarding-client.tsx
export function OnboardingClient({ subjects }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    subjectIds: []
  })
  
  const handleNameSubmit = (name: string) => {
    setFormData(prev => ({ ...prev, name }))
    setCurrentStep(2)
  }
  
  const handleSubjectsSubmit = (subjectIds: string[]) => {
    startTransition(async () => {
      const result = await saveOnboardingData(updatedFormData)
      if (result.success) {
        router.push(result.redirectUrl)
      }
    })
  }
}
```
Manages the multi-step flow state, coordinates between steps, handles form data collection, and manages server action submission with proper error handling.

### NameStep Component
```tsx
// src/components/onboarding/name-step.tsx
export function NameStep({ onNext, initialName = '' }: NameStepProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }
    onNext(name.trim())
  }
}
```
Collects user's display name with client-side validation requiring minimum 2 characters. Includes error states and accessibility attributes.

### SubjectSelectionStep Component
```tsx
// src/components/onboarding/subject-selection-step.tsx
export function SubjectSelectionStep({ subjects, onNext, onBack }: Props) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set())
  
  // Group subjects by name for display
  const groupedSubjects = useMemo(() => {
    const grouped = new Map<string, GroupedSubject>()
    subjects.forEach(subject => {
      const existing = grouped.get(subject.name) || { name: subject.name }
      if (subject.level === 'Higher') existing.higher = subject
      else if (subject.level === 'Ordinary') existing.ordinary = subject
      grouped.set(subject.name, existing)
    })
    return Array.from(grouped.values())
  }, [subjects])
  
  const handleSubjectToggle = (subject: Subject) => {
    // Remove any other level of the same subject
    const otherLevelSubject = subjects.find(
      s => s.name === subject.name && s.id !== subject.id
    )
    if (otherLevelSubject) newSelected.delete(otherLevelSubject.id)
    newSelected.add(subject.id)
  }
}
```
Complex subject selection interface that groups subjects by name, allows level selection (Higher/Ordinary), includes search functionality, and prevents selecting multiple levels of the same subject.

## Data Flow

### Step 1: Name Collection
1. User enters name in `NameStep` component
2. Client-side validation ensures minimum 2 characters
3. Name stored in parent component state
4. Progress advances to step 2

### Step 2: Subject Selection
1. User selects subjects and their levels
2. Selection logic ensures only one level per subject
3. Visual feedback shows selected subjects in sidebar
4. Submit triggers server action

### Step 3: Data Persistence
```tsx
// src/app/onboarding/actions.ts
export async function saveOnboardingData(data: OnboardingFormData) {
  // 1. Validate authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  // 2. Create/update user profile
  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    name: data.name.trim(),
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  })
  
  // 3. Save user subjects (with transaction-like behavior)
  const result = await saveUserSubjects(user.id, data.subjectIds)
  
  // 4. Rollback on failure
  if (!result.success) {
    await supabase.from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)
  }
  
  // 5. Revalidate and redirect
  revalidatePath('/dashboard')
  return { success: true, redirectUrl: '/dashboard/study' }
}
```

## Key Functions and Hooks

### saveOnboardingData (Server Action)
```tsx
export async function saveOnboardingData(
  data: OnboardingFormData
): Promise<ServerActionResult>
```
Main server action that handles the complete onboarding data persistence. Validates user authentication, creates/updates user profile, saves subject selections, handles rollback on failure, and returns appropriate error codes.

### checkOnboardingStatus
```tsx
export async function checkOnboardingStatus(): Promise<{
  completed: boolean
  error?: string
}>
```
Checks if a user has completed onboarding by querying the user_profiles table. Used by middleware and authentication callbacks.

### saveUserSubjects (Database Operation)
```tsx
// src/lib/supabase/queries.ts
export async function saveUserSubjects(
  userId: string, 
  subjectIds: string[]
): Promise<{ success: boolean; error?: string }>
```
Transactional operation that clears existing user subjects and inserts new selections. Includes retry logic with exponential backoff for reliability.

### useUserProfile Hook
```tsx
// src/lib/hooks/use-user-profile.ts
export function useUserProfile(): UseUserProfileReturn {
  // Uses TanStack Query with user-scoped cache keys
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // Fetches and returns user and profile data
    }
  })
}
```

## Integration Points

### Authentication System Integration
The onboarding flow is tightly integrated with Supabase Auth:

1. **OAuth Callback** (`/auth/callback/route.ts`):
```tsx
if (data?.user) {
  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', data.user.id)
    .single()
  
  // If no profile exists, create one
  if (!profile) {
    await supabase.from('user_profiles').insert({
      user_id: data.user.id,
      onboarding_completed: false
    })
    return NextResponse.redirect(`${origin}/onboarding`)
  }
}
```

2. **Middleware Protection** (`middleware.ts`):
```tsx
// For authenticated users
if (user) {
  // Check onboarding status for protected pages
  if (isProtectedPage && !isOnboardingPage) {
    const userProfile = await getProfile()
    if (!userProfile || !userProfile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
  
  // Redirect away from onboarding if already completed
  if (isOnboardingPage) {
    if (userProfile && userProfile.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard/study', request.url))
    }
  }
}
```

### Dashboard Integration
After successful onboarding completion:
- User redirected to `/dashboard/study`
- Cache invalidation via `revalidatePath('/dashboard')`
- User subjects available through `useUserSubjects` hook
- Profile data accessible via `useUserProfile` hook

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Database Schema Requirements
- `user_profiles` table with columns: id, user_id, name, onboarding_completed, is_admin, created_at, updated_at
- `user_subjects` table with columns: id, user_id, subject_id, created_at
- `subjects` table with available subjects and levels

### Row Level Security (RLS) Policies
```sql
-- user_profiles policies
"Users can insert own profile": INSERT with check (auth.uid() = user_id)
"Users can update own profile": UPDATE where (auth.uid() = user_id)
"Users can view own profile": SELECT where (auth.uid() = user_id)

-- user_subjects policies
"Users can manage own subjects": ALL where (auth.uid() = user_id)
"Users can view own subjects": SELECT where (auth.uid() = user_id)
```

## Type Definitions

### OnboardingFormData
```tsx
export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}
```

### ServerActionResult
```tsx
export type ServerActionResult = 
  | { success: true; redirectUrl: string }
  | { 
      success: false; 
      error: string; 
      code?: 'AUTH_ERROR' | 'PROFILE_ERROR' | 'SUBJECTS_ERROR' | 'UNKNOWN_ERROR' 
    }
```

### UserProfile (Database Type)
```tsx
export interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
}
```

### UserSubject (Database Type)
```tsx
export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  created_at: string | null
}
```

## Implementation Details

### Multi-Level Subject Selection Logic
The system prevents users from selecting multiple levels of the same subject:
```tsx
const handleSubjectToggle = (subject: Subject) => {
  const newSelected = new Set(selectedSubjectIds)
  
  if (newSelected.has(subject.id)) {
    newSelected.delete(subject.id)
  } else {
    // Remove any other level of the same subject
    const otherLevelSubject = subjects.find(
      s => s.name === subject.name && s.id !== subject.id
    )
    if (otherLevelSubject) {
      newSelected.delete(otherLevelSubject.id)
    }
    newSelected.add(subject.id)
  }
}
```

### Error Handling Strategy
The system implements comprehensive error handling with specific error codes:
- `AUTH_ERROR`: User not authenticated, redirects to signin
- `PROFILE_ERROR`: Profile creation/update failed
- `SUBJECTS_ERROR`: Subject selection save failed
- `UNKNOWN_ERROR`: Unexpected errors

Error recovery includes automatic rollback of partial changes:
```tsx
if (!result.success) {
  // Roll back profile update if subjects fail
  await supabase
    .from('user_profiles')
    .update({ onboarding_completed: false })
    .eq('user_id', user.id)
}
```

### Progress Tracking
Visual progress indication using a custom Progress component:
```tsx
export function ProgressIndicator({ currentStep, totalSteps }) {
  const progress = (currentStep / totalSteps) * 100
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
```

### Responsive Design Implementation
The subject selection step uses different layouts for mobile and desktop:
```tsx
<div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
  {/* Selected Subjects - First on mobile, second on desktop */}
  <div className="order-1 lg:order-2 lg:col-span-1">
    {/* Selected subjects sidebar */}
  </div>
  
  {/* Subject Selection Grid - Second on mobile, first on desktop */}
  <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
    {/* Subject selection grid */}
  </div>
</div>
```

## Dependencies

### External Dependencies
- `@supabase/ssr`: Server-side Supabase client
- `@supabase/supabase-js`: Supabase JavaScript client
- `@tanstack/react-query`: Data fetching and caching
- `lucide-react`: Icon library for subject icons
- `next/navigation`: Next.js navigation utilities

### Internal Dependencies
- `/lib/supabase/server`: Server-side Supabase client creation
- `/lib/supabase/queries`: Database query functions
- `/lib/types/database`: TypeScript type definitions
- `/lib/utils/subject-icons`: Subject icon mapping utility
- `/components/ui/*`: shadcn/ui components (Card, Button, Input, Progress)

## API Reference

### Server Actions

#### saveOnboardingData
- **Purpose**: Save user profile and subject selections
- **Parameters**: `OnboardingFormData` (name, subjectIds)
- **Returns**: `ServerActionResult` with success status and redirect URL or error
- **Side Effects**: Updates database, revalidates cache

#### checkOnboardingStatus
- **Purpose**: Check if user has completed onboarding
- **Parameters**: None (uses authenticated user)
- **Returns**: Object with `completed` boolean and optional `error`
- **Usage**: Called by middleware and auth callbacks

#### getUserProfile
- **Purpose**: Fetch user profile and selected subjects
- **Parameters**: None (uses authenticated user)
- **Returns**: Profile data and subjects array or error
- **Usage**: Dashboard and profile management

## Other Notes

### Database Indexes
The system uses optimized indexes for performance:
- `user_profiles_user_id_key`: Unique index on user_id for fast profile lookups
- `unique_user_subject`: Composite unique index on (user_id, subject_id) preventing duplicate selections

### Subject Icon Mapping
The system uses a centralized icon mapping for consistent visual representation:
```tsx
const subjectIconMap: Record<string, LucideIcon> = {
  'Mathematics': Calculator,
  'Biology': Dna,
  'Chemistry': FlaskRound,
  // ... full mapping in subject-icons.ts
}
```

### Session Management
The onboarding flow respects session expiration and validates authentication state at each step, ensuring security and proper user identification throughout the process.

### Cache Invalidation Strategy
After successful onboarding:
- Revalidates `/dashboard` and `/dashboard/study` paths
- User-scoped query keys prevent cross-user cache pollution
- TanStack Query manages cache lifecycle with configured stale times