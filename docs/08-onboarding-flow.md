# Onboarding Flow Documentation

## Overview
The onboarding flow is a mandatory two-step process for new users after authentication, collecting their display name and subject preferences. It ensures every user has a complete profile before accessing the main application, with seamless integration into the authentication pipeline and automatic redirection logic managed by middleware.

## Architecture
The onboarding system follows a client-server architecture with React Server Components for initial data loading, client-side state management for the multi-step form, and server actions for data persistence. The flow is protected by middleware that enforces onboarding completion before accessing protected routes. The architecture prioritizes user experience with optimistic updates, proper error handling, and graceful degradation for edge cases.

## File Structure
```
src/app/onboarding/
├── page.tsx                    # Server component entry point, fetches subjects
├── onboarding-client.tsx       # Client-side orchestrator for multi-step flow
└── actions.ts                   # Server actions for data persistence

src/components/onboarding/
├── name-step.tsx               # Name input component (step 1)
├── subject-selection-step.tsx  # Subject selection wrapper (step 2)
└── progress-indicator.tsx      # Visual progress tracker

src/components/subjects/
├── subject-selector.tsx        # Reusable subject selection component
├── subject-card.tsx            # Individual subject card with level selection
└── selected-subject-card.tsx   # Display card for selected subjects

src/middleware.ts               # Route protection and onboarding enforcement
```

## Core Components

### OnboardingPage (Server Component)
The server-side entry point that fetches available subjects and handles edge cases:

```typescript
// src/app/onboarding/page.tsx
export default async function OnboardingPage() {
  // Fetch all subjects from the database
  const subjects = await getAllSubjects()

  // Handle case where no subjects are available
  if (!subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        {/* Fallback UI with refresh option */}
      </div>
    )
  }

  return <OnboardingClient subjects={subjects} />
}
```

### OnboardingClient (Client Component)
The main orchestrator managing form state, step transitions, and server communication:

```typescript
// src/app/onboarding/onboarding-client.tsx
export function OnboardingClient({ subjects }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    subjectIds: []
  })
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null)

  // Handles step transitions and error states
  const handleNameSubmit = (name: string) => {
    setError(null)
    setErrorCode(null)
    setFormData(prev => ({ ...prev, name }))
    setCurrentStep(2)
  }

  // Submits data to server with transition handling
  const handleSubjectsSubmit = (subjectIds: string[]) => {
    startTransition(async () => {
      const result = await saveOnboardingData(updatedFormData)
      
      if (result.success) {
        router.push(result.redirectUrl)
      } else {
        setError(result.error)
        setErrorCode(result.code || null)
        
        // Auto-redirect to signin on auth errors
        if (result.code === 'AUTH_ERROR') {
          setTimeout(() => {
            router.push('/auth/signin')
          }, 3000)
        }
      }
    })
  }
}
```

### NameStep Component
Handles name input with client-side validation:

```typescript
// src/components/onboarding/name-step.tsx
export function NameStep({ onNext, initialName = '' }: NameStepProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Minimum length validation
    if (name.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }
    
    onNext(name.trim())
  }

  // Clear error on input change
  useEffect(() => {
    setError('')
  }, [name])
}
```

### SubjectSelector Component
Complex subject selection UI with search, filtering, and level management:

```typescript
// src/components/subjects/subject-selector.tsx
export function SubjectSelector({
  subjects,
  initialSelectedIds = [],
  onSelectionChange,
  isDisabled = false
}: SubjectSelectorProps) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  )
  
  // Group subjects by name for Higher/Ordinary level selection
  const groupedSubjects = useMemo(() => {
    const grouped = new Map<string, GroupedSubject>()
    subjects.forEach(subject => {
      const existing = grouped.get(subject.name) || { name: subject.name }
      if (subject.level === 'Higher') {
        existing.higher = subject
      } else if (subject.level === 'Ordinary') {
        existing.ordinary = subject
      }
      grouped.set(subject.name, existing)
    })
    return Array.from(grouped.values())
  }, [subjects])

  // Ensures only one level per subject can be selected
  const handleSubjectToggle = useCallback((subject: Subject) => {
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
    
    setSelectedSubjectIds(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }, [selectedSubjectIds, subjects, onSelectionChange])
}
```

## Data Flow

### 1. Initial Load Sequence
```
Browser Request → Middleware Check → OnboardingPage (RSC)
                                    ↓
                         getAllSubjects() from DB
                                    ↓
                         Render OnboardingClient with subjects
```

### 2. Form Submission Flow
```
User Input → Client Validation → Update Local State
                                ↓
                    Step 2: Subject Selection
                                ↓
                    Server Action (saveOnboardingData)
                                ↓
        Atomic DB Transaction (Profile + Subjects)
                                ↓
              Success: Redirect to Dashboard
              Failure: Display Error + Rollback
```

### 3. State Management During Onboarding
The onboarding flow maintains form data across steps using React state:

```typescript
interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

// State persists across step transitions
const [formData, setFormData] = useState<OnboardingFormData>({
  name: '',
  subjectIds: []
})
```

## Key Functions and Hooks

### saveOnboardingData Server Action
Handles the complete onboarding persistence with transaction-like behavior:

```typescript
// src/app/onboarding/actions.ts
export async function saveOnboardingData(
  data: OnboardingFormData
): Promise<ServerActionResult> {
  const supabase = await createClient()
  
  // 1. Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { 
      success: false,
      error: 'You must be logged in to complete onboarding.',
      code: 'AUTH_ERROR'
    }
  }

  // 2. Validate input
  if (!data.name || data.name.trim().length < 1) {
    return {
      success: false,
      error: 'Please enter your name to continue.',
      code: 'PROFILE_ERROR'
    }
  }

  // 3. Create/update user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      name: data.name.trim(),
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  // 4. Save user subjects using RPC function
  const result = await saveUserSubjects(user.id, data.subjectIds)
  
  if (!result.success) {
    // Rollback profile update if subjects fail
    await supabase
      .from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)
    
    return { 
      success: false,
      error: result.error || 'Failed to save your subjects.',
      code: 'SUBJECTS_ERROR'
    }
  }

  // 5. Revalidate cached pages
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/study')
  
  return { success: true, redirectUrl: '/dashboard/study' }
}
```

### checkOnboardingStatus Function
Used by middleware to determine if onboarding is required:

```typescript
export async function checkOnboardingStatus(): Promise<{
  completed: boolean
  error?: string
}> {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    // PGRST116 = no rows found (expected for new users)
    if (profileError.code === 'PGRST116') {
      return { completed: false }
    }
    return { completed: false }
  }

  return { completed: profile?.onboarding_completed || false }
}
```

## Integration Points

### Middleware Integration
The middleware enforces onboarding completion for all protected routes:

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  if (user) {
    // Check onboarding status for protected pages
    if (isProtectedPage && !isOnboardingPage) {
      const userProfile = await getProfile()
      
      // Redirect to onboarding if not completed
      if (!userProfile || !userProfile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
    
    // Redirect away from onboarding if already completed
    if (isOnboardingPage) {
      const userProfile = await getProfile()
      
      if (userProfile && userProfile.onboarding_completed) {
        return NextResponse.redirect(new URL('/dashboard/study', request.url))
      }
    }
  }
}
```

### Authentication Callback Integration
The auth callback automatically creates profiles and redirects to onboarding:

```typescript
// src/app/auth/callback/route.ts
export async function GET(request: Request) {
  if (data?.user) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', data.user.id)
      .single()
    
    // If no profile exists, create one
    if (!profile) {
      await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          onboarding_completed: false
        })
      
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    
    // If onboarding not completed, redirect to onboarding
    if (!profile.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    
    // Otherwise proceed to dashboard
    return NextResponse.redirect(`${origin}${next}`)
  }
}
```

## Configuration

### Database Schema
The onboarding flow relies on two primary tables with RLS policies:

```sql
-- user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  name TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_subjects table  
CREATE TABLE user_subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage own subjects" ON user_subjects
  FOR ALL USING (auth.uid() = user_id);
```

### RPC Functions
The `update_user_subjects` function provides atomic subject updates:

```sql
CREATE OR REPLACE FUNCTION update_user_subjects(
  p_user_id UUID,
  p_subject_ids UUID[]
) RETURNS JSONB AS $$
BEGIN
  -- Delete existing subjects
  DELETE FROM user_subjects WHERE user_id = p_user_id;
  
  -- Insert new subjects
  INSERT INTO user_subjects (user_id, subject_id)
  SELECT p_user_id, unnest(p_subject_ids);
  
  RETURN jsonb_build_object(
    'success', true,
    'count', array_length(p_subject_ids, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Type Definitions

### Core Types
```typescript
// Onboarding form data
export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

// Server action result types
export type ServerActionResult = 
  | { success: true; redirectUrl: string }
  | { success: false; error: string; code?: ErrorCode }

type ErrorCode = 'AUTH_ERROR' | 'PROFILE_ERROR' | 'SUBJECTS_ERROR' | 'UNKNOWN_ERROR'

// Database types
export interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
}

export interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}
```

## Implementation Details

### Progress Indicator Implementation
The progress indicator uses Radix UI Progress primitive with custom styling:

```typescript
// src/components/onboarding/progress-indicator.tsx
export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-[#757575]">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
```

### Name Validation Logic
The name step implements progressive validation:
- Minimum 2 characters required
- Whitespace is trimmed before validation
- Error messages clear on input change
- Initial value preservation for back navigation

### Subject Selection Features
- **Search functionality**: Real-time filtering of subjects
- **Level management**: Only one level (Higher/Ordinary) per subject
- **Visual feedback**: Selected subjects panel with remove capability
- **Responsive design**: Mobile-first with desktop optimization
- **Keyboard navigation**: Full keyboard support for accessibility

### Error Handling Strategy
The onboarding flow implements comprehensive error handling:

1. **Authentication Errors**: Auto-redirect to signin after 3 seconds
2. **Validation Errors**: Inline error messages with specific guidance
3. **Network Errors**: Retry logic with exponential backoff
4. **Database Errors**: Transaction rollback to maintain consistency

### Performance Optimizations
- **Memoization**: Heavy computations cached with useMemo
- **Callback optimization**: Event handlers wrapped in useCallback
- **Transition API**: Server actions wrapped in startTransition
- **Lazy loading**: Subject selector only processes visible items

## Dependencies

### External Dependencies
- **@supabase/ssr**: Server-side Supabase client
- **@radix-ui/react-progress**: Progress bar primitive
- **@tanstack/react-query**: Client-side data fetching (for other components)
- **lucide-react**: Icons for UI elements

### Internal Dependencies
- **/lib/supabase/server**: Server-side database client
- **/lib/supabase/queries**: Database query functions
- **/components/ui**: shadcn/ui components (Card, Input, Button, Progress)
- **/lib/types/database**: TypeScript type definitions

## API Reference

### Server Actions

#### saveOnboardingData
```typescript
saveOnboardingData(data: OnboardingFormData): Promise<ServerActionResult>
```
Saves user profile and subject selections atomically.

**Parameters:**
- `data.name`: User's display name (min 1 character after trim)
- `data.subjectIds`: Array of selected subject UUIDs

**Returns:**
- Success: `{ success: true, redirectUrl: '/dashboard/study' }`
- Failure: `{ success: false, error: string, code?: ErrorCode }`

#### checkOnboardingStatus
```typescript
checkOnboardingStatus(): Promise<{ completed: boolean, error?: string }>
```
Checks if current user has completed onboarding.

#### getUserProfile
```typescript
getUserProfile(): Promise<{ profile?: UserProfile, subjects?: UserSubject[], error?: string }>
```
Fetches complete user profile with selected subjects.

## Other Notes

### Security Considerations
- All database operations use Row Level Security (RLS) policies
- User can only modify their own profile and subjects
- Server actions validate authentication before any operations
- Input sanitization happens on both client and server

### Mobile Responsiveness
The onboarding flow is fully responsive with:
- Touch-optimized inputs and buttons
- Proper viewport scaling
- Adaptive layouts for different screen sizes
- Native form validation on mobile browsers

### Accessibility Features
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management between steps
- Error announcements for screen readers

### Edge Cases Handled
1. **No subjects available**: Shows refresh UI with instructions
2. **Session expiry during onboarding**: Redirects to signin with context preservation
3. **Network failures**: Retry logic with user feedback
4. **Duplicate form submissions**: Prevented with isPending state
5. **Back navigation**: Form state preserved when moving between steps

### Future Extensibility
The onboarding architecture supports adding new steps:
- Additional profile fields (e.g., school, grade level)
- Preference settings (e.g., notification preferences)
- Tutorial or walkthrough steps
- Integration with external authentication providers

The modular component structure and clear separation of concerns make the onboarding flow maintainable and extensible for future requirements.