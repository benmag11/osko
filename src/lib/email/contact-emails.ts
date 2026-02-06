import { resend, FROM_EMAIL, FROM_NAME } from './resend'
import { ContactNotificationEmail } from './templates/contact-notification'
import { render } from '@react-email/components'

interface ContactEmailData {
  name: string
  email: string
  category: string
  message: string
}

export async function sendContactEmail(
  data: ContactEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      ContactNotificationEmail({
        name: data.name,
        email: data.email,
        category: data.category,
        message: data.message,
      })
    )

    const supportEmail = process.env.SUPPORT_EMAIL || FROM_EMAIL

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: supportEmail,
      subject: `Contact Form: ${data.category} — from ${data.name}`,
      replyTo: data.email,
      html,
    })

    if (error) {
      console.error('Failed to send contact email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending contact email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
