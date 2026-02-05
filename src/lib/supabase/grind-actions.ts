'use server'

import { createServerSupabaseClient } from './server'
import type { GrindWithStatus } from '@/lib/types/database'
import { sendGrindConfirmationEmail } from '@/lib/email/grind-emails'

export async function getGrindsForWeek(
  weekOffset: number
): Promise<{ data: GrindWithStatus[]; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: [], error: 'You must be logged in to view grinds' }
  }

  const { data, error } = await supabase.rpc('get_grinds_for_week', {
    week_offset: weekOffset,
  })

  if (error) {
    console.error('Failed to fetch grinds:', error)
    return { data: [], error: 'Failed to load grinds' }
  }

  return { data: data ?? [] }
}

export async function registerForGrind(
  grindId: string
): Promise<{ success: boolean; error?: string; emailFailed?: boolean }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'You must be logged in to register' }
  }

  // Verify user has an active subscription or free credits
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_status, subscription_current_period_end, free_grind_credits')
    .eq('user_id', user.id)
    .single()

  const hasActiveSubscription =
    profile != null &&
    ['active', 'past_due', 'trialing'].includes(profile.subscription_status) &&
    (!profile.subscription_current_period_end ||
      new Date(profile.subscription_current_period_end) > new Date())

  let registration: { id: string } | null = null

  if (hasActiveSubscription) {
    // Subscriber path: insert registration normally
    const { data, error } = await supabase
      .from('grind_registrations')
      .insert({
        grind_id: grindId,
        user_id: user.id,
        used_free_grind: false,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You are already registered for this grind' }
      }
      console.error('Failed to register for grind:', error)
      return { success: false, error: 'Failed to register' }
    }
    registration = data
  } else if (profile && profile.free_grind_credits > 0) {
    // Free credit path: use atomic RPC function
    const { data: success, error } = await supabase.rpc('register_for_grind_with_credit', {
      p_user_id: user.id,
      p_grind_id: grindId,
    })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You are already registered for this grind' }
      }
      console.error('Failed to register for grind with credit:', error)
      return { success: false, error: 'Failed to register' }
    }

    if (!success) {
      return { success: false, error: 'No free grinds remaining. Subscribe to access grinds.' }
    }

    // Fetch the registration ID for the confirmation email
    const { data: reg } = await supabase
      .from('grind_registrations')
      .select('id')
      .eq('grind_id', grindId)
      .eq('user_id', user.id)
      .single()

    registration = reg
  } else {
    return { success: false, error: 'No free grinds remaining. Subscribe to access grinds.' }
  }

  // Fetch grind details and user profile for the email
  const [grindResult, profileResult] = await Promise.all([
    supabase
      .from('grinds')
      .select('title, description, scheduled_at, duration_minutes, meeting_url')
      .eq('id', grindId)
      .single(),
    supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single(),
  ])

  if (grindResult.data && user.email) {
    const grind = grindResult.data
    const userName = profileResult.data?.name || user.email.split('@')[0]

    // Send confirmation email — await it so we can report failure
    try {
      const emailResult = await sendGrindConfirmationEmail({
        userEmail: user.email,
        userName,
        grindId,
        grindTitle: grind.title,
        grindDescription: grind.description,
        scheduledAt: grind.scheduled_at,
        durationMinutes: grind.duration_minutes,
        meetingUrl: grind.meeting_url,
      })

      if (emailResult.success && registration) {
        await supabase
          .from('grind_registrations')
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq('id', registration.id)
      } else {
        console.error('Failed to send confirmation email:', emailResult.error)
        return { success: true, emailFailed: true }
      }
    } catch (err) {
      console.error('Error sending confirmation email:', err)
      return { success: true, emailFailed: true }
    }
  }

  return { success: true }
}

export async function unregisterFromGrind(
  grindId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'You must be logged in to unregister' }
  }

  const { data: success, error } = await supabase.rpc('unregister_from_grind_with_credit_restore', {
    p_user_id: user.id,
    p_grind_id: grindId,
  })

  if (error) {
    console.error('Failed to unregister from grind:', error)
    return { success: false, error: 'Failed to unregister' }
  }

  if (!success) {
    return { success: false, error: 'Registration not found' }
  }

  return { success: true }
}
