# Settings Page Specification

## Overview
This specification defines the Account Settings page for our dashboard. The implementation must integrate with our existing Supabase backend and follow our established design system.

## Backend Integration Requirements
- **Database Understanding**: Explore all user tables, profiles, indexes, and RPC functions using Supabase MCP
- **System Comprehension**: Gain comprehensive understanding of the entire system architecture
- **Design Consistency**: Follow the design system outlined in `@docs/design_system_and_components.md`

## Page Structure

### Header
- **Main Header**: "Account"

### Section 1: Name
- **Subheader**: "Name"
- **Display**: Current user email in input box.
- **Functionality**: Once input box clicked,  an appropriately styled cancel and confirm butotn should appear beside it. 

### Section 2: Email
- **Subheader**: "Email"
- **Display**: Current user email in lighter text style
- **Action Button**: "Change email" outline button positioned to the right
- **Button Height**: Should match the combined height of the email subheader and email text

### Section 3: Password
- **Subheader**: "Password"
- **Display Text**: "Change the password to login to your account." (same styling as email text)
- **Action Button**: "Change password" outline button positioned to the right
- **Button Height**: Should match the combined height of the password subheader and descriptive text

## Interactive Flows

### Change Email Flow

#### Step 1: Password Verification
- **Trigger**: Click "Change email" button
- **Modal Content**:
  - Display current email: "Your current email is {current_email}"
  - Prompt: "Enter your password"
  - Password input field with clear (×) button on the right
  - "Continue" button (no cancel button)

#### Step 2: New Email Entry
- **Condition**: Password verification successful
- **Modal Extension**: Box extends to show new content
- **Content**:
  - Message: "Please enter new email, and we'll send you a verification code."
  - New email input field with clear (×) button on the right

#### Step 3: Verification Code
- **Trigger**: After new email is entered
- **Modal Extension**: Box extends further
- **Content**:
  - Prompt: "Enter the verification code sent to your email"
  - Verification code input field
  - "Change email" button at the bottom

### Change Password Flow

#### Single Step Modal
- **Trigger**: Click "Change password" button
- **Modal Content**:
  1. **Current Password**: "Enter your current password" input field
  2. **New Password**: "Enter a new password" input field
  3. **Confirm Password**: "Confirm your new password" input field
  - "Change password" button at the bottom to confirm

## Design Requirements
- The Account header should be at the top, then all the settings should be contained within a box with a slightly off white fill, use proper tailwind style.
- The subheadings should have serif font with the text underneath in Sans.
- Follow existing design system consistently
- Maintain proper spacing and alignment
- Use appropriate typography hierarchy
- Implement accessible form controls
- Ensure responsive behavior across devices
- Ensure complete production ready implementation for all aspects, you must carefully consider abosluteley everything that needs to be done for a production ready system.
- Ensure proper error handling and appropriate user messages
- We must use shadcn components wherever possible following existing architecture.
- The change email flow must have the dialog box extend to show the new input fields as the user progresses. it should not have new dialog boxes appear.