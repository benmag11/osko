'use server'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendFeedbackEmail } from '@/lib/email/feedback-emails'
import { checkRateLimit } from '@/lib/utils/rate-limit'

interface FeedbackFormData {
  grindId: string
  name?: string
  email?: string
  message: string
}

export async function submitFeedback(
  formData: FeedbackFormData
): Promise<{ success?: boolean; error?: string }> {
  // Rate limit by IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const allowed = await checkRateLimit(ip, 'feedback_form')
  if (!allowed) {
    return {
      error: 'Too many submissions. Please try again later.',
    }
  }

  const supabase = await createServerSupabaseClient()

  // Validate grindId exists
  const { data: grind } = await supabase
    .from('grinds')
    .select('title')
    .eq('id', formData.grindId)
    .single()

  if (!grind) {
    return { error: 'Invalid grind session.' }
  }

  // Resolve name and email from session (if logged in) or form data
  const { data: { user } } = await supabase.auth.getUser()

  let name: string
  let email: string

  if (user?.email) {
    email = user.email

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single()

    name = profile?.name || user.email
  } else {
    const formName = formData.name?.trim()
    if (!formName) {
      return { error: 'Name is required' }
    }
    if (formName.length > 100) {
      return { error: 'Name must be less than 100 characters' }
    }
    name = formName

    const formEmail = formData.email?.trim()
    if (!formEmail) {
      return { error: 'Email is required' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formEmail)) {
      return { error: 'Please enter a valid email address' }
    }
    email = formEmail
  }

  // Validate message
  const message = formData.message?.trim()
  if (!message) {
    return { error: 'Feedback is required' }
  }
  if (message.length < 10) {
    return { error: 'Feedback must be at least 10 characters' }
  }
  if (message.length > 2000) {
    return { error: 'Feedback must be less than 2000 characters' }
  }

  // Send email
  const result = await sendFeedbackEmail({
    name,
    email,
    grindTitle: grind.title,
    message,
  })

  if (!result.success) {
    return { error: 'Failed to send your feedback. Please try again.' }
  }

  return { success: true }
}
