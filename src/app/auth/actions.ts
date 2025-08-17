'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
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
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  redirect('/dashboard/study')
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', data.user.id)
      .single()
    
    // If no profile or onboarding not completed, redirect to onboarding
    if (!profile || !profile.onboarding_completed) {
      redirect('/onboarding')
    }
  }
  
  redirect('/dashboard/study')
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