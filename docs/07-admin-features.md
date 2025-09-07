# Admin Features Documentation

## Overview

The admin features in this Next.js application provide a comprehensive system for managing question reports, editing question metadata, and tracking audit history. The system implements role-based access control (RBAC) with dedicated admin interfaces for maintaining data quality and responding to user feedback about exam questions.

## Architecture

The admin system follows a layered architecture with clear separation of concerns:

1. **Authentication Layer**: Admin verification at multiple levels (layout, server actions, database RLS)
2. **UI Layer**: Admin-specific components and pages
3. **Server Actions Layer**: Secure server-side operations with centralized admin verification
4. **Database Layer**: Row Level Security (RLS) policies enforcing admin-only access
5. **Audit Layer**: Comprehensive change tracking for accountability

### Design Patterns

- **Layout-based Route Protection**: Admin routes wrapped in a protective layout that verifies admin status
- **Centralized Admin Context**: Single source of truth for admin verification using React cache
- **Optimistic UI Updates**: React Query mutations with immediate feedback
- **Security Defense in Depth**: Multiple layers of authorization checks

## File Structure

### Admin Pages
- `/src/app/dashboard/(admin)/layout.tsx` - Admin route wrapper with authentication
- `/src/app/dashboard/(admin)/reports/page.tsx` - Reports dashboard page
- `/src/app/dashboard/(admin)/reports/reports-client.tsx` - Client-side reports management

### Admin Components
- `/src/components/admin/reports-table.tsx` - Table for displaying and managing reports
- `/src/components/admin/report-details-dialog.tsx` - Detailed report view with actions
- `/src/components/admin/question-edit-modal.tsx` - Modal for editing question metadata
- `/src/components/admin/audit-history.tsx` - Component for displaying change history

### Server Actions & Context
- `/src/lib/supabase/admin-actions.ts` - Admin-only server actions
- `/src/lib/supabase/admin-context.ts` - Centralized admin verification
- `/src/lib/supabase/report-actions.ts` - Report management actions

### Hooks
- `/src/lib/hooks/use-is-admin.ts` - Client-side admin status hook
- `/src/lib/hooks/use-audit-history.ts` - Hook for fetching audit logs

### User-facing Components
- `/src/components/questions/question-report-dialog.tsx` - Dialog for users to submit reports
- `/src/components/questions/question-card.tsx` - Question display with admin edit button

## Core Components

### Admin Layout Protection

The admin layout (`/src/app/dashboard/(admin)/layout.tsx`) provides the first line of defense:

```typescript
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  // Single admin verification for all admin routes
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    // Non-admin users are redirected to the main dashboard
    redirect('/dashboard/study')
  }
  
  // Admin verified - render children
  return <>{children}</>
}
```

### Reports Management Dashboard

The Reports Client (`reports-client.tsx`) provides a comprehensive interface for managing reports:

```typescript
export function ReportsClient({ initialReports, initialStatistics }: ReportsClientProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  
  // Fetch reports with filter
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: () => statusFilter === 'all' ? getReports() : getReports(statusFilter),
    initialData: statusFilter === 'all' ? initialReports : undefined,
    staleTime: 30 * 1000, // 30 seconds
  })
  
  // Statistics cards displaying pending, resolved, and categorized reports
  // Tabbed interface for filtering reports by status
  // Reports table with inline actions
}
```

### Question Edit Modal

The edit modal (`question-edit-modal.tsx`) allows admins to modify question metadata:

```typescript
export function QuestionEditModal({
  question,
  topics,
  open,
  onOpenChange,
  onUpdateComplete
}: QuestionEditModalProps) {
  // Form state for all editable fields
  const [year, setYear] = useState(question.year.toString())
  const [paperNumber, setPaperNumber] = useState(question.paper_number?.toString() || '')
  const [questionNumber, setQuestionNumber] = useState(question.question_number.toString())
  const [questionParts, setQuestionParts] = useState(question.question_parts.join(', '))
  const [examType, setExamType] = useState(question.exam_type)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    question.topics?.map(t => t.id) || []
  )
  
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
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['audit-history', question.id] })
      onUpdateComplete?.(data.auditLogId)
    }
  })
}
```

## Data Flow

### Report Submission Flow

1. **User Initiates Report**: User clicks report button on question card
2. **Dialog Opens**: `QuestionReportDialog` presents report type options
3. **Report Creation**: `createReport` server action validates and inserts report
4. **Admin Notification**: Report appears in admin dashboard with "pending" status
5. **Admin Review**: Admin views report details, including question metadata and audit history
6. **Resolution**: Admin either fixes the issue or dismisses the report
7. **Status Update**: Report marked as resolved/dismissed with optional admin notes

### Question Edit Flow

1. **Admin Access**: Admin clicks edit button (only visible to admins)
2. **Modal Opens**: `QuestionEditModal` loads with current metadata
3. **Validation**: Client-side validation of input fields
4. **Server Update**: `updateQuestionMetadata` performs atomic update
5. **Audit Log**: Automatic creation of audit log entry with before/after states
6. **Cache Invalidation**: React Query caches refreshed
7. **UI Update**: Changes reflected immediately across the application

## Key Functions and Hooks

### useIsAdmin Hook

Simple hook for checking admin status on the client:

```typescript
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}
```

### ensureAdmin Function

Server-side admin verification with caching:

```typescript
const getCachedAdminStatus = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()
  
  return profile?.is_admin ?? false
})

export async function ensureAdmin(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  
  // Use cached function to avoid multiple DB queries in the same request
  const isAdmin = await getCachedAdminStatus(user.id)
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return user.id
}
```

### updateQuestionMetadata Server Action

Secure server action for updating question metadata:

```typescript
export async function updateQuestionMetadata(
  questionId: string,
  updates: QuestionUpdatePayload
): Promise<{ success: boolean; error?: string; auditLogId?: string }> {
  try {
    await ensureAdmin() // Verify admin status
  } catch {
    return { success: false, error: 'Unauthorized' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  // Get current question data for audit log
  const { data: currentQuestion } = await supabase
    .from('questions')
    .select('*, question_topics(topic_id)')
    .eq('id', questionId)
    .single()
  
  // Update question metadata
  // Handle topic updates if provided
  // Create audit log entry
  
  return { success: true, auditLogId: auditLog?.id }
}
```

## Integration Points

### Sidebar Navigation

Admin-only navigation items are conditionally rendered:

```typescript
const navItems = [
  // ... other items
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: Flag,
    adminOnly: true, // Only shown to admins
  },
]

export function AppSidebar() {
  const { isAdmin } = useIsAdmin()
  
  // Filter nav items based on admin status
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin)
}
```

### Question Card Admin Actions

Admin edit button conditionally rendered on question cards:

```typescript
export const QuestionCard = memo(function QuestionCard({ question }: QuestionCardProps) {
  const { isAdmin } = useIsAdmin()
  
  return (
    <div className="card">
      {/* Question display */}
      {isAdmin && (
        <Button onClick={() => setShowEditModal(true)}>
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      )}
      {/* Report button available to all authenticated users */}
      <Button onClick={() => setShowReportDialog(true)}>
        <Flag className="h-4 w-4" />
        Report
      </Button>
    </div>
  )
})
```

## Configuration

### Database Tables

#### question_reports
- `id`: UUID primary key
- `question_id`: Reference to questions table
- `user_id`: Reporter's user ID
- `report_type`: 'metadata' | 'incorrect_topic' | 'other'
- `description`: Report details (10-500 characters)
- `status`: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
- `resolved_by`: Admin who resolved the report
- `resolved_at`: Resolution timestamp
- `admin_notes`: Optional admin comments
- `created_at`: Report creation timestamp

#### question_audit_log
- `id`: UUID primary key
- `question_id`: Reference to questions table
- `user_id`: Admin who made the change
- `action`: 'update' | 'delete' | 'topic_add' | 'topic_remove'
- `changes`: JSONB containing before/after states
- `created_at`: Change timestamp

#### user_profiles
- `is_admin`: Boolean flag for admin status

### RLS Policies

The database implements comprehensive Row Level Security:

```sql
-- Reports Table Policies
"Admins can view all reports": SELECT when is_admin = true
"Admins can update reports": UPDATE when is_admin = true
"Admins can delete reports": DELETE when is_admin = true
"Authenticated users can insert reports": INSERT when auth.uid() = user_id

-- Audit Log Policies
"Admins can view audit logs": SELECT when is_admin = true
"Admins can insert audit logs": INSERT when is_admin = true

-- User Profiles
"Users can view own profile": SELECT when auth.uid() = user_id
"Users can update own profile": UPDATE when auth.uid() = user_id
```

## Type Definitions

### Core Types

```typescript
export interface QuestionReport {
  id: string
  question_id: string
  user_id: string
  report_type: 'metadata' | 'incorrect_topic' | 'other'
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  resolved_by: string | null
  resolved_at: string | null
  admin_notes: string | null
  created_at: string
  question?: Question // Joined data
}

export interface QuestionAuditLog {
  id: string
  question_id: string
  user_id: string | null
  action: 'update' | 'delete' | 'topic_add' | 'topic_remove'
  changes: AuditLogChanges
  created_at: string
}

export type AuditLogChanges = 
  | { before: Partial<Question>; after: QuestionUpdatePayload } // for 'update' action
  | { deletedData: Question } // for 'delete' action  
  | { topicId: string; topicName: string } // for topic actions

export interface QuestionUpdatePayload {
  year?: number
  paper_number?: number | null
  question_number?: number
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  topic_ids?: string[]
}

export interface ReportStatistics {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  reports_by_type: {
    metadata: number
    incorrect_topic: number
    other: number
  }
}
```

## Implementation Details

### Audit History Component

The `AuditHistory` component provides detailed change tracking:

```typescript
export function AuditHistory({ questionId, topics = [] }: AuditHistoryProps) {
  const { history, isLoading, error } = useAuditHistory(questionId)
  
  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="border-l-2 border-stone-200 pl-3 py-2">
          <p className="text-xs text-warm-text-muted">
            {formatDateTime(entry.created_at)}
          </p>
          <ChangeSummary changes={entry.changes} action={entry.action} topics={topics} />
        </div>
      ))}
    </div>
  )
}
```

The component intelligently formats changes based on the action type:
- **Updates**: Shows before/after values for changed fields
- **Topic Changes**: Displays added/removed topic names
- **Field Changes**: Formats arrays, nulls, and complex data types appropriately

### Report Statistics Function

Database function for aggregating report statistics:

```sql
CREATE OR REPLACE FUNCTION public.get_report_statistics()
RETURNS TABLE(
  total_reports bigint, 
  pending_reports bigint, 
  resolved_reports bigint, 
  reports_by_type jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_reports,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_reports,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_reports,
    jsonb_build_object(
      'metadata', COUNT(*) FILTER (WHERE report_type = 'metadata'),
      'incorrect_topic', COUNT(*) FILTER (WHERE report_type = 'incorrect_topic'),
      'other', COUNT(*) FILTER (WHERE report_type = 'other')
    ) as reports_by_type
  FROM question_reports;
END;
$$
```

### Cache Management

The admin features use React Query's caching strategies:

```typescript
// Reports refresh every 30 seconds
const { data: reports } = useQuery({
  queryKey: ['reports', statusFilter],
  queryFn: () => getReports(statusFilter),
  staleTime: 30 * 1000,
})

// Audit history cached for 5 minutes
export function useAuditHistory(questionId: string) {
  const { data: history } = useQuery({
    queryKey: ['audit-history', questionId],
    queryFn: () => getQuestionAuditHistory(questionId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
```

## Dependencies

### External Dependencies
- `@tanstack/react-query`: State management for server data
- `sonner`: Toast notifications for user feedback
- `lucide-react`: Icon components

### Internal Dependencies
- Supabase client libraries for database operations
- shadcn/ui components for consistent UI
- Custom hooks for user profile and authentication
- Centralized cache configuration

## API Reference

### Server Actions

#### `updateQuestionMetadata(questionId: string, updates: QuestionUpdatePayload)`
Updates question metadata with automatic audit logging.
- **Authorization**: Admin only
- **Returns**: `{ success: boolean; error?: string; auditLogId?: string }`

#### `createReport(payload: CreateReportPayload)`
Creates a new question report.
- **Authorization**: Authenticated users
- **Validation**: Prevents duplicate reports from same user
- **Returns**: `{ success: boolean; error?: string }`

#### `updateReportStatus(reportId: string, updates: UpdateReportPayload)`
Updates report status and adds admin notes.
- **Authorization**: Admin only
- **Auto-populates**: `resolved_by` and `resolved_at` when resolving
- **Returns**: `{ success: boolean; error?: string }`

#### `getReports(status?: ReportStatus)`
Fetches reports with optional status filter.
- **Authorization**: Admin only
- **Includes**: Joined question and topic data
- **Returns**: `QuestionReport[]`

#### `getReportStatistics()`
Fetches aggregated report statistics.
- **Authorization**: Admin only
- **Returns**: `ReportStatistics | null`

#### `getQuestionAuditHistory(questionId: string)`
Fetches audit log entries for a question.
- **Authorization**: Admin only
- **Order**: Descending by creation date
- **Returns**: `QuestionAuditLog[]`

### Client Hooks

#### `useIsAdmin()`
Returns current user's admin status.
- **Returns**: `{ isAdmin: boolean; isLoading: boolean }`

#### `useAuditHistory(questionId: string)`
Fetches and caches audit history for a question.
- **Returns**: `{ history: QuestionAuditLog[]; isLoading: boolean; error: Error | null }`

## Other Notes

### Security Considerations

1. **Multi-layer Authorization**: Admin status is verified at the layout level, in server actions, and through database RLS policies
2. **CSRF Protection**: All mutations go through server actions with built-in CSRF protection
3. **Input Validation**: Both client-side and server-side validation for all user inputs
4. **Audit Trail**: All admin actions are logged with user identification
5. **Cache Isolation**: User-specific query clients prevent data leakage between sessions

### Performance Optimizations

1. **Cached Admin Status**: Uses React's cache to prevent redundant database queries
2. **Optimistic Updates**: UI updates immediately while server operations complete
3. **Stale-While-Revalidate**: React Query's SWR pattern for responsive UIs
4. **Selective Invalidation**: Only affected queries are invalidated after mutations
5. **Initial Data**: Server-rendered data passed as initial query data

### Error Handling

1. **Graceful Degradation**: Non-admin users see regular interface without admin features
2. **User-Friendly Messages**: Toast notifications for all success and error states
3. **Fallback States**: Loading skeletons and empty states for better UX
4. **Automatic Retries**: React Query's retry logic for transient failures

### Maintenance Notes

1. **Audit Log Retention**: Currently no automatic cleanup - consider implementing retention policy
2. **Report Archival**: Resolved reports remain in database - may need archival strategy
3. **Performance Monitoring**: Monitor query performance as report volume grows
4. **Admin Activity Logs**: Consider additional logging for sensitive admin actions
5. **Role Expansion**: System designed to support additional roles beyond binary admin/user