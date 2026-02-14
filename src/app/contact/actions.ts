'use server'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendContactEmail } from '@/lib/email/contact-emails'
import { checkRateLimit } from '@/lib/utils/rate-limit'

const ALLOWED_CATEGORIES = [
  'General Question',
  'Bug Report',
  'Billing Issue',
  'Feature Request',
  'Other',
] as const

type Category = (typeof ALLOWED_CATEGORIES)[number]

interface ContactFormData {
  name?: string
  email?: string
  category: string
  message: string
}

export async function submitContactForm(
  formData: ContactFormData
): Promise<{ success?: boolean; error?: string }> {
  // Rate limit by IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const allowed = await checkRateLimit(ip, 'contact_form')
  if (!allowed) {
    return {
      error: 'Too many submissions. Please try again later.',
    }
  }

  // Resolve name and email from session (if logged in) or form data
  const supabase = await createServerSupabaseClient()
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

  // Validate category
  const category = formData.category as Category
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return { error: 'Please select a valid category' }
  }

  // Validate message
  const message = formData.message?.trim()
  if (!message) {
    return { error: 'Message is required' }
  }
  if (message.length < 10) {
    return { error: 'Message must be at least 10 characters' }
  }
  if (message.length > 2000) {
    return { error: 'Message must be less than 2000 characters' }
  }

  // Send email
  const result = await sendContactEmail({
    name,
    email,
    category,
    message,
  })

  if (!result.success) {
    return { error: 'Failed to send your message. Please try again.' }
  }

  return { success: true }
}
