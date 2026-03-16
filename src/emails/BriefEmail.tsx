import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import type { Brief, Meeting } from '@/types'
import { format } from 'date-fns'

interface BriefEmailProps {
  brief: Brief
  meeting: Meeting
}

export function BriefEmail({ brief, meeting }: BriefEmailProps) {
  const meetingDate = format(new Date(meeting.start_time), 'EEEE, MMMM d, yyyy')
  const startTime = format(new Date(meeting.start_time), 'h:mm a')
  const endTime = format(new Date(meeting.end_time), 'h:mm a')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meetprep.app'

  return (
    <Html>
      <Head />
      <Preview>Your meeting brief for &quot;{meeting.title}&quot; is ready</Preview>
      <Body style={main}>
        {/* Header */}
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>MeetPrep</Text>
            <Text style={logoTagline}>Your AI Meeting Intelligence</Text>
          </Section>

          {/* Meeting Title */}
          <Section style={heroSection}>
            <Heading style={meetingTitle}>{meeting.title}</Heading>
            <Text style={meetingMeta}>
              {meetingDate} &bull; {startTime} – {endTime}
            </Text>
            {meeting.location && (
              <Text style={meetingMeta}>📍 {meeting.location}</Text>
            )}
            {meeting.meeting_link && (
              <Text style={meetingMeta}>
                <Link href={meeting.meeting_link} style={linkStyle}>
                  Join Meeting
                </Link>
              </Text>
            )}
          </Section>

          {/* Attendees */}
          {meeting.attendees.length > 0 && (
            <Section style={section}>
              <Heading as="h2" style={sectionHeading}>
                👥 Attendees
              </Heading>
              {meeting.attendees.map((attendee, i) => (
                <Text key={i} style={attendeeItem}>
                  <strong>{attendee.name ?? attendee.email}</strong>
                  {attendee.company ? ` · ${attendee.company}` : ''}
                  {' '}
                  <span style={mutedText}>({attendee.email})</span>
                </Text>
              ))}
            </Section>
          )}

          <Hr style={divider} />

          {/* Company Snapshot */}
          {brief.company_snapshot && (
            <Section style={section}>
              <Heading as="h2" style={sectionHeading}>
                🏢 Company Snapshot
              </Heading>
              <Row>
                {brief.company_snapshot.logo_url && (
                  <Column style={{ width: '60px', verticalAlign: 'top' }}>
                    <Img
                      src={brief.company_snapshot.logo_url}
                      width="48"
                      height="48"
                      alt={brief.company_snapshot.name}
                      style={companyLogo}
                    />
                  </Column>
                )}
                <Column style={{ verticalAlign: 'top' }}>
                  <Text style={companyName}>{brief.company_snapshot.name}</Text>
                  {brief.company_snapshot.industry && (
                    <Text style={companyMeta}>
                      {brief.company_snapshot.industry}
                      {brief.company_snapshot.employee_count
                        ? ` · ${brief.company_snapshot.employee_count} employees`
                        : ''}
                    </Text>
                  )}
                  <Text style={companyDescription}>
                    {brief.company_snapshot.description}
                  </Text>
                </Column>
              </Row>
              {brief.company_snapshot.recent_news.length > 0 && (
                <>
                  <Text style={subHeading}>Recent News</Text>
                  {brief.company_snapshot.recent_news.map((news, i) => (
                    <Text key={i} style={bulletItem}>
                      • {news}
                    </Text>
                  ))}
                </>
              )}
            </Section>
          )}

          {/* Attendee Summaries */}
          {brief.attendee_summaries.length > 0 && (
            <Section style={section}>
              <Heading as="h2" style={sectionHeading}>
                👤 Attendee Profiles
              </Heading>
              {brief.attendee_summaries.map((summary, i) => (
                <Section key={i} style={profileCard}>
                  <Text style={profileName}>
                    {summary.name ?? summary.email}
                    {summary.role ? ` · ${summary.role}` : ''}
                  </Text>
                  {summary.company && (
                    <Text style={profileMeta}>{summary.company}</Text>
                  )}
                  {summary.linkedin_summary && (
                    <Text style={profileSummary}>{summary.linkedin_summary}</Text>
                  )}
                </Section>
              ))}
            </Section>
          )}

          <Hr style={divider} />

          {/* Agenda */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              📋 Likely Agenda
            </Heading>
            {brief.agenda.map((item, i) => (
              <Text key={i} style={numberedItem}>
                <span style={numberBadge}>{i + 1}</span> {item}
              </Text>
            ))}
          </Section>

          {/* Talking Points */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              💬 Talking Points
            </Heading>
            {brief.talking_points.map((point, i) => (
              <Text key={i} style={bulletItem}>
                • {point}
              </Text>
            ))}
          </Section>

          {/* Icebreakers */}
          {brief.icebreakers.length > 0 && (
            <Section style={section}>
              <Heading as="h2" style={sectionHeading}>
                🤝 Icebreakers
              </Heading>
              {brief.icebreakers.map((ice, i) => (
                <Text key={i} style={icebreakerItem}>
                  &ldquo;{ice}&rdquo;
                </Text>
              ))}
            </Section>
          )}

          {/* Risk Flags */}
          {brief.risk_flags.length > 0 && (
            <Section style={riskSection}>
              <Heading as="h2" style={riskHeading}>
                ⚠️ Risk Flags
              </Heading>
              {brief.risk_flags.map((flag, i) => (
                <Text key={i} style={riskItem}>
                  • {flag}
                </Text>
              ))}
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={`${appUrl}/briefs/${brief.id}`} style={ctaButton}>
              View Full Brief Online
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
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
              <Link href={`${appUrl}?ref=email`} style={footerLink}>
                {appUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default BriefEmail

// Styles
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

const meetingTitle = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const meetingMeta = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
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

const attendeeItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '4px 0',
}

const mutedText = {
  color: '#9ca3af',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const companyLogo = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const companyName = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 4px',
}

const companyMeta = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0 0 8px',
}

const companyDescription = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.6',
}

const subHeading = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
  margin: '16px 0 8px',
}

const profileCard = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
}

const profileName = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 2px',
}

const profileMeta = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0 0 6px',
}

const profileSummary = {
  color: '#374151',
  fontSize: '13px',
  margin: '0',
  lineHeight: '1.5',
}

const numberedItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.5',
}

const numberBadge = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  borderRadius: '50%',
  padding: '2px 7px',
  fontSize: '12px',
  fontWeight: '700',
  marginRight: '8px',
}

const bulletItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.6',
  paddingLeft: '4px',
}

const icebreakerItem = {
  color: '#374151',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.6',
  fontStyle: 'italic',
  paddingLeft: '8px',
  borderLeft: '3px solid #c7d2fe',
}

const riskSection = {
  backgroundColor: '#fffbeb',
  padding: '24px 40px',
  borderLeft: '4px solid #f59e0b',
}

const riskHeading = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 12px',
}

const riskItem = {
  color: '#92400e',
  fontSize: '14px',
  margin: '6px 0',
  lineHeight: '1.5',
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

const linkStyle = {
  color: '#4f46e5',
  textDecoration: 'underline',
}
