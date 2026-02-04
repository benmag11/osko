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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'You must be logged in to register' }
  }

  // Verify user has an active subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_status, subscription_current_period_end')
    .eq('user_id', user.id)
    .single()

  const hasActiveSubscription =
    profile?.subscription_status === 'active' &&
    (!profile.subscription_current_period_end ||
      new Date(profile.subscription_current_period_end) > new Date())

  if (!hasActiveSubscription) {
    return { success: false, error: 'Active subscription required to register for grinds' }
  }

  // Insert the registration
  const { data: registration, error } = await supabase
    .from('grind_registrations')
    .insert({
      grind_id: grindId,
      user_id: user.id,
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

    // Send confirmation email (fire and forget, don't block registration)
    sendGrindConfirmationEmail({
      userEmail: user.email,
      userName,
      grindId,
      grindTitle: grind.title,
      grindDescription: grind.description,
      scheduledAt: grind.scheduled_at,
      durationMinutes: grind.duration_minutes,
      meetingUrl: grind.meeting_url,
    })
      .then(async (result) => {
        if (result.success) {
          // Update the registration to mark email as sent
          await supabase
            .from('grind_registrations')
            .update({ confirmation_email_sent_at: new Date().toISOString() })
            .eq('id', registration.id)
        } else {
          console.error('Failed to send confirmation email:', result.error)
        }
      })
      .catch((err) => {
        console.error('Error sending confirmation email:', err)
      })
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

  const { error } = await supabase
    .from('grind_registrations')
    .delete()
    .eq('grind_id', grindId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to unregister from grind:', error)
    return { success: false, error: 'Failed to unregister' }
  }

  return { success: true }
}
