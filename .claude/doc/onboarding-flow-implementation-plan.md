# Notion-like Onboarding Flow Implementation Plan

## Overview
Design and implement a clean, minimal 2-step onboarding flow with Notion-like aesthetics for collecting user's name and subject preferences.

## Component Architecture

### 1. Main Onboarding Page Component
**File:** `/src/app/onboarding/page.tsx`

This will be the main container managing the multi-step flow state.

#### Key Features:
- Step state management (1 or 2)
- Form data collection (name, selected subjects)
- Progress indicator
- Smooth transitions between steps
- Mobile responsive layout

#### State Structure:
```typescript
interface OnboardingData {
  name: string
  subjects: Array<{
    name: string
    level: 'Higher' | 'Ordinary'
  }>
}
```

### 2. Step Components

#### Step 1: Name Collection Component
**File:** `/src/components/onboarding/name-step.tsx`

**Design Elements:**
- Centered card layout with max-width of 480px
- Large, clean heading: "Welcome! Let's get started"
- Subheading: "First, what should we call you?"
- Single input field with placeholder "Enter your name"
- Continue button (disabled until name is entered)
- Notion-style: neutral colors, subtle shadows, clean typography

**shadcn/ui Components Needed:**
- `Card` (already installed)
- `Input` (already installed)
- `Button` (already installed)
- `Label` (needs installation)

#### Step 2: Subject Selection Component
**File:** `/src/components/onboarding/subject-selection-step.tsx`

**Design Elements:**
- Full-width container with max-width of 1200px
- Two-column layout on desktop, single column on mobile
- Left side: Subject grid (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- Right side: Selected subjects sidebar (sticky on desktop)

**Subject Card Design:**
- Clean white card with subtle border
- Subject name as title
- Toggle group for "Higher" / "Ordinary" selection
- Checkbox indicator for selected state
- Hover effect: slight elevation and border color change
- Selected state: accent color border and background tint

**Selected Subjects Sidebar:**
- Title: "Selected Subjects (X)"
- List of selected subjects with level badges
- X button to remove each subject
- Empty state: "No subjects selected yet"
- Continue button at bottom (disabled if no subjects selected)

**shadcn/ui Components Needed:**
- `Card` (already installed)
- `Badge` (already installed)
- `Button` (already installed)
- `ToggleGroup` and `ToggleGroupItem` (need installation)
- `ScrollArea` (need installation)
- `Checkbox` (already installed)

### 3. Progress Indicator Component
**File:** `/src/components/onboarding/progress-indicator.tsx`

**Design Elements:**
- Minimal step indicator: "Step 1 of 2" text
- Optional: Progress bar showing 50% or 100% completion
- Positioned at top of the onboarding container

**shadcn/ui Components Needed:**
- `Progress` (needs installation)

### 4. Layout Wrapper Component
**File:** `/src/components/onboarding/onboarding-layout.tsx`

**Design Elements:**
- Centered container with vertical and horizontal centering
- Notion-like background: subtle gray (#FAFAFA or #F7F7F7)
- Optional: Minimal logo at top
- Smooth fade/slide transitions between steps

## File Structure
```
src/
├── app/
│   └── onboarding/
│       ├── page.tsx          # Main onboarding page
│       └── layout.tsx        # Optional custom layout
├── components/
│   └── onboarding/
│       ├── name-step.tsx
│       ├── subject-selection-step.tsx
│       ├── progress-indicator.tsx
│       ├── onboarding-layout.tsx
│       └── subject-card.tsx  # Individual subject card component
```

## Required shadcn/ui Component Installations

Run these commands to install missing components:
```bash
npx shadcn@latest add label
npx shadcn@latest add toggle-group
npx shadcn@latest add scroll-area
npx shadcn@latest add progress
```

## Styling Guidelines for Notion-like Appearance

### Color Palette
```css
/* CSS Variables to add/update */
--background: 0 0% 98%; /* #FAFAFA */
--card: 0 0% 100%; /* Pure white cards */
--border: 0 0% 92%; /* Subtle borders */
--primary: 0 0% 9%; /* Near black for text */
--muted: 0 0% 96%; /* For backgrounds */
--accent: 220 90% 56%; /* Blue accent for selections */
```

### Typography
- Use system font stack or Inter for Notion-like feel
- Font sizes: 
  - Headings: text-2xl to text-3xl
  - Body: text-base
  - Small text: text-sm
- Font weights: Normal (400) for body, Medium (500) for emphasis, Semibold (600) for headings

### Spacing
- Consistent padding: p-6 or p-8 for cards
- Gap between elements: gap-4 or gap-6
- Margin between sections: my-8 or my-12

### Animations
- Use Tailwind's transition classes for smooth interactions
- Fade in/out between steps: `transition-opacity duration-300`
- Slide animations: `transition-transform duration-300`
- Button hover: `transition-colors duration-200`

## Implementation Details

### Step 1 Implementation
```typescript
// Key implementation points:
- Use React Hook Form or useState for form management
- Validate name input (min 2 characters)
- Auto-focus on input field on mount
- Handle Enter key to proceed to next step
- Store name in parent component state
```

### Step 2 Implementation
```typescript
// Key implementation points:
- Map through all 32 subjects to create cards
- Use Set or Array for tracking selected subjects
- Implement toggle between Higher/Ordinary levels
- Maximum selection limit (optional)
- Sort subjects alphabetically
- Persist selections in parent state
- Handle batch selection/deselection
```

### Subject Data Structure
```typescript
const SUBJECTS = [
  'Accounting', 'Agricultural Science', 'Applied Maths', 'Art', 
  'Biology', 'Business', 'Chemistry', 'Classical Studies',
  'Computer Science', 'Construction Studies', 'Design & Communication Graphics',
  'Economics', 'Engineering', 'English', 'French', 'Geography',
  'German', 'History', 'Home Economics', 'Irish', 'Italian',
  'Japanese', 'LCVP', 'Mathematics', 'Music', 'Phys-Chem',
  'Physical Education', 'Physics', 'Politics and Society',
  'Religious Education', 'Spanish', 'Technology'
]
```

### State Management
```typescript
// Parent component state structure
const [currentStep, setCurrentStep] = useState(1)
const [formData, setFormData] = useState<OnboardingData>({
  name: '',
  subjects: []
})

// Navigation functions
const goToNextStep = () => setCurrentStep(prev => prev + 1)
const goToPrevStep = () => setCurrentStep(prev => prev - 1)
```

### Mobile Responsiveness
- Use Tailwind's responsive prefixes extensively
- Stack layout on mobile (single column)
- Side-by-side on desktop
- Adjust card sizes and spacing for different screens
- Consider touch-friendly tap targets (min 44x44px)

### Accessibility Considerations
- Proper ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Focus management between steps
- Screen reader announcements for step changes
- High contrast mode support

### API Integration Points
After onboarding completion:
```typescript
// Save user preferences
const saveUserPreferences = async (data: OnboardingData) => {
  // Call Supabase to save user data
  // Redirect to main application
}
```

## Testing Checklist
- [ ] Name validation works correctly
- [ ] Subject selection/deselection works
- [ ] Level toggle persists correctly
- [ ] Progress indicator updates
- [ ] Mobile layout responds properly
- [ ] Keyboard navigation works
- [ ] Form data persists between step navigation
- [ ] Accessibility requirements met
- [ ] Smooth animations between steps

## Performance Optimizations
- Lazy load Step 2 component (many subject cards)
- Memoize subject cards to prevent unnecessary re-renders
- Use CSS transforms for animations (GPU accelerated)
- Optimize images/icons if used in subject cards

## Future Enhancements
- Add subject icons for visual interest
- Implement subject search/filter
- Add subject descriptions on hover
- Save progress to localStorage
- Add back button on Step 2
- Add skip option for subject selection
- Animate subject card selections

## Notes for Implementation
1. **Important:** Use Tailwind v4 syntax as configured in the project
2. Ensure all new components follow the existing project structure
3. Use the existing `cn()` utility from `@/lib/utils` for className merging
4. Follow the project's TypeScript strict mode requirements
5. Test on multiple screen sizes before finalizing
6. Consider adding loading states for the final submission
7. The Continue button should show a loading state while saving

## Example Code Snippets

### Subject Card Component Structure
```tsx
<Card className="cursor-pointer transition-all hover:shadow-md hover:border-accent">
  <CardContent className="p-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-medium">{subject}</h3>
      <Checkbox checked={isSelected} />
    </div>
    <ToggleGroup type="single" value={level} onValueChange={setLevel}>
      <ToggleGroupItem value="Higher">Higher</ToggleGroupItem>
      <ToggleGroupItem value="Ordinary">Ordinary</ToggleGroupItem>
    </ToggleGroup>
  </CardContent>
</Card>
```

### Animation Wrapper
```tsx
<div className={cn(
  "transition-all duration-300",
  currentStep === 1 ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
)}>
  <NameStep />
</div>
```

This plan provides a comprehensive blueprint for implementing a clean, Notion-like onboarding flow that is both functional and aesthetically pleasing.