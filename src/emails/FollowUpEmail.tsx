import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface FollowUpEmailProps {
  meetingTitle: string
  meetingId: string
  followupDraft: string
  appUrl?: string
}

export function FollowUpEmail({
  meetingTitle,
  meetingId,
  followupDraft,
  appUrl = 'https://meetprep.app',
}: FollowUpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AI follow-up draft for &quot;{meetingTitle}&quot; is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>MeetPrep</Text>
            <Text style={logoTagline}>Your AI Meeting Intelligence</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={title}>Follow-Up Draft Ready</Heading>
            <Text style={subtitle}>
              Your meeting <strong>&ldquo;{meetingTitle}&rdquo;</strong> just wrapped up.
              Here&apos;s an AI-drafted follow-up email you can send to attendees.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Draft */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              ✉️ Suggested Follow-Up
            </Heading>
            <Section style={draftBox}>
              <Text style={draftText}>{followupDraft}</Text>
            </Section>
            <Text style={disclaimer}>
              Edit this draft to match your voice before sending.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={`${appUrl}/briefs/${meetingId}`} style={ctaButton}>
              View Full Brief &amp; Edit Draft
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Powered by{' '}
              <Link href={appUrl} style={footerLink}>
                MeetPrep
              </Link>{' '}
              · AI-powered meeting preparation
            </Text>
            <Text style={footerMeta}>
              Share MeetPrep with a colleague:{' '}
              <Link href={`${appUrl}?ref=followup-email`} style={footerLink}>
                {appUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default FollowUpEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px 8px 0 0',
  padding: '24px 40px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
}

const logoTagline = {
  color: '#c7d2fe',
  fontSize: '12px',
  margin: '4px 0 0',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
}

const heroSection = {
  backgroundColor: '#ffffff',
  padding: '32px 40px 24px',
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
}

const title = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 12px',
}

const subtitle = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const section = {
  backgroundColor: '#ffffff',
  padding: '24px 40px',
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
}

const sectionHeading = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 16px',
  paddingBottom: '8px',
  borderBottom: '2px solid #e5e7eb',
}

const draftBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '16px 20px',
  marginBottom: '12px',
}

const draftText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  fontStyle: 'italic',
  margin: '0',
}

const ctaSection = {
  backgroundColor: '#ffffff',
  padding: '24px 40px',
  textAlign: 'center' as const,
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
}

const ctaButton = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
}

const footer = {
  backgroundColor: '#f9fafb',
  borderRadius: '0 0 8px 8px',
  padding: '20px 40px',
  textAlign: 'center' as const,
  border: '1px solid #e5e7eb',
  borderTop: 'none',
}

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0 0 4px',
}

const footerMeta = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '4px 0 0',
}

const footerLink = {
  color: '#4f46e5',
  textDecoration: 'none',
}
