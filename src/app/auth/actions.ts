'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { extractAuthFormData } from '@/lib/utils/form-validation'

export async function signUp(formData: FormData) {
  let email: string
  let password: string
  
  try {
    const validated = extractAuthFormData(formData)
    email = validated.email
    password = validated.password
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid form data' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // Note: if the email is already registered, Supabase returns a fake user
  // with identities: []. We intentionally do NOT check for this — revealing
  // whether an email exists is an enumeration vulnerability (OWASP).
  // The user is redirected to verification regardless; they simply won't
  // receive an email if the account already exists.

  // Redirect to verification page with email as query parameter
  try {
    redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
  } catch (redirectError) {
    // redirect() throws a NEXT_REDIRECT error which is expected
    throw redirectError
  }
}

export async function signIn(formData: FormData) {
  let email: string
  let password: string
  
  try {
    const validated = extractAuthFormData(formData)
    email = validated.email
    password = validated.password
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid form data' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  try {
    redirect('/dashboard/study')
  } catch (redirectError) {
    // redirect() throws a NEXT_REDIRECT error which is expected
    throw redirectError
  }
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // Check if user has completed onboarding
  if (data?.user) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', data.user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      // Continue to dashboard even if profile fetch fails
    } else if (!profile || !profile.onboarding_completed) {
      return { success: true, redirectTo: '/onboarding' }
    }
  }

  return { success: true, redirectTo: '/dashboard/study' }
}

export async function resendOtp(email: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email')

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { error: 'Please provide a valid email address' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim())

  // Only surface rate-limit errors — never reveal whether the email exists
  if (error) {
    if (error.status === 429) {
      return { error: 'Too many requests. Please try again later.' }
    }
    // Silently succeed for all other errors (e.g. email not found)
    console.error('Password reset error:', error.message)
  }

  return { success: true }
}

export async function verifyPasswordResetOtp(email: string, token: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, redirectTo: '/auth/reset-password' }
}

export async function resendPasswordResetCode(email: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  // Only surface rate-limit errors — never reveal whether the email exists
  if (error) {
    if (error.status === 429) {
      return { error: 'Too many requests. Please try again later.' }
    }
    console.error('Resend password reset error:', error.message)
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password')
  const confirmPassword = formData.get('confirmPassword')

  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createServerSupabaseClient()

  // Verify the user has an active session from the recovery flow
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Your reset session has expired. Please request a new password reset.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  // Sign out after password change — forces fresh login for security
  await supabase.auth.signOut()

  return { success: true }
}