import { resend, FROM_EMAIL, FROM_NAME } from './resend'
import { FeedbackNotificationEmail } from './templates/feedback-notification'
import { render } from '@react-email/components'

interface FeedbackEmailData {
  name: string
  email: string
  grindTitle: string
  message: string
}

export async function sendFeedbackEmail(
  data: FeedbackEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      FeedbackNotificationEmail({
        name: data.name,
        email: data.email,
        grindTitle: data.grindTitle,
        message: data.message,
      })
    )

    const supportEmail = process.env.SUPPORT_EMAIL || FROM_EMAIL

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: supportEmail,
      subject: `Grind Feedback: ${data.grindTitle} — from ${data.name}`,
      replyTo: data.email,
      html,
    })

    if (error) {
      console.error('Failed to send feedback email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending feedback email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
