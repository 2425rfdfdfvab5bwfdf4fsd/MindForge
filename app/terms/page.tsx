import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read MindForge's Terms of Service. Understand your rights, subscription terms, and acceptable use policy for our AI coaching and habit tracking platform.",
  alternates: { canonical: "https://mindforge.app/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0908] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-[#FF6B2B] text-sm font-semibold tracking-widest uppercase hover:underline">
          MINDFORGE
        </a>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-6 mb-2">Terms of Service</h1>
        <p className="text-[#6B7280] text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-[#A09FA0] text-sm leading-relaxed">
          <Section title="1. Acceptance">
            By accessing MindForge, you agree to these Terms. If you disagree with any part,
            do not use the service.
          </Section>

          <Section title="2. Description of Service">
            MindForge is an AI-powered habit tracking and accountability platform. We provide
            tools for behavioral tracking, AI coaching via Google Gemini, and performance
            analytics. The service is provided on a subscription basis (Free, Pro, Elite tiers).
          </Section>

          <Section title="3. Account">
            You must authenticate via Google or email. You are responsible for all activity under
            your account. You must be at least 16 years old to use MindForge. One account per person.
          </Section>

          <Section title="4. Subscriptions and Billing">
            Pro ($12/month or $89/year) and Elite ($29/month or $219/year) subscriptions are
            processed by Lemon Squeezy. Subscriptions renew automatically. Cancel anytime from
            Settings. No refunds for partial periods unless required by law.
          </Section>

          <Section title="5. Acceptable Use">
            You may not: use the service for illegal purposes; submit false, misleading, or
            harmful content; attempt to reverse-engineer or scrape the service; share account
            access; abuse the AI coaching system.
          </Section>

          <Section title="6. AI Coaching Disclaimer">
            MindForge AI coaching is not a substitute for professional mental health treatment,
            therapy, or medical advice. The AI coach provides behavioral accountability, not
            clinical guidance. If you are in crisis, contact a qualified professional.
          </Section>

          <Section title="7. Content">
            You own your reflections and data. You grant us a license to process it to provide
            the service. We do not use your personal content to train AI models.
          </Section>

          <Section title="8. Limitation of Liability">
            MindForge is provided as-is. We are not liable for indirect, incidental, or
            consequential damages. Our maximum liability to you is limited to the amount you
            paid in the 12 months before the claim.
          </Section>

          <Section title="9. Termination">
            We may terminate accounts that violate these terms. You may delete your account
            at any time from Settings. Upon termination, your data will be handled per our
            Privacy Policy.
          </Section>

          <Section title="10. Changes">
            We may update these terms with 14 days notice. Continued use after changes
            constitutes acceptance.
          </Section>

          <Section title="11. Contact">
            Questions? Contact us at legal@mindforge.app.
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
