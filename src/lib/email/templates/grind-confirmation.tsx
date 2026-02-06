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

interface GrindConfirmationEmailProps {
  userName: string
  grindTitle: string
  grindDescription?: string | null
  scheduledAt: string // ISO date string
  durationMinutes: number
  meetingUrl?: string | null
}

function capitalizeName(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

import { formatDayOfWeek, formatDateShort, formatTimeRange } from '@/lib/utils/format-date'

export function GrindConfirmationEmail({
  userName,
  grindTitle,
  grindDescription,
  scheduledAt,
  durationMinutes,
  meetingUrl,
}: GrindConfirmationEmailProps) {
  const previewText = `You're confirmed for ${grindTitle} on ${formatDateShort(scheduledAt)}`

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
            <Text style={greeting}>Hi {capitalizeName(userName)}, you&apos;re confirmed!</Text>

            {/* Date/Time Hero Block */}
            <Section style={dateTimeHero}>
              <Text style={dayOfWeek}>{formatDayOfWeek(scheduledAt)}</Text>
              <Text style={dateDisplay}>{formatDateShort(scheduledAt)}</Text>
              <Text style={timeDisplay}>{formatTimeRange(scheduledAt, durationMinutes)}</Text>
            </Section>

            {/* Session Card */}
            <Section style={sessionCard}>
              <Text style={sessionTitle}>{grindTitle}</Text>
              {grindDescription && (
                <Text style={sessionDescription}>{grindDescription}</Text>
              )}
              <Text style={sessionDuration}>{durationMinutes} minutes</Text>
            </Section>

            {meetingUrl && (
              <Section style={buttonContainer}>
                <Link href={meetingUrl} style={button}>
                  Join Meeting
                </Link>
              </Section>
            )}

            <Text style={reminderNote}>
              We&apos;ll send you a reminder with the meeting link <strong>2 hours before</strong> the session starts.
            </Text>

            <Text style={signoff}>
              See you there,
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

// Styles - Academic Appointment Card aesthetic
const main = {
  backgroundColor: '#FEF5EB',
  fontFamily: "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
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

const greeting = {
  fontSize: '20px',
  lineHeight: '28px',
  color: '#1A1A1A',
  marginBottom: '28px',
  marginTop: '0',
  textAlign: 'center' as const,
  fontWeight: '400',
}

// Date/Time Hero Block Styles
const dateTimeHero = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E4DC',
  borderRadius: '8px',
  padding: '28px 24px',
  marginBottom: '20px',
  textAlign: 'center' as const,
}

const dayOfWeek = {
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#6B6B6B',
  marginBottom: '4px',
  marginTop: '0',
}

const dateDisplay = {
  fontSize: '32px',
  fontWeight: '400',
  fontFamily: "'Source Serif Pro', Georgia, serif",
  color: '#1A1A1A',
  lineHeight: '1.2',
  marginBottom: '8px',
  marginTop: '0',
}

const timeDisplay = {
  fontSize: '22px',
  fontWeight: '600',
  color: '#ED805E',
  letterSpacing: '0.5px',
  marginBottom: '0',
  marginTop: '0',
}

// Session Card Styles
const sessionCard = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E4DC',
  borderRadius: '8px',
  padding: '20px 24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const sessionTitle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#1A1A1A',
  marginBottom: '6px',
  marginTop: '0',
}

const sessionDescription = {
  fontSize: '14px',
  color: '#6B6B6B',
  marginBottom: '12px',
  marginTop: '0',
  lineHeight: '20px',
}

const sessionDuration = {
  fontSize: '13px',
  color: '#6B6B6B',
  marginBottom: '0',
  marginTop: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#1A1A1A',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  padding: '14px 36px',
  borderRadius: '6px',
  display: 'inline-block',
}

const reminderNote = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6B6B6B',
  textAlign: 'center' as const,
  marginBottom: '28px',
}

const signoff = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4A4A4A',
  textAlign: 'center' as const,
  marginTop: '0',
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

export default GrindConfirmationEmail
