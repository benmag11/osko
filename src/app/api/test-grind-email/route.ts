import { NextResponse } from 'next/server'
import { sendGrindConfirmationEmail } from '@/lib/email/grind-emails'

/**
 * Test endpoint for grind confirmation emails (development only)
 * POST /api/test-grind-email
 * Body: { email: string }
 *
 * Note: Reminder emails are handled by the Supabase Edge Function
 * (send-grind-reminders) and cannot be tested from here.
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const testData = {
      userEmail: email,
      userName: 'Test User',
      grindId: 'test-grind-id',
      grindTitle: 'Maths Paper 1 Revision',
      grindDescription: 'Covering calculus, algebra, and complex numbers. Bring your questions!',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      durationMinutes: 90,
      meetingUrl: 'https://zoom.us/j/1234567890',
    }

    const result = await sendGrindConfirmationEmail(testData)

    if (result.success) {
      return NextResponse.json({ success: true, message: `Confirmation email sent to ${email}` })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
