// Design reference only — the production reminder email is generated inline by
// the Supabase Edge Function at supabase/functions/send-grind-reminders/index.ts.
// This React Email template is kept for visual previewing during development.

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

interface GrindReminderEmailProps {
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

export function GrindReminderEmail({
  userName,
  grindTitle,
  grindDescription,
  scheduledAt,
  durationMinutes,
  meetingUrl,
}: GrindReminderEmailProps) {
  const previewText = `Starting in 2 hours: ${grindTitle}`

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
            <Text style={greeting}>Hi {capitalizeName(userName)},</Text>

            {/* Urgency Badge */}
            <Section style={urgencyBadgeContainer}>
              <Text style={urgencyBadge}>Starts in 2 hours</Text>
            </Section>

            {/* Date/Time Hero Block with urgency accent */}
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

            {!meetingUrl && (
              <Text style={noLinkNote}>
                The meeting link will be available on your dashboard shortly.
              </Text>
            )}

            {/* Tip Section */}
            <Section style={tipBox}>
              <Text style={tipLabel}>Quick prep</Text>
              <Text style={tipText}>
                Find a quiet spot, grab pen and paper, and make sure your device is charged.
              </Text>
            </Section>

            <Text style={signoff}>
              See you soon,
              <br />
              Ben
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Link href="https://uncooked.ie/dashboard/grinds" style={footerLink}>
              View upcoming grinds
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles - Academic Appointment Card aesthetic with urgency cues
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
  fontSize: '18px',
  lineHeight: '26px',
  color: '#1A1A1A',
  marginBottom: '20px',
  marginTop: '0',
  textAlign: 'center' as const,
}

// Urgency Badge
const urgencyBadgeContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const urgencyBadge = {
  display: 'inline-block',
  backgroundColor: '#ED805E',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  padding: '6px 14px',
  borderRadius: '20px',
  margin: '0',
}

// Date/Time Hero Block Styles - with salmon accent border for urgency
const dateTimeHero = {
  backgroundColor: '#FFFFFF',
  border: '2px solid #ED805E',
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
  fontSize: '26px',
  fontWeight: '700',
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
  backgroundColor: '#ED805E',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '16px 44px',
  borderRadius: '6px',
  display: 'inline-block',
}

const noLinkNote = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6B6B6B',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

// Tip Section
const tipBox = {
  backgroundColor: '#F8F7F2',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '24px',
}

const tipLabel = {
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#6B6B6B',
  marginBottom: '6px',
  marginTop: '0',
}

const tipText = {
  fontSize: '14px',
  lineHeight: '21px',
  color: '#4A4A4A',
  marginBottom: '0',
  marginTop: '0',
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

export default GrindReminderEmail
