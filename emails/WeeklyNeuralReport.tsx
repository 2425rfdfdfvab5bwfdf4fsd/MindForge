import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

interface WeeklyNeuralReportProps {
  displayName?: string;
  weekRange: string;
  forgeScore: number;
  forgeScoreChange: number;
  checkinCount: number;
  habitsCompleted: number;
  xpEarned: number;
  behavioralArc: string;
  keyInsight: string;
  bestStreakThisWeek: string;
  nextWeekChallenge: string;
  cookieJarTitle?: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function WeeklyNeuralReport({
  displayName,
  weekRange,
  forgeScore,
  forgeScoreChange,
  checkinCount,
  habitsCompleted,
  xpEarned,
  behavioralArc,
  keyInsight,
  bestStreakThisWeek,
  nextWeekChallenge,
  cookieJarTitle,
  appUrl,
  unsubscribeUrl,
}: WeeklyNeuralReportProps) {
  const deltaColor = forgeScoreChange >= 0 ? "#22C55E" : "#EF4444";
  const deltaText =
    forgeScoreChange >= 0
      ? `+${forgeScoreChange} this week`
      : `${forgeScoreChange} this week`;

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logo}>MINDFORGE</Text>
            <Text style={subtitle}>Weekly Neural Report</Text>
            <Text style={weekRangeText}>{weekRange}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={section}>
            <Text style={sectionLabel}>FORGE SCORE</Text>
            <Text style={bigNumber}>{forgeScore}</Text>
            <Text style={{ ...deltaStyle, color: deltaColor }}>{deltaText}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={section}>
            <Text style={sectionLabel}>THIS WEEK</Text>
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={statCell}>
                    <Text style={statValue}>{checkinCount}</Text>
                    <Text style={statLabel}>Check-ins</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statValue}>{habitsCompleted}</Text>
                    <Text style={statLabel}>Habits Done</Text>
                  </td>
                  <td style={statCell}>
                    <Text style={statValue}>{xpEarned}</Text>
                    <Text style={statLabel}>XP Earned</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {behavioralArc && (
            <Section style={section}>
              <Text style={sectionLabel}>BEHAVIORAL ARC</Text>
              <Text style={bodyText}>{behavioralArc}</Text>
            </Section>
          )}

          {keyInsight && (
            <Section style={section}>
              <Text style={sectionLabel}>KEY INSIGHT</Text>
              <Text style={insightText}>{keyInsight}</Text>
            </Section>
          )}

          {bestStreakThisWeek && (
            <Section style={section}>
              <Text style={sectionLabel}>BEST STREAK</Text>
              <Text style={bodyText}>{bestStreakThisWeek}</Text>
            </Section>
          )}

          {nextWeekChallenge && (
            <Section style={section}>
              <Text style={sectionLabel}>NEXT WEEK CHALLENGE</Text>
              <Text style={bodyText}>{nextWeekChallenge}</Text>
            </Section>
          )}

          {cookieJarTitle && (
            <>
              <Hr style={divider} />
              <Section style={section}>
                <Text style={sectionLabel}>REMEMBER THIS?</Text>
                <Text style={cookieText}>{cookieJarTitle}</Text>
              </Section>
            </>
          )}

          <Hr style={divider} />

          <Section style={{ ...section, textAlign: "center" }}>
            <Button href={appUrl} style={ctaButton}>
              View in App
            </Button>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
              {" · "}
              MindForge · Forge your identity.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#0A0908",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#111110",
  border: "1px solid #2A2927",
};

const headerSection: React.CSSProperties = {
  textAlign: "center",
  padding: "40px 40px 24px",
};

const logo: React.CSSProperties = {
  color: "#FF6B2B",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "4px",
  margin: "0 0 4px",
};

const subtitle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const weekRangeText: React.CSSProperties = {
  color: "#4A4947",
  fontSize: "12px",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#2A2927",
  margin: "0",
};

const section: React.CSSProperties = {
  padding: "24px 40px",
};

const sectionLabel: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const bigNumber: React.CSSProperties = {
  color: "#FF6B2B",
  fontSize: "56px",
  fontWeight: "800",
  lineHeight: "1",
  margin: "0 0 4px",
};

const deltaStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const statCell: React.CSSProperties = {
  textAlign: "center",
  padding: "8px",
};

const statValue: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 2px",
};

const statLabel: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0",
};

const bodyText: React.CSSProperties = {
  color: "#A09FA0",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const insightText: React.CSSProperties = {
  color: "#FF6B2B",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "1.6",
  margin: "0",
};

const cookieText: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "15px",
  fontStyle: "italic",
  lineHeight: "1.5",
  margin: "0",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#FF6B2B",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "1px",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: "20px",
};

const footerText: React.CSSProperties = {
  color: "#4A4947",
  fontSize: "11px",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#6B7280",
  textDecoration: "underline",
};

export default WeeklyNeuralReport;
