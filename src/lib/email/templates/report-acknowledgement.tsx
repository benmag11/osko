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

interface ReportAcknowledgementEmailProps {
  name: string
  questionTitle: string
}

export function ReportAcknowledgementEmail({
  name,
  questionTitle,
}: ReportAcknowledgementEmailProps) {
  const previewText = `Thanks for reporting ${questionTitle}`

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
              height={46}
              style={logoImage}
            />
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={content}>
            <Text style={bodyText}>Hiya {name},</Text>

            <Text style={bodyText}>
              Just to say thanks very much for reporting{' '}
              <strong>{questionTitle}</strong> — it really does make a huge
              difference in improving the quality of the site.
            </Text>

            <Text style={bodyText}>
              I should have it fixed within 24 hours or so.
            </Text>

            <Text style={bodyText}>
              Thanks again,
              <br />
              Ben
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

const bodyText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#1A1A1A',
  marginTop: '0',
  marginBottom: '16px',
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

export default ReportAcknowledgementEmail
