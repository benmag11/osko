'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { OnboardingData } from './page'

export async function saveOnboardingData(data: OnboardingData) {
  const supabase = await createServerSupabaseClient()
  
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

  // Delete existing subjects for this user (in case they're re-onboarding)
  const { error: deleteError } = await supabase
    .from('user_subjects')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error: 'Failed to update subjects' }
  }

  // Insert new subjects
  if (data.subjects.length > 0) {
    const subjectsToInsert = data.subjects.map(subject => ({
      user_id: user.id,
      subject_name: subject.name,
      level: subject.level
    }))

    const { error: subjectsError } = await supabase
      .from('user_subjects')
      .insert(subjectsToInsert)

    if (subjectsError) {
      console.error('Subjects error:', subjectsError)
      return { error: 'Failed to save subjects' }
    }
  }

  return { success: true }
}

export async function checkOnboardingStatus() {
  const supabase = await createServerSupabaseClient()
  
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

  return { completed: profile.onboarding_completed }
}

export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  
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

  const { data: subjects, error: subjectsError } = await supabase
    .from('user_subjects')
    .select('*')
    .eq('user_id', user.id)

  return { 
    profile,
    subjects: subjects || []
  }
}