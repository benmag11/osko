'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserName(name: string) {
  if (!name || name.trim().length === 0) {
    return { error: 'Name cannot be empty' }
  }

  if (name.length > 100) {
    return { error: 'Name must be less than 100 characters' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to update your name' }
  }

  // Update name in user_profiles table
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      name: name.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update name:', error)
    return { error: 'Failed to update name. Please try again.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function verifyPasswordForEmailChange(password: string) {
  if (!password) {
    return { error: 'Password is required' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to change your email' }
  }

  // Verify password by attempting to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })

  if (error) {
    return { error: 'Incorrect password' }
  }

  return { success: true }
}

export async function requestEmailChange(newEmail: string, password: string) {
  if (!newEmail || !password) {
    return { error: 'Email and password are required' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    return { error: 'Please enter a valid email address' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to change your email' }
  }

  // Verify password first
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })

  if (passwordError) {
    return { error: 'Incorrect password' }
  }

  // Request email change - this will send a verification email to the new address
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'This email is already in use' }
    }
    return { error: 'Failed to update email. Please try again.' }
  }

  return { 
    success: true,
    message: 'Verification email sent to your new email address'
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  if (currentPassword === newPassword) {
    return { error: 'New password must be different from current password' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to change your password' }
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

  if (error) {
    console.error('Failed to update password:', error)
    return { error: 'Failed to update password. Please try again.' }
  }

  return { 
    success: true,
    message: 'Password updated successfully'
  }
}

export async function resendEmailVerification(newEmail: string) {
  if (!newEmail) {
    return { error: 'Email is required' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in' }
  }

  // Request email change again to resend verification
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    return { error: 'Failed to resend verification email. Please try again.' }
  }

  return { 
    success: true,
    message: 'Verification email resent'
  }
}