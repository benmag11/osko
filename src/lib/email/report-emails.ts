import { resend, FROM_EMAIL, FROM_NAME } from './resend'
import { ReportAcknowledgementEmail } from './templates/report-acknowledgement'
import { render } from '@react-email/components'

interface ReportAcknowledgementEmailData {
  userName: string
  userEmail: string
  questionTitle: string
}

export async function sendReportAcknowledgementEmail(
  data: ReportAcknowledgementEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      ReportAcknowledgementEmail({
        name: data.userName,
        questionTitle: data.questionTitle,
      })
    )

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.userEmail,
      subject: 'Thanks for the report!',
      html,
    })

    if (error) {
      console.error('Failed to send report acknowledgement email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending report acknowledgement email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
