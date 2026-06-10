import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how MindForge collects, uses, and protects your personal data. Your reflections and habit data stay private — we never sell your information.",
  alternates: { canonical: "https://mindforge.app/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0908] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-[#FF6B2B] text-sm font-semibold tracking-widest uppercase hover:underline">
          MINDFORGE
        </a>
        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Privacy Policy</h1>
        <p className="text-[#6B7280] text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-[#A09FA0] text-sm leading-relaxed">
          <Section title="1. Information We Collect">
            We collect information you provide directly to us, including your email address (via
            Replit authentication), display name, daily reflections, habit data, Cookie Jar entries,
            and coaching session content. We also collect usage data such as login timestamps,
            page views, and feature interactions.
          </Section>

          <Section title="2. How We Use Your Information">
            We use your data to: (a) provide and improve the MindForge service; (b) generate
            personalized AI coaching responses; (c) calculate your Forge Score and track behavioral
            patterns; (d) send weekly neural reports (Pro/Elite users); (e) process subscription
            payments via Lemon Squeezy; (f) detect and prevent abuse.
          </Section>

          <Section title="3. AI Processing">
            Your reflections, check-ins, and coaching messages are processed by Google Gemini AI
            to generate coaching responses. These are sent to Google's API servers. Google's
            usage policies apply. We do not use your personal data to train AI models.
          </Section>

          <Section title="4. Data Retention">
            We retain your data for as long as your account is active. Upon account deletion, we
            soft-delete your record and anonymize your email within 30 days. Coaching session data
            and reflections are deleted within 90 days of account deletion.
          </Section>

          <Section title="5. Data Sharing">
            We do not sell your personal data. We share data only with: (a) Google (AI processing);
            (b) Lemon Squeezy (payment processing); (c) Resend (email delivery); (d) PostHog
            (analytics); (e) Sentry (error tracking). All processors are bound by data processing
            agreements.
          </Section>

          <Section title="6. Your Rights (GDPR)">
            If you are in the EU/EEA, you have the right to: access your data (use Settings — Data
            Export); correct inaccurate data (use Settings — Profile); delete your data (use
            Settings — Delete Account); object to processing; data portability. Contact us at
            privacy@mindforge.app to exercise these rights.
          </Section>

          <Section title="7. Cookies">
            We use a single session cookie (mf_session) for authentication. We do not use
            advertising or tracking cookies. PostHog analytics uses localStorage.
          </Section>

          <Section title="8. Security">
            We use industry-standard security practices including HTTPS encryption, Firebase session
            cookies, and HMAC verification for webhooks. Your data is stored in Google Firestore
            with encryption at rest.
          </Section>

          <Section title="9. Contact">
            For privacy questions, contact us at privacy@mindforge.app.
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2A2927]">
          <a href="/" className="text-[#FF6B2B] text-sm hover:underline">Back to MindForge</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
