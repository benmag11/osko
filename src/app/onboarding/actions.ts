'use server'

import { createClient } from '@/lib/supabase/server'
import { saveUserSubjects } from '@/lib/services/subjects'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

export interface ServerActionError {
  error: string
  code?: 'AUTH_ERROR' | 'PROFILE_ERROR' | 'SUBJECTS_ERROR' | 'UNKNOWN_ERROR'
}

export async function saveOnboardingData(
  data: OnboardingFormData
): Promise<ServerActionError | never> {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error during onboarding:', userError)
      return { 
        error: 'You must be logged in to complete onboarding. Please sign in and try again.',
        code: 'AUTH_ERROR'
      }
    }

    // Validate input data
    if (!data.name || data.name.trim().length < 1) {
      return {
        error: 'Please enter your name to continue.',
        code: 'PROFILE_ERROR'
      }
    }

    if (!data.subjectIds || data.subjectIds.length === 0) {
      return {
        error: 'Please select at least one subject to continue.',
        code: 'SUBJECTS_ERROR'
      }
    }

    // Start a transaction by performing operations sequentially
    // First, create or update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        name: data.name.trim(),
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Profile save error:', profileError)
      return { 
        error: 'Failed to save your profile. Please try again.',
        code: 'PROFILE_ERROR'
      }
    }

    // Save user subjects using the service function
    const result = await saveUserSubjects(user.id, data.subjectIds)
    
    if (!result.success) {
      console.error('Subjects save error:', result.error)
      // Roll back profile update if subjects fail
      await supabase
        .from('user_profiles')
        .update({ onboarding_completed: false })
        .eq('user_id', user.id)
      
      return { 
        error: result.error || 'Failed to save your subjects. Please try again.',
        code: 'SUBJECTS_ERROR'
      }
    }

    // Revalidate the dashboard page to ensure fresh data
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/study')
    
    // Redirect to dashboard after successful save
    // This will throw a NEXT_REDIRECT which is expected behavior
    redirect('/dashboard/study')
  } catch (error) {
    // This catch will only handle unexpected errors
    // redirect() throws NEXT_REDIRECT which should not be caught
    console.error('Unexpected error during onboarding:', error)
    return {
      error: 'An unexpected error occurred. Please refresh the page and try again.',
      code: 'UNKNOWN_ERROR'
    }
  }
}

export async function checkOnboardingStatus(): Promise<{
  completed: boolean
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { completed: false, error: 'User not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      // User exists but no profile yet - this is expected for new users
      if (profileError.code === 'PGRST116') {
        return { completed: false }
      }
      console.error('Error checking onboarding status:', profileError)
      return { completed: false }
    }

    return { completed: profile?.onboarding_completed || false }
  } catch (error) {
    console.error('Unexpected error checking onboarding status:', error)
    return { completed: false, error: 'Failed to check onboarding status' }
  }
}

export async function getUserProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    return { error: 'Profile not found' }
  }

  // Get user subjects with joined subject details
  const { data: subjects } = await supabase
    .from('user_subjects')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('user_id', user.id)

  return { 
    profile,
    subjects: subjects || []
  }
}