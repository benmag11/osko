import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Img,
} from '@react-email/components'

interface ContactNotificationEmailProps {
  name: string
  email: string
  category: string
  message: string
}

export function ContactNotificationEmail({
  name,
  email,
  category,
  message,
}: ContactNotificationEmailProps) {
  const previewText = `New contact form submission from ${name} — ${category}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://uncooked.ie/logo-full.png"
              alt="Uncooked"
              width={140}
              height={32}
              style={logoImage}
            />
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={content}>
            <Text style={heading}>New Contact Form Submission</Text>

            {/* Sender Details Card */}
            <Section style={detailsCard}>
              <Text style={detailLabel}>From</Text>
              <Text style={detailValue}>{name}</Text>

              <Text style={detailLabel}>Email</Text>
              <Text style={detailValue}>
                <Link href={`mailto:${email}`} style={emailLink}>
                  {email}
                </Link>
              </Text>

              <Text style={detailLabel}>Category</Text>
              <Text style={detailValue}>{category}</Text>
            </Section>

            {/* Message Card */}
            <Section style={messageCard}>
              <Text style={detailLabel}>Message</Text>
              <Text style={messageText}>{message}</Text>
            </Section>

            <Text style={replyNote}>
              Reply directly to this email to respond to {name}.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Link href="https://uncooked.ie/dashboard" style={footerLink}>
              Dashboard
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles - matching brand: warm #FEF5EB bg, serif headings, #ED805E accent
const main = {
  backgroundColor: '#FEF5EB',
  fontFamily:
    "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '520px',
}

const header = {
  textAlign: 'center' as const,
  paddingBottom: '24px',
}

const logoImage = {
  margin: '0 auto',
}

const divider = {
  borderColor: '#E5E4DC',
  borderWidth: '1px',
  margin: '0',
}

const content = {
  padding: '32px 0',
}

const heading = {
  fontSize: '20px',
  lineHeight: '28px',
  color: '#1A1A1A',
  marginBottom: '24px',
  marginTop: '0',
  textAlign: 'center' as const,
  fontWeight: '600',
  fontFamily: "'Source Serif Pro', Georgia, serif",
}

const detailsCard = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E4DC',
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '16px',
}

const detailLabel = {
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#6B6B6B',
  marginBottom: '2px',
  marginTop: '12px',
}

const detailValue = {
  fontSize: '15px',
  color: '#1A1A1A',
  marginTop: '0',
  marginBottom: '0',
  lineHeight: '22px',
}

const emailLink = {
  color: '#ED805E',
  textDecoration: 'none',
}

const messageCard = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E4DC',
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const messageText = {
  fontSize: '15px',
  color: '#1A1A1A',
  marginTop: '4px',
  marginBottom: '0',
  lineHeight: '24px',
  whiteSpace: 'pre-wrap' as const,
}

const replyNote = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6B6B6B',
  textAlign: 'center' as const,
}

const footer = {
  paddingTop: '20px',
  textAlign: 'center' as const,
}

const footerLink = {
  fontSize: '13px',
  color: '#ED805E',
  textDecoration: 'none',
}

export default ContactNotificationEmail
