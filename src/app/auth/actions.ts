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
  
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists' }
  }
  
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

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  try {
    redirect('/')
  } catch (redirectError) {
    // redirect() throws a NEXT_REDIRECT error which is expected
    throw redirectError
  }
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
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
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('Failed to fetch user profile:', profileError)
        // Continue to dashboard even if profile fetch fails
      } else if (!profile || !profile.onboarding_completed) {
        // If no profile or onboarding not completed, redirect to onboarding
        redirect('/onboarding')
      }
    } catch (error) {
      if ((error as any)?.name === 'NEXT_REDIRECT') {
        throw error
      }
      console.error('Error checking onboarding status:', error)
    }
  }
  
  try {
    redirect('/dashboard/study')
  } catch (redirectError) {
    // redirect() throws a NEXT_REDIRECT error which is expected
    throw redirectError
  }
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