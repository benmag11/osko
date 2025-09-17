# Zoom Functionality Specification

## Overview

This specification outlines the implementation of zoom controls for question card images in the exam viewer. The solution enables users to dynamically scale question cards (both question images and marking schemes) while maintaining optimal performance, viewport position, and user experience with large datasets (100+ questions).

## Architecture Decision: CSS Transform Scale Approach

After comprehensive research comparing CSS `zoom` vs `transform: scale()`, **CSS transform scale** emerges as the optimal solution:

### Why Transform Scale Over CSS Zoom:
1. **Performance**: Doesn't trigger layout recalculation unlike `zoom`
2. **Browser Compatibility**: Standardized and predictable across all browsers
3. **Hardware Acceleration**: GPU-accelerated transformations for smooth performance
4. **Layout Preservation**: Maintains document flow while scaling visual representation
5. **Animation Support**: Full CSS transition/animation capabilities

### Performance Research Findings:
- `zoom` affects page layout causing expensive recalculation for large lists
- `transform: scale()` only alters visual representation without layout impact
- MDN recommends `transform: scale()` as the standard alternative to `zoom`
- Chrome performing double zoom operations when both properties exist

## Current Architecture Analysis

### Existing Components:
1. **QuestionCard** (`src/components/questions/question-card.tsx:18`):
   - Displays question and marking scheme images
   - Uses Next.js Image component with fixed dimensions (1073x800)
   - Memoized for performance optimization
   - Contains marking scheme toggle functionality

2. **FilteredQuestionsView** (`src/components/questions/filtered-questions-view.tsx:15`):
   - Orchestrates question display with infinite scroll
   - Maps through questions array rendering QuestionCard components
   - Uses separator between question cards

3. **useQuestionsQuery** (`src/lib/hooks/use-questions-query.ts:16`):
   - Implements infinite scroll with Intersection Observer
   - Uses cursor-based pagination for performance
   - Manages deduplication and state management

4. **Layout Structure** (`src/app/subject/[slug]/page.tsx:67`):
   - SidebarProvider with ExamSidebar for filters
   - SidebarInset containing main content
   - Max-width container (max-w-4xl) for content

## Implementation Specification

### 1. State Management

#### Zoom Context Provider
Create a new context provider for zoom state management:

```tsx
// src/components/providers/zoom-provider.tsx
interface ZoomContextValue {
  zoomLevel: number        // Scale factor (0.5 to 2.0)
  zoomIn: () => void      // Increase scale by 0.1
  zoomOut: () => void     // Decrease scale by 0.1
  resetZoom: () => void   // Reset to 1.0
}
```

#### Zoom Levels:
- **Minimum**: 0.5 (50% scale)
- **Default**: 1.0 (100% scale)
- **Maximum**: 2.0 (200% scale)
- **Step Size**: 0.1 (10% increments)

#### State Persistence:
Use localStorage to persist zoom level across sessions:
```tsx
const useZoomPersistence = () => {
  const [zoomLevel, setZoomLevel] = useLocalStorage('exam-zoom-level', 1.0)
  // Implementation with validation and fallbacks
}
```

### 2. UI Components

#### Zoom Controls Component
```tsx
// src/components/zoom/zoom-controls.tsx
const ZoomControls = () => {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg border border-stone-200 p-2 shadow-lg">
      <Button
        onClick={zoomOut}
        disabled={zoomLevel <= 0.5}
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <Button
        onClick={zoomIn}
        disabled={zoomLevel >= 2.0}
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

#### Control Positioning:
- **Fixed Position**: `fixed top-4 right-4 z-50`
- **Styling**: Semi-transparent background with backdrop blur
- **Z-index**: High enough to float above sidebar and content
- **Responsive**: Adjust position for mobile viewports

### 3. Scroll Position Preservation

#### Challenge:
When scaling content, the user's viewport position must be maintained to prevent disorientation.

#### Solution: Element-Based Scroll Anchoring
```tsx
const useScrollPreservation = (zoomLevel: number) => {
  const preserveScrollPosition = useCallback((newZoomLevel: number) => {
    // Find the question card currently in the viewport center
    const cards = document.querySelectorAll('[data-question-id]')
    const viewportCenter = window.innerHeight / 2

    let anchorCard: Element | null = null
    let anchorOffset = 0

    // Find which card is at viewport center
    for (const card of cards) {
      const rect = card.getBoundingClientRect()
      if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
        anchorCard = card
        anchorOffset = viewportCenter - rect.top // Distance from card top to viewport center
        break
      }
    }

    // Apply zoom change
    setZoomLevel(newZoomLevel)

    // Restore position to keep same card at same viewport position
    if (anchorCard) {
      requestAnimationFrame(() => {
        const newRect = anchorCard.getBoundingClientRect()
        const scrollAdjustment = newRect.top - (viewportCenter - anchorOffset * newZoomLevel)
        window.scrollBy(0, scrollAdjustment)
      })
    }
  }, [])
}
```

### 4. Container Architecture

#### Approach: Wrapper-Based Scaling
Use a wrapper/content structure to maintain proper layout:

```tsx
// Apply zoom with wrapper approach
<div className="zoom-wrapper"> {/* Maintains original space in document flow */}
  <div
    className="zoom-content"
    style={{
      transform: `scale(${zoomLevel})`,
      transformOrigin: '0 0', // Scale from top-left to prevent centering issues
      width: `${100 / zoomLevel}%`, // Compensate width to fill container
    }}
  >
    {/* Question cards here */}
  </div>
</div>
```

#### CSS Structure:
```css
.zoom-wrapper {
  width: 100%;
  overflow: visible;
  /* No height manipulation needed - let content flow naturally */
}

.zoom-content {
  transform-origin: left top;
  will-change: transform;
  transition: transform 0.2s ease-out;
}
```

### 5. Performance Optimizations

#### Debouncing:
Implement debounced zoom changes to prevent excessive re-renders:
```tsx
const debouncedZoomChange = useMemo(
  () => debounce((newZoom: number) => {
    setZoomLevel(newZoom)
  }, 100),
  []
)
```

#### Intersection Observer Optimization:
Dynamically adjust intersection observer margin based on zoom level:
```tsx
const scaledRootMargin = useMemo(() => {
  // Adjust margin based on zoom to maintain consistent trigger point
  const baseMargin = 200
  // When zoomed out, we need more margin because visual distance is compressed
  return `${baseMargin / zoomLevel}px`
}, [zoomLevel])

const intersectionOptions = useMemo(() => ({
  threshold: 0,
  rootMargin: scaledRootMargin
}), [scaledRootMargin])
```

#### Image Loading:
Maintain current Next.js Image optimization while scaling containers rather than changing image dimensions.

### 6. Implementation Strategy

#### Phase 1: Core Infrastructure
1. Create ZoomProvider context
2. Implement useZoom hook with localStorage persistence
3. Create ZoomControls component
4. Add zoom context to subject page layout

#### Phase 2: Integration
1. Wrap QuestionCard components with zoom-aware containers
2. Implement scroll position preservation
3. Add zoom controls to subject page layout
4. Test with varying question counts

#### Phase 3: Optimization
1. Implement debouncing for performance
2. Add transition animations
3. Optimize intersection observer settings
4. Mobile responsive adjustments

### 7. File Changes Required

#### New Files:
```
src/
  components/
    providers/
      zoom-provider.tsx          # Zoom state management
    zoom/
      zoom-controls.tsx          # UI controls component
  lib/
    hooks/
      use-zoom.ts               # Zoom logic hook
      use-scroll-preservation.ts # Scroll position management
    utils/
      zoom-utils.ts             # Utility functions
```

#### Modified Files:
```
src/app/subject/[slug]/page.tsx           # Add ZoomProvider and ZoomControls
src/components/questions/filtered-questions-view.tsx # Add zoom wrapper/content structure
src/components/questions/question-card.tsx # Add data-question-id attributes
src/lib/hooks/use-questions-query.ts      # Add dynamic intersection observer margin
```

### 8. CSS Considerations

#### Container Scaling:
```css
.zoom-content {
  transform: scale(var(--zoom-scale));
  transform-origin: left top; /* Scale from top-left corner */
  transition: transform 0.2s ease-out;
  will-change: transform; /* Optimize for frequent changes */
}
```

#### Layout Structure:
```css
.zoom-wrapper {
  /* Wrapper maintains document flow without height manipulation */
  width: 100%;
  position: relative;
  overflow: visible;
}

/* Adjust max-width container when zoomed out */
.content-container[data-zoom-level] {
  --adjusted-max-width: calc(64rem / var(--zoom-scale));
  max-width: min(var(--adjusted-max-width), 90vw);
}
```

### 9. Accessibility Considerations

1. **Keyboard Navigation**: Support `Ctrl +/-` shortcuts
2. **ARIA Labels**: Proper labeling for screen readers
3. **Focus Management**: Maintain focus during zoom changes
4. **High Contrast**: Ensure controls remain visible in high contrast modes

### 10. Testing Strategy

#### Unit Tests:
- Zoom state management functions
- Scroll preservation calculations
- Boundary condition handling (min/max zoom)

#### Integration Tests:
- Infinite scroll with zoom changes
- Image loading at different zoom levels
- Performance with large question datasets

#### User Experience Tests:
- Smooth zoom transitions
- Viewport position maintenance
- Mobile responsiveness

### 11. Browser Compatibility

#### Primary Support:
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

#### Fallback Strategy:
```css
@supports not (transform: scale(1)) {
  /* Fallback for older browsers - use zoom property */
  .zoom-content {
    zoom: var(--zoom-scale);
    transform: none;
  }
}
```

### 12. Performance Metrics

#### Target Metrics:
- **Zoom Transition**: < 200ms smooth animation
- **Scroll Preservation**: < 50ms position restoration
- **Memory Usage**: No significant increase with zoom changes
- **Infinite Scroll**: Maintain current performance benchmarks

#### Monitoring:
- Track zoom usage patterns via analytics
- Monitor performance impact on various devices
- Measure user engagement with zoom features

## Critical Improvements Made

This revised specification addresses the following critical issues from the original plan:

### Fixed Issues:
1. **Scroll Position Preservation**: Changed from percentage-based to element-based anchoring to maintain view of specific questions when zooming
2. **Container Height Bug**: Removed incorrect `height: calc(100% / var(--zoom-scale))` formula that would create empty space
3. **Transform Origin**: Changed from `top center` to `top left` with width compensation to prevent content shifting
4. **Intersection Observer**: Inverted the margin scaling formula to properly compensate for visual compression

### Key Architecture Changes:
- **Wrapper/Content Structure**: Eliminates complex height calculations
- **Element Anchoring**: Users stay focused on the same question during zoom
- **Dynamic Observer Margins**: Infinite scroll triggers correctly at all zoom levels
- **No Empty Space**: Content flows naturally without artificial height manipulation

## Conclusion

This revised specification provides a robust zoom implementation that:

1. **Maintains User Position**: Element-based anchoring keeps users viewing the same content
2. **Prevents Layout Issues**: No empty space or content jumping when zooming
3. **Ensures Smooth Performance**: Hardware-accelerated transforms with proper optimization
4. **Handles Edge Cases**: Works correctly with infinite scroll at all zoom levels
5. **Follows Best Practices**: Clean architecture without complex height calculations

The implementation is now ready for development with these critical fixes in place.