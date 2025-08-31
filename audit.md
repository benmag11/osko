# Codebase Audit Report

## Executive Summary

Following the exam-viewer branch merge, a comprehensive audit reveals several critical issues requiring immediate attention. The codebase contains significant redundancy in the filter component architecture, inconsistent error handling patterns, missing abort signal implementations, and duplicated query logic between server and client components. While the overall architecture is solid, there are multiple areas where code quality and maintainability can be significantly improved.

## Critical Issues Requiring Immediate Attention

### CRITICAL Priority Issues

1. **Missing Question Number Filter Implementation**
   - `/src/lib/supabase/client-queries.ts` line 39: Missing `p_question_numbers` parameter
   - The client-side query function doesn't pass question numbers despite UI supporting it
   - This causes the question number filter to be non-functional in the UI

2. **Inefficient Profile Fetching in Middleware**
   - `/src/middleware.ts` lines 48-62: Profile fetching not properly cached across checks
   - Multiple database calls for the same profile data within single request
   - Could cause performance issues at scale

### HIGH Priority Issues

1. **Duplicate Filter Components**
   - Redundant implementations: `YearFilter` vs `YearFilterAccordion`, `TopicFilter` vs `TopicFilterAccordion`
   - Both versions do essentially the same thing with different UI libraries
   - Maintenance burden and confusion about which to use

2. **Inconsistent Error Handling**
   - `/src/lib/supabase/queries.ts`: Uses QueryError class with retry logic
   - `/src/lib/supabase/client-queries.ts`: Plain error throwing without retry
   - No standardized error boundary implementation

3. **Incomplete Abort Signal Implementation**
   - `/src/lib/supabase/client-queries.ts` line 42: Incorrect abort promise handling
   - Returns object instead of throwing, breaking error flow

## Section Analysis

### Database Query Layer (`/src/lib/supabase/`)

#### Issues Found:

**1. Duplicate Search Query Implementation**
- **Current**: Both `queries.ts` (server) and `client-queries.ts` (client) implement search logic
- **Issue**: Code duplication, maintenance overhead, potential for divergence
- **Recommended Fix**: Create shared query builder function
- **Priority**: HIGH
- **Estimated Effort**: 4 hours

```typescript
// Current duplication
// queries.ts line 193-247 and client-queries.ts line 10-55

// Recommended: shared query builder
export function buildSearchQuery(filters: Filters, cursor?: QuestionCursor | null) {
  return {
    p_subject_id: filters.subjectId,
    p_search_terms: filters.searchTerms || null,
    p_years: filters.years || null,
    p_topic_ids: filters.topicIds || null,
    p_exam_types: filters.examTypes || null,
    p_question_numbers: filters.questionNumbers || null, // Missing in client!
    p_cursor: cursor || null,
    p_limit: 20
  }
}
```

**2. Missing Error Recovery in Client Queries**
- **Current**: No retry logic in client-side queries
- **Issue**: Poor resilience to transient failures
- **Priority**: HIGH
- **Estimated Effort**: 2 hours

### Filter Components (`/src/components/filters/`)

#### Issues Found:

**1. Redundant Component Implementations**
- **Files**:
  - `/src/components/filters/year-filter.tsx` (uses Collapsible)
  - `/src/components/filters/year-filter-accordion.tsx` (uses Accordion)
  - `/src/components/filters/topic-filter.tsx` (uses Collapsible)
  - `/src/components/filters/topic-filter-accordion.tsx` (uses Accordion)
  - `/src/components/filters/collapsible-filter.tsx` (unused)
  
- **Issue**: Multiple implementations of same functionality
- **Recommended Fix**: Consolidate to single implementation with prop-based UI switching
- **Priority**: HIGH
- **Estimated Effort**: 6 hours

**2. Unused CollapsibleFilter Component**
- **File**: `/src/components/filters/collapsible-filter.tsx`
- **Issue**: Component not imported anywhere, dead code
- **Priority**: MEDIUM
- **Estimated Effort**: 15 minutes

### Type Definitions (`/src/lib/types/database.ts`)

#### Issues Found:

**1. Inconsistent Type Exports**
- **Current**: Mix of interfaces and types without clear convention
- **Issue**: No clear pattern for when to use interface vs type
- **Recommended Fix**: Use interfaces for data models, types for unions/intersections
- **Priority**: LOW
- **Estimated Effort**: 2 hours

**2. Missing JSDoc Comments**
- **Issue**: Complex types like `QuestionCursor` lack documentation
- **Priority**: LOW
- **Estimated Effort**: 1 hour

### Authentication & Middleware (`/src/middleware.ts`)

#### Issues Found:

**1. Inefficient Profile Caching**
```typescript
// Current implementation (lines 48-62)
let profile: { onboarding_completed: boolean } | null = null
let profileFetched = false

const getProfile = async () => {
  if (!profileFetched) {
    // This doesn't work as intended - profileFetched is scoped wrong
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()
    profile = data
    profileFetched = true
  }
  return profile
}
```

- **Issue**: Variables scoped incorrectly, causing multiple fetches
- **Recommended Fix**: Move profile fetching outside conditional blocks
- **Priority**: HIGH
- **Estimated Effort**: 2 hours

### Component Architecture

#### Issues Found:

**1. Inconsistent Client/Server Component Boundaries**
- **Issue**: Some components marked 'use client' unnecessarily
- **Example**: `/src/components/layout/exam-sidebar.tsx` could be server component
- **Priority**: MEDIUM
- **Estimated Effort**: 4 hours

**2. Missing Loading States**
- **Issue**: No skeleton loaders for filter components during data fetch
- **Priority**: MEDIUM
- **Estimated Effort**: 3 hours

### Performance Patterns

#### Issues Found:

**1. Missing Memoization**
- **Location**: Filter components re-render on every state change
- **Issue**: No use of React.memo or useMemo for expensive computations
- **Priority**: MEDIUM
- **Estimated Effort**: 3 hours

**2. Unoptimized Bundle Size**
- **Issue**: Importing entire lodash/lucide libraries instead of specific functions
- **Priority**: LOW
- **Estimated Effort**: 2 hours

## Systemic Patterns

### Cross-Cutting Issues

1. **Inconsistent Error Boundaries**
   - No standardized error boundary components
   - Error handling scattered across components
   - Missing user-friendly error messages

2. **Lack of Component Documentation**
   - No Storybook or component documentation
   - Props interfaces not documented
   - Usage examples missing

3. **Testing Infrastructure**
   - No unit tests for critical functions
   - Missing integration tests for filters
   - No E2E test coverage

4. **Code Organization**
   - Mixed patterns between features and technical layers
   - Inconsistent file naming (kebab-case vs PascalCase)
   - No clear module boundaries

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. Fix question number filter in client queries
2. Fix middleware profile caching
3. Implement proper abort signal handling

### Phase 2: High Priority Consolidation (Week 2)
1. Consolidate duplicate filter components
2. Standardize error handling patterns
3. Add retry logic to client queries
4. Remove dead code

### Phase 3: Medium Priority Improvements (Week 3)
1. Optimize client/server component boundaries
2. Add loading states and skeletons
3. Implement memoization strategies
4. Create shared query builders

### Phase 4: Quality & Maintainability (Week 4)
1. Add comprehensive error boundaries
2. Document component APIs
3. Set up basic test infrastructure
4. Optimize bundle size

## Resource Requirements

### Immediate (Critical Issues)
- **Effort**: 8-10 hours
- **Impact**: Fixes breaking functionality
- **Risk**: Low - straightforward fixes

### Short-term (High Priority)
- **Effort**: 20-25 hours
- **Impact**: Significant code reduction, better maintainability
- **Risk**: Medium - requires careful testing

### Medium-term (Medium Priority)
- **Effort**: 15-20 hours
- **Impact**: Better performance, user experience
- **Risk**: Low - incremental improvements

### Long-term (Low Priority)
- **Effort**: 10-15 hours
- **Impact**: Developer experience, long-term maintainability
- **Risk**: Low - can be done gradually

## Recommendations

### Immediate Actions
1. **Fix the question number filter bug** - This is user-facing and broken
2. **Choose single filter component pattern** - Either Accordion or Collapsible, not both
3. **Standardize error handling** - Use QueryError class consistently

### Best Practices to Adopt
1. **Component Composition**: Use composition over duplication
2. **Error Boundaries**: Implement at route level minimum
3. **Type Safety**: Leverage TypeScript more effectively
4. **Performance**: Add React Query devtools for debugging

### Technical Debt Prevention
1. **Code Reviews**: Focus on preventing duplication
2. **Documentation**: Require JSDoc for public APIs
3. **Testing**: Add tests before new features
4. **Refactoring**: Schedule regular cleanup sprints

## Conclusion

The codebase is fundamentally sound but suffers from post-merge integration issues and accumulated technical debt. The most critical issues are straightforward to fix and should be addressed immediately. The redundant filter components represent the largest maintenance burden and should be consolidated as a priority. 

Following the recommended roadmap will result in a more maintainable, performant, and reliable application while reducing the overall code footprint by an estimated 20-30%.