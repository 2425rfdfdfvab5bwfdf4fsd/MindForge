import type { Metadata } from "next";
import Link from "next/link";
import { LandingPricing } from "@/components/landing/LandingPricing";

export const metadata: Metadata = {
  title: {
    absolute: "MindForge — AI Habit Tracker & Accountability Coach",
  },
  description:
    "Stop making excuses. MindForge blends neuroscience-backed habit tracking with an AI coach that remembers your patterns and holds you to your identity. Start free.",
  alternates: { canonical: "https://mindforge.app" },
  openGraph: {
    url: "https://mindforge.app",
    title: "MindForge — AI Habit Tracker & Accountability Coach",
    description:
      "Stop making excuses. MindForge blends neuroscience-backed habit tracking with an AI coach that remembers your patterns and holds you to your identity.",
    type: "website",
  },
  twitter: {
    title: "MindForge — AI Habit Tracker & Accountability Coach",
    description:
      "Stop making excuses. MindForge blends neuroscience-backed habit tracking with an AI coach that remembers your patterns and holds you to your identity.",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MindForge",
  url: "https://mindforge.app",
  description:
    "AI-powered habit tracker and accountability coach that builds persistent memory of your patterns and holds you to your identity.",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MindForge",
  url: "https://mindforge.app",
  description:
    "MindForge builds AI-powered accountability tools grounded in neuroscience and behavior change research.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "privacy@mindforge.app",
      contactType: "customer support",
    },
  ],
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MindForge",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  url: "https://mindforge.app",
  description:
    "AI habit tracker and accountability coach with neuroscience-backed behavior change tools, Forge Score, 40% Rule Engine, and persistent AI memory.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "3 habits, daily mirror check-in, Forge Score, Cookie Jar.",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "12",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "12",
        priceCurrency: "USD",
        unitText: "month",
      },
      description: "Unlimited habits, full AI coaching with persistent memory, all features.",
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How MindForge Works: The Forge System",
  description:
    "MindForge's three-step system for building real accountability and lasting behavior change through neuroscience-backed habit tracking.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Face the Mirror",
      text: "Write the honest truth about your behavior. Your AI coach responds without softening it — no participation trophies, no false encouragement.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Excavate Your Why",
      text: "A Socratic AI dialogue uncovers your identity-level motivation — the anchor that does not break when surface motivation fails.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Forge Daily",
      text: "Log habits honestly. Receive direct coaching. Watch your Forge Score reflect the real truth of your behavior over time.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What makes MindForge different from other habit apps?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MindForge builds a persistent AI memory of who you are — your patterns, triggers, and past victories — and uses it to coach you across every session. No other app does this. Combined with the Forge Score (a real-time accountability score based on actual behavior, not effort) and the 40% Rule Engine, MindForge is the only app that tells you the truth.",
      },
    },
    {
      "@type": "Question",
      name: "Is MindForge free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MindForge has a free tier that includes up to 3 habits, daily mirror check-ins, your Forge Score, and the Cookie Jar. Pro ($12/month) unlocks unlimited habits, full AI coaching with persistent memory, advanced analytics, weekly neural reports, and all challenge tiers.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Forge Score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Forge Score is a real-time accountability score that reflects your actual behavior — not your effort, not your intentions. It rises when you complete habits and reflections honestly, and drops when you miss them. It cannot be gamed.",
      },
    },
    {
      "@type": "Question",
      name: "What is the 40% Rule?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 40% Rule is based on Navy SEAL and sports psychology research showing that when your mind says 'I'm done,' you are only at 40% of your true capacity. MindForge's 40% Rule Engine triggers when you are about to quit, surfacing your Cookie Jar victories and issuing a direct challenge to push through.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-[#0A0908] text-white">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-[#2A2927]">
          <span className="font-bold text-lg tracking-tight text-[#FF6B2B]" style={{ fontFamily: "var(--font-geist-sans)" }}>
            MINDFORGE
          </span>
          <Link
            href="/login"
            className="text-sm text-[#A09FA0] hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </nav>

        {/* 1. HERO */}
        <section
          className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,107,43,0.04) 0%, transparent 70%), #0A0908",
          }}
        >
          <p className="text-xs tracking-widest text-[#6B7280] uppercase mb-6">
            The first accountability system that tells you the truth
          </p>
          <h1
            className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight max-w-3xl"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Stop being soft with yourself.
          </h1>
          <p className="text-xl text-[#A09FA0] max-w-[600px] mb-10">
            MindForge uses neuroscience-backed behavior change and an AI coach
            that builds a persistent memory of who you are — and holds you to who
            you said you'd be.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#FF6B2B] text-white font-bold px-8 py-4 text-base hover:opacity-90 transition-opacity"
          >
            Start Forging — It's Free
          </Link>
          <p className="mt-4 text-xs text-[#6B7280]">
            No credit card. No gentle encouragement. Just accountability.
          </p>
        </section>

        {/* 2. PROBLEM */}
        <section className="bg-[#111110] px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-bold text-white mb-12 text-center"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Every other app is lying to you.
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Participation trophies",
                  body: "They reward showing up, not results. Your brain learns to tolerate failure.",
                },
                {
                  title: "No memory, no coaching",
                  body: "Generic reminders are not coaching. No app builds a real relationship with you.",
                },
                {
                  title: "Surface motivation collapses",
                  body: "Without your deepest why, streaks break and you abandon the app in two weeks.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="border border-[#2A2927] bg-[#0A0908] p-6"
                >
                  <h3 className="text-base font-semibold text-white mb-3">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="bg-[#0A0908] px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl font-bold text-white mb-14 text-center"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              The Forge System
            </h2>
            <div className="space-y-12">
              {[
                {
                  n: "01",
                  title: "Face the Mirror",
                  body: "Write the honest truth. Your AI coach responds without softening it.",
                },
                {
                  n: "02",
                  title: "Excavate Your Why",
                  body: "A Socratic AI dialogue uncovers your identity-level motivation. The anchor that does not break when motivation fails.",
                },
                {
                  n: "03",
                  title: "Forge Daily",
                  body: "Log habits honestly. Receive direct coaching. Watch your Forge Score reflect the truth of your behavior.",
                },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-8">
                  <span
                    className="text-4xl font-bold text-[#FF6B2B] flex-shrink-0 leading-none"
                    style={{ fontFamily: "var(--font-geist-sans)" }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[#A09FA0] text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. FEATURE GRID */}
        <section className="bg-[#111110] px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#2A2927]">
              {[
                {
                  title: "Forge Score",
                  body: "A real-time accountability score that reflects your actual behavior — not your effort.",
                },
                {
                  title: "AI Memory",
                  body: "Your coach remembers your patterns, triggers, and past victories across every session. No other app does this.",
                },
                {
                  title: "40% Rule Engine",
                  body: "When you are about to quit, the system triggers. Research shows you are at 40% of your true capacity.",
                },
                {
                  title: "Cookie Jar",
                  body: "Store your past victories. Your coach surfaces them when you are struggling.",
                },
                {
                  title: "Callousing Challenges",
                  body: "A library of graduated discomfort challenges that build real mental toughness.",
                },
                {
                  title: "No Skip Option",
                  body: "Completed or missed. No grace period. No undo. No excuses.",
                },
              ].map((feat) => (
                <div key={feat.title} className="bg-[#111110] p-8">
                  <h3 className="text-base font-semibold text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. PRICING */}
        <section className="bg-[#0A0908] px-6 py-20" id="pricing">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-bold text-white mb-3 text-center"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Pricing
            </h2>
            <p className="text-center text-[#6B7280] text-sm mb-12">
              Start free. Upgrade when you're serious.
            </p>
            <LandingPricing />
          </div>
        </section>

        {/* 6. SOCIAL PROOF */}
        <section className="bg-[#111110] px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-bold text-white mb-12 text-center"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Built for people who are done making excuses.
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I've tried 7 habit apps. MindForge is the first one that does not let me off the hook.",
                  name: "Marcus",
                  role: "Software Engineer",
                },
                {
                  quote:
                    "The AI coach actually remembers what I told it three weeks ago. That has never happened before.",
                  name: "Priya",
                  role: "Entrepreneur",
                },
                {
                  quote:
                    "My Forge Score dropped when I missed my workouts. That is the accountability I needed.",
                  name: "James",
                  role: "Founder",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="border border-[#2A2927] bg-[#0A0908] p-6"
                >
                  <p className="text-sm text-[#A09FA0] leading-relaxed mb-5">
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-[#6B7280]">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="bg-[#0A0908] px-6 py-24 text-center">
          <p className="text-xl text-[#A09FA0] max-w-xl mx-auto mb-8">
            The version of yourself you keep imagining? It is built in the forge.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#FF6B2B] text-white font-bold px-8 py-4 text-base hover:opacity-90 transition-opacity"
          >
            Start Forging — It's Free
          </Link>
          <p className="mt-4 text-xs text-[#6B7280]">No credit card required.</p>
        </section>

        {/* 8. FOOTER */}
        <footer className="bg-[#111110] border-t border-[#2A2927] px-6 py-10">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-[#FF6B2B] tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>
                MINDFORGE
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Rewire your brain. Forge your identity.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-[#6B7280] hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-[#6B7280] hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/login" className="text-xs text-[#6B7280] hover:text-white transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
