'use server'

import { createClient } from '@/lib/supabase/server'
import { saveUserSubjects } from '@/lib/services/subjects'
import type { OnboardingFormData } from './onboarding-client'

export async function saveOnboardingData(data: OnboardingFormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  // Start a transaction by performing operations sequentially
  // First, create or update user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      name: data.name,
      onboarding_completed: true,
    })
    .eq('user_id', user.id)

  if (profileError) {
    console.error('Profile error:', profileError)
    return { error: 'Failed to save profile' }
  }

  // Save user subjects using the service function
  const result = await saveUserSubjects(user.id, data.subjectIds)
  
  if (!result.success) {
    return { error: result.error || 'Failed to save subjects' }
  }

  return { success: true }
}

export async function checkOnboardingStatus() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { completed: false, error: 'User not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { completed: false }
  }

  return { completed: profile.onboarding_completed || false }
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
  const { data: subjects, error: subjectsError } = await supabase
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