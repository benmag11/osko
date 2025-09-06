# Admin Editing Capabilities Documentation

## Overview
The admin editing system provides role-based administrative capabilities for managing exam questions metadata within the application. It implements a secure, server-verified permission system that allows authorized administrators to edit question properties, manage topic associations, and maintain an audit trail of all changes. The system is built with React Query for state management, Supabase for backend operations, and shadcn/ui components for the user interface.

## Architecture
The admin system follows a layered architecture pattern with strict separation of concerns:

1. **Client-side detection**: React hooks (`useIsAdmin`) provide UI-level admin status
2. **Server-side verification**: All admin actions are verified server-side using Supabase Auth and RLS policies
3. **Database-level security**: Row Level Security (RLS) policies enforce permissions at the database level
4. **Audit logging**: All admin actions are tracked in a dedicated audit log table
5. **Optimistic UI updates**: TanStack Query provides cache invalidation and optimistic updates

The architecture ensures that admin privileges cannot be bypassed through client-side manipulation, as all critical operations require server-side verification against the `user_profiles.is_admin` field.

## File Structure
```
src/
├── components/
│   ├── admin/
│   │   └── question-edit-modal.tsx    # Main admin editing interface modal
│   └── questions/
│       └── question-card.tsx          # Question display with admin edit button
├── lib/
│   ├── hooks/
│   │   ├── use-is-admin.ts           # Hook for detecting admin status
│   │   ├── use-user-profile.ts       # User profile hook with admin field
│   │   └── use-topics.ts              # Topics fetching for question associations
│   ├── supabase/
│   │   └── admin-actions.ts          # Server actions for admin operations
│   ├── types/
│   │   └── database.ts               # TypeScript types for admin features
│   ├── queries/
│   │   └── query-keys.ts             # React Query cache key management
│   └── config/
│       └── cache.ts                   # Cache configuration for admin operations
```

## Core Components

### QuestionEditModal Component
The primary interface for admin editing operations, providing a comprehensive form for modifying question metadata.

```typescript
// src/components/admin/question-edit-modal.tsx
interface QuestionEditModalProps {
  question: Question          // Current question data
  topics: Topic[]            // Available topics for assignment
  open: boolean              // Modal visibility state
  onOpenChange: (open: boolean) => void
}

export function QuestionEditModal({
  question,
  topics,
  open,
  onOpenChange
}: QuestionEditModalProps) {
  // Form state management for all editable fields
  const [year, setYear] = useState(question.year.toString())
  const [paperNumber, setPaperNumber] = useState(question.paper_number?.toString() || '')
  const [questionNumber, setQuestionNumber] = useState(question.question_number.toString())
  const [questionParts, setQuestionParts] = useState(question.question_parts.join(', '))
  const [examType, setExamType] = useState(question.exam_type)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    question.topics?.map(t => t.id) || []
  )
  
  // Mutation for server-side update with optimistic cache invalidation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        year: parseInt(year),
        paper_number: paperNumber ? parseInt(paperNumber) : null,
        question_number: parseInt(questionNumber),
        question_parts: questionParts.split(',').map(p => p.trim()).filter(Boolean),
        exam_type: examType as 'normal' | 'deferred' | 'supplemental',
        topic_ids: selectedTopics
      }
      
      const result = await updateQuestionMetadata(question.id, updates)
      if (!result.success) {
        throw new Error(result.error || 'Update failed')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Question updated successfully')
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      router.refresh()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}
```

### QuestionCard Integration
The question display component that conditionally renders admin controls based on user permissions.

```typescript
// src/components/questions/question-card.tsx
export const QuestionCard = memo(function QuestionCard({ question }: QuestionCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const { isAdmin } = useIsAdmin()
  const { topics } = useTopics(question.subject_id)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-semibold text-warm-text-primary">
          {title}
        </h3>
        {isAdmin && (
          <Button
            onClick={() => setShowEditModal(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Metadata
          </Button>
        )}
      </div>
      
      {/* Question content display */}
      
      {isAdmin && (
        <QuestionEditModal
          question={question}
          topics={topics || []}
          open={showEditModal}
          onOpenChange={setShowEditModal}
        />
      )}
    </div>
  )
})
```

## Data Flow
The admin editing system follows a unidirectional data flow pattern:

1. **Permission Check**: `useIsAdmin` hook queries user profile to determine admin status
2. **UI Rendering**: Admin controls are conditionally rendered based on `isAdmin` flag
3. **Edit Initiation**: Admin clicks "Edit Metadata" button, opening the modal
4. **Form State**: Modal maintains local state for all editable fields
5. **Server Validation**: On save, `updateQuestionMetadata` server action verifies admin status
6. **Database Update**: If authorized, updates are applied with RLS policy enforcement
7. **Audit Logging**: Changes are recorded in `question_audit_log` table
8. **Cache Invalidation**: React Query cache is invalidated to reflect changes
9. **UI Update**: Modal closes and question list refreshes with new data

## Key Functions and Hooks

### useIsAdmin Hook
Provides client-side admin status detection for UI rendering decisions.

```typescript
// src/lib/hooks/use-is-admin.ts
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}
```

This hook abstracts the admin check logic, making it reusable across components. It depends on the `useUserProfile` hook which manages the user profile cache.

### verifyAdmin Function
Server-side admin verification that runs before any administrative action.

```typescript
// src/lib/supabase/admin-actions.ts
async function verifyAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  return profile?.is_admin ?? false
}
```

This function performs a fresh database query to verify admin status, preventing any client-side tampering.

### updateQuestionMetadata Server Action
The primary server action for updating question metadata with full validation and audit logging.

```typescript
// src/lib/supabase/admin-actions.ts
export async function updateQuestionMetadata(
  questionId: string,
  updates: QuestionUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  // Step 1: Verify admin privileges
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  try {
    // Step 2: Capture current state for audit log
    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('*, question_topics(topic_id)')
      .eq('id', questionId)
      .single()
    
    // Step 3: Update question metadata
    const updateData: QuestionUpdate = {
      updated_at: new Date().toISOString()
    }
    
    // Conditionally add fields that were provided
    if (updates.year !== undefined) updateData.year = updates.year
    if (updates.paper_number !== undefined) updateData.paper_number = updates.paper_number
    if (updates.question_number !== undefined) updateData.question_number = updates.question_number
    if (updates.question_parts !== undefined) updateData.question_parts = updates.question_parts
    if (updates.exam_type !== undefined) updateData.exam_type = updates.exam_type
    
    const { error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
    
    if (updateError) throw updateError
    
    // Step 4: Handle topic associations
    if (updates.topic_ids !== undefined) {
      // Remove all existing topics
      await supabase
        .from('question_topics')
        .delete()
        .eq('question_id', questionId)
      
      // Add new topics
      if (updates.topic_ids.length > 0) {
        const { error: insertError } = await supabase
          .from('question_topics')
          .insert(
            updates.topic_ids.map(topicId => ({
              question_id: questionId,
              topic_id: topicId
            }))
          )
        
        if (insertError) throw insertError
      }
    }
    
    // Step 5: Create audit log entry
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('question_audit_log')
      .insert({
        question_id: questionId,
        user_id: user?.id,
        action: 'update',
        changes: {
          before: currentQuestion,
          after: updates
        }
      })
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update question:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    }
  }
}
```

## Integration Points

### Authentication System
The admin system integrates with Supabase Auth to retrieve the current user and verify their admin status. The `auth.uid()` function in RLS policies ensures database-level security.

### React Query Cache Management
Admin operations integrate with the global React Query cache through specific invalidation patterns:

```typescript
// Cache invalidation after successful update
queryClient.invalidateQueries({ queryKey: ['questions'] })
```

This ensures all question lists and related data are refreshed after admin edits.

### Topics Management
The admin interface allows association of questions with topics through a many-to-many relationship managed in the `question_topics` junction table.

### Router Integration
The system uses Next.js router for page refreshes after updates:

```typescript
router.refresh() // Triggers server-side re-render with updated data
```

## Configuration

### Cache Configuration
Admin operations use specific cache timings to balance performance and data freshness:

```typescript
// src/lib/config/cache.ts
export const CACHE_TIMES = {
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes for user profile/admin status
    gcTime: 10 * 60 * 1000,      // 10 minutes garbage collection
  },
  QUESTIONS: {
    staleTime: 1 * 60 * 1000,    // 1 minute for question data
    gcTime: 10 * 60 * 1000,      // 10 minutes garbage collection
  },
  TOPICS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes for topics (semi-static)
    gcTime: 30 * 60 * 1000,      // 30 minutes garbage collection
  },
}
```

### Query Key Scoping
Admin-related queries are scoped to prevent cache pollution:

```typescript
// src/lib/queries/query-keys.ts
export const queryKeys = {
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}
```

## Type Definitions

### Core Admin Types
```typescript
// src/lib/types/database.ts

// User profile with admin flag
export interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean  // Admin status flag
  created_at: string | null
  updated_at: string | null
}

// Payload for question updates
export interface QuestionUpdatePayload {
  year?: number
  paper_number?: number | null
  question_number?: number
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  topic_ids?: string[]  // For managing topic associations
}

// Audit log entry structure
export interface QuestionAuditLog {
  id: string
  question_id: string
  user_id: string | null
  action: 'update' | 'delete' | 'topic_add' | 'topic_remove'
  changes: AuditLogChanges
  created_at: string
}

// Polymorphic audit log changes based on action type
export type AuditLogChanges = 
  | { before: Partial<Question>; after: QuestionUpdatePayload } // for 'update'
  | { deletedData: Question } // for 'delete'  
  | { topicId: string; topicName: string } // for topic operations
```

## Implementation Details

### Modal Form Management
The edit modal uses controlled components with local state for each field. This approach provides immediate feedback while preventing unnecessary re-renders:

```typescript
// Local state management in QuestionEditModal
const [year, setYear] = useState(question.year.toString())
const [paperNumber, setPaperNumber] = useState(question.paper_number?.toString() || '')
const [questionNumber, setQuestionNumber] = useState(question.question_number.toString())
const [questionParts, setQuestionParts] = useState(question.question_parts.join(', '))
const [examType, setExamType] = useState(question.exam_type)
const [selectedTopics, setSelectedTopics] = useState<string[]>(
  question.topics?.map(t => t.id) || []
)
```

### Topic Selection UI
Topics are presented as checkboxes in a scrollable container, allowing multiple selections:

```typescript
<div className="col-span-3 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
  {topics.map(topic => (
    <div key={topic.id} className="flex items-center space-x-2">
      <Checkbox
        id={topic.id}
        checked={selectedTopics.includes(topic.id)}
        onCheckedChange={(checked) => {
          if (checked) {
            setSelectedTopics([...selectedTopics, topic.id])
          } else {
            setSelectedTopics(selectedTopics.filter(id => id !== topic.id))
          }
        }}
      />
      <Label htmlFor={topic.id} className="cursor-pointer">
        {topic.name}
      </Label>
    </div>
  ))}
</div>
```

### Error Handling
The system implements comprehensive error handling at multiple levels:

1. **Client-side validation**: Form inputs are validated before submission
2. **Server-side verification**: Admin status is verified before processing
3. **Database constraints**: RLS policies prevent unauthorized operations
4. **User feedback**: Toast notifications inform users of success or failure

### Optimistic Updates
While the actual database update is processing, the UI provides immediate feedback through loading states:

```typescript
<Button 
  onClick={() => updateMutation.mutate()}
  disabled={updateMutation.isPending}
>
  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
</Button>
```

## Dependencies

### External Dependencies
- **@tanstack/react-query**: v5.x - State management and caching for server state
- **@supabase/supabase-js**: Database client and authentication
- **sonner**: Toast notifications for user feedback
- **lucide-react**: Icon library (Edit2 icon for edit button)

### Internal Dependencies
- **shadcn/ui components**: 
  - Dialog: Modal container
  - Button: Action buttons
  - Input: Text/number inputs
  - Select: Dropdown for exam type
  - Checkbox: Topic selection
  - Label: Form labels
- **Custom hooks**:
  - useIsAdmin: Admin status detection
  - useUserProfile: User profile management
  - useTopics: Topic data fetching

## API Reference

### Server Actions

#### updateQuestionMetadata
Updates question metadata with admin verification.

**Parameters:**
- `questionId: string` - UUID of the question to update
- `updates: QuestionUpdatePayload` - Object containing fields to update

**Returns:**
- `Promise<{ success: boolean; error?: string }>`

**Authorization:**
- Requires `is_admin: true` in user_profiles table
- Verified server-side before processing

#### getQuestionAuditHistory
Retrieves audit log entries for a specific question.

**Parameters:**
- `questionId: string` - UUID of the question

**Returns:**
- `Promise<QuestionAuditLog[]>` - Array of audit log entries

**Authorization:**
- Requires admin privileges
- Returns empty array for non-admin users

### Hooks

#### useIsAdmin
React hook for client-side admin status detection.

**Returns:**
```typescript
{
  isAdmin: boolean      // true if user is admin
  isLoading: boolean    // true while checking status
}
```

**Usage:**
```typescript
const { isAdmin, isLoading } = useIsAdmin()

if (isLoading) return <Spinner />
if (isAdmin) {
  // Render admin controls
}
```

## Other notes

### Database Security
The system implements defense-in-depth with multiple security layers:

1. **Row Level Security (RLS) Policies**:
   - `Admins can update questions`: Allows UPDATE operations only for admin users
   - `Admins can manage question topics`: Allows INSERT/DELETE for topic associations
   - `Admins can insert audit logs`: Restricts audit log creation to admin users
   - `Admins can view audit logs`: Restricts audit log viewing to admin users

2. **Server-side Verification**: All admin actions call `verifyAdmin()` before processing

3. **Audit Trail**: All modifications are logged with user ID, timestamp, and change details

### Performance Considerations
- The `QuestionCard` component is memoized to prevent unnecessary re-renders
- Modal state is local to minimize re-renders of the parent component
- Cache invalidation is scoped to affected queries only
- Topics are cached for 10 minutes as they change infrequently

### Future Extensibility
The architecture supports future enhancements such as:
- Bulk editing capabilities (multiple questions at once)
- Role-based permissions beyond binary admin/non-admin
- Revision history with rollback functionality
- Admin activity dashboards and analytics
- Workflow approval systems for content changes

### Known Limitations
- Admin status changes require a page refresh to take effect due to cache timing
- Audit logs are limited to the last 10 entries per query for performance
- Topic associations require complete replacement (no partial updates)
- No real-time updates when multiple admins edit simultaneously