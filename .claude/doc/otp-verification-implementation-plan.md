# OTP Verification Page Implementation Plan

## Overview
This document outlines the implementation plan for creating a beautiful OTP verification page that matches the existing authentication flow design in the application.

## Components to Create/Modify

### 1. **New Page: `/src/app/auth/verify/page.tsx`**
This will be the main OTP verification page that users are redirected to after signup.

**Structure:**
```tsx
// Key imports needed:
import { Suspense } from 'react'
import { GalleryVerticalEnd } from "lucide-react"
import { OTPVerificationForm } from "@/components/auth/otp-verification-form"

// Main page component wrapping the form in Suspense for search params
// Use same layout pattern as signin/signup pages with:
// - bg-muted background
// - min-h-svh for full viewport height
// - Centered content with max-w-sm container
// - Logo/branding header matching existing auth pages
```

### 2. **New Component: `/src/components/auth/otp-verification-form.tsx`**
The main form component that handles OTP verification logic.

**Key Features:**
- Client component ('use client')
- Read email from URL search params using `useSearchParams()`
- State management for:
  - OTP value (6 digits)
  - Loading states (verifying, resending)
  - Error messages
  - Resend cooldown timer (60 seconds)
  - Success state before redirect

**Component Structure:**
```tsx
// Main imports:
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyOtp, resendOtp } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OTPInput } from "@/components/auth/otp-input"

// State variables needed:
// - otp: string (6 digits)
// - isVerifying: boolean
// - isResending: boolean
// - error: string | null
// - resendCooldown: number (60 to 0)
// - isSuccess: boolean

// Key functions:
// - handleOtpComplete: auto-submit when 6 digits entered
// - handleVerify: call verifyOtp server action
// - handleResend: call resendOtp with cooldown
// - useEffect for countdown timer
```

### 3. **New Component: `/src/components/auth/otp-input.tsx`**
Custom OTP input component with 6 separate digit boxes.

**Important Implementation Details:**

**Option A: Use shadcn/ui input-otp (Recommended)**
Since input-otp component is available in shadcn/ui v4, we should install and use it:

```bash
npx shadcn@latest add input-otp
```

This will require installing the `input-otp` npm package as a dependency:
```bash
pnpm add input-otp
```

Then customize the component styling to match our design system.

**Option B: Custom Implementation (If input-otp installation fails)**
If we can't use the shadcn component, create a custom implementation with:

```tsx
// Key features for custom OTP input:
interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
}

// Implementation requirements:
// - 6 separate input refs using useRef array
// - Auto-focus management between inputs
// - Paste event handling (parse 6 digits from clipboard)
// - Keyboard navigation (backspace, arrow keys)
// - Visual error state with red borders
// - Disabled state during verification
```

## UI/UX Design Specifications

### Visual Design
1. **Layout Structure:**
   - Same background pattern as signin/signup (`bg-muted`)
   - Centered card with consistent padding
   - Logo at top with "Exam Papers" text
   - Max width of 400px (w-full max-w-sm)

2. **Card Content:**
   ```
   [Logo + Exam Papers]
   
   Card:
     Title: "Verify your email"
     Description: "We've sent a 6-digit code to [email]"
     
     [OTP Input - 6 boxes]
     
     [Verify Button - full width]
     
     Divider
     
     "Didn't receive the code?"
     [Resend Code Button/Timer]
     
     [Error Message if any]
   ```

3. **OTP Input Styling:**
   - 6 boxes with clear separation
   - Each box: 40-45px square (h-10 w-10 or h-11 w-11)
   - Border styling matching existing inputs
   - Focus state with ring (matching button focus)
   - Error state with destructive color border
   - Smooth transitions for all states

4. **Color Scheme:**
   - Follow existing theme variables
   - Normal border: `border-input`
   - Focus border: `border-ring` with ring
   - Error border: `border-destructive`
   - Success: brief green highlight before redirect

### Interaction Design

1. **Auto-focus Flow:**
   - First input auto-focused on page load
   - Next input auto-focused after digit entry
   - Previous input focused on backspace when empty

2. **Paste Handling:**
   - Support pasting full 6-digit code
   - Extract only numeric characters
   - Auto-submit if 6 valid digits pasted

3. **Keyboard Navigation:**
   - Arrow keys to move between inputs
   - Backspace to delete and move back
   - Enter to submit (if all 6 digits present)

4. **Loading States:**
   - Verify button shows "Verifying..." with spinner
   - OTP inputs disabled during verification
   - Resend button shows "Sending..." during resend

5. **Error Handling:**
   - Clear error message below inputs
   - Red border on all OTP inputs for invalid code
   - Error clears when user starts typing again

6. **Success Flow:**
   - Brief success message (optional)
   - Auto-redirect to dashboard/onboarding
   - Inputs show success state (green check or border)

## Implementation Steps

### Step 1: Install Dependencies
```bash
# Install input-otp package if using shadcn component
pnpm add input-otp

# Add the shadcn input-otp component
npx shadcn@latest add input-otp
```

### Step 2: Create OTP Input Component
1. Check if input-otp installed successfully in `/src/components/ui/`
2. If yes, use and customize the shadcn component
3. If no, implement custom OTP input component

### Step 3: Create Verification Form Component
1. Implement the main form logic
2. Add state management for all interactions
3. Integrate with server actions
4. Add resend cooldown timer

### Step 4: Create Verify Page
1. Create the page with proper layout
2. Add Suspense boundary for search params
3. Match existing auth page styling

### Step 5: Testing Checklist
- [ ] Email parameter correctly read from URL
- [ ] OTP input accepts only numbers
- [ ] Auto-focus progression works
- [ ] Paste functionality works
- [ ] Auto-submit on 6 digits works
- [ ] Verification server action called correctly
- [ ] Error states display properly
- [ ] Resend cooldown timer works
- [ ] Success redirect works
- [ ] Keyboard navigation works
- [ ] Mobile responsive design
- [ ] Accessibility (ARIA labels, focus management)

## Server Actions Already Available

The following server actions are already implemented in `/src/app/auth/actions.ts`:

1. **`verifyOtp(email: string, token: string)`**
   - Verifies the OTP with Supabase
   - Returns error object if failed
   - Redirects to `/onboarding` or `/dashboard/study` on success

2. **`resendOtp(email: string)`**
   - Resends OTP to the email
   - Returns `{ success: true }` or `{ error: message }`

## Important Notes

### State Management Pattern
Follow the existing pattern from login-form.tsx:
- Use `useState` for local state
- Use form actions with server actions
- Handle errors with try-catch and display in UI
- Use `useFormStatus` for submit button states if needed

### Styling Consistency
- Use `cn()` utility from `@/lib/utils` for className merging
- Follow existing spacing patterns (gap-6, gap-4, etc.)
- Use consistent text sizes (text-sm, text-xs for small text)
- Match existing card padding (px-6, py-6)

### Accessibility Requirements
- Proper ARIA labels for all inputs
- Announce errors to screen readers
- Maintain focus management for keyboard users
- Provide clear instructions and feedback

### Error Messages
Common error messages to handle:
- "Invalid verification code"
- "Code expired. Please request a new one"
- "Too many attempts. Please try again later"
- Network errors

### Browser Compatibility
- Ensure paste event works across browsers
- Test on mobile devices for touch interactions
- Verify auto-focus doesn't cause issues on mobile

## File Structure Summary

```
src/
├── app/
│   └── auth/
│       └── verify/
│           └── page.tsx          # New verification page
├── components/
│   ├── auth/
│   │   ├── otp-input.tsx        # New OTP input component (if custom)
│   │   └── otp-verification-form.tsx  # New verification form
│   └── ui/
│       └── input-otp.tsx        # shadcn component (if installed)
```

## Additional Considerations

1. **Email Validation**: Verify email parameter exists and is valid format
2. **Deep Linking**: Handle cases where users navigate directly without email param
3. **Session Management**: Check if user already verified and redirect
4. **Rate Limiting**: Consider frontend rate limiting for resend button
5. **Animation**: Add subtle transitions for better UX
6. **Mobile Experience**: Ensure number keyboard shows on mobile devices

## Dependencies Check

Before implementation, verify these are available:
- ✅ React hooks (useState, useEffect, useRef)
- ✅ Next.js navigation (useSearchParams, useRouter)
- ✅ Server actions (verifyOtp, resendOtp)
- ✅ UI components (Card, Button, Input)
- ✅ Utilities (cn function)
- ⚠️ input-otp package (needs installation)

## Success Criteria

The implementation is successful when:
1. Users can verify their email with a 6-digit code
2. The UI matches existing auth pages design
3. All interactions are smooth and intuitive
4. Error handling is comprehensive
5. The component is fully accessible
6. Works across all modern browsers and devices