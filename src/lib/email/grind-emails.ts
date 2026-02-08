import { resend, FROM_EMAIL, FROM_NAME } from './resend'
import { GrindConfirmationEmail } from './templates/grind-confirmation'
import { render } from '@react-email/components'

interface GrindEmailData {
  userEmail: string
  userName: string
  grindId: string
  grindTitle: string
  grindDescription?: string | null
  scheduledAt: string
  durationMinutes: number
  meetingUrl?: string | null
}

/**
 * Send a confirmation email when a user registers for a grind
 */
export async function sendGrindConfirmationEmail(data: GrindEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      GrindConfirmationEmail({
        userName: data.userName,
        grindTitle: data.grindTitle,
        grindDescription: data.grindDescription,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        meetingUrl: data.meetingUrl,
      })
    )

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.userEmail,
      subject: `You're registered for ${data.grindTitle}`,
      html,
      headers: {
        'X-Entity-Ref-ID': `grind-confirmation/${data.grindId}/${data.userEmail}`,
      },
    })

    if (error) {
      console.error('Failed to send grind confirmation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending grind confirmation email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

