import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
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

// ─── Structured data ─────────────────────────────────────────────────────────

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
    { "@type": "ContactPoint", email: "privacy@mindforge.app", contactType: "customer support" },
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

// ─── Features list ────────────────────────────────────────────────────────────

const FEATURES = [
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
];

const PROBLEMS = [
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
];

const STEPS = [
  {
    n: "01",
    title: "Face the Mirror",
    body: "Write the honest truth. Your AI coach responds without softening it.",
  },
  {
    n: "02",
    title: "Excavate Your Why",
    body: "A Socratic AI dialogue uncovers your identity-level motivation — the anchor that does not break when motivation fails.",
  },
  {
    n: "03",
    title: "Forge Daily",
    body: "Log habits honestly. Receive direct coaching. Watch your Forge Score reflect the truth of your behavior.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried 7 habit apps. MindForge is the first one that does not let me off the hook.",
    name: "Marcus",
    role: "Software Engineer",
  },
  {
    quote: "The AI coach actually remembers what I told it three weeks ago. That has never happened before.",
    name: "Priya",
    role: "Entrepreneur",
  },
  {
    quote: "My Forge Score dropped when I missed my workouts. That is the accountability I needed.",
    name: "James",
    role: "Founder",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

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

      <div className="min-h-screen bg-[#0A0908] text-white overflow-x-hidden">

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <LandingNav />

        {/* ── 1. Hero ──────────────────────────────────────────────────── */}
        <section
          className="relative flex min-h-[90vh] sm:min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,107,43,0.06) 0%, transparent 70%), #0A0908",
          }}
        >
          {/* Decorative top rule */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-48 sm:w-64 bg-gradient-to-r from-transparent via-forge-orange to-transparent opacity-60" />

          <p className="mb-6 text-xs sm:text-sm tracking-[0.2em] text-[#6B7280] uppercase font-medium">
            The first accountability system that tells you the truth
          </p>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.06] max-w-[14ch] mb-6 sm:mb-8">
            Stop being soft with yourself.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#A09FA0] max-w-[42ch] leading-[1.65] mb-10 sm:mb-12">
            MindForge uses neuroscience-backed behavior change and an AI coach
            that builds a persistent memory of who you are — and holds you to who
            you said you'd be.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/login"
              className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center bg-forge-orange px-8 sm:px-10 text-sm sm:text-base font-bold text-white transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_28px_rgba(255,107,43,0.40)]"
            >
              Start Forging — It's Free →
            </Link>
            <Link
              href="#pricing"
              className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center border border-[#2A2927] px-8 sm:px-10 text-sm font-medium text-[#87857F] transition-all duration-200 hover:border-[#3D3B39] hover:text-white"
            >
              View Pricing
            </Link>
          </div>

          <p className="mt-5 text-xs text-[#4A4845]">
            No credit card. No gentle encouragement. Just accountability.
          </p>
        </section>

        {/* ── 2. Problem ───────────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-center text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The problem
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 sm:mb-14 text-center">
              Every other app is lying to you.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {PROBLEMS.map((card) => (
                <div
                  key={card.title}
                  className="group border border-[#2A2927] bg-[#0A0908] p-6 sm:p-8 transition-all duration-200 hover:border-[#3D3B39] hover:bg-[#0F0D0C]"
                >
                  <div className="mb-4 h-px w-8 bg-forge-orange opacity-60" />
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-white mb-3 group-hover:text-forge-orange-text transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-[1.65] text-[#6B7280]">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. How It Works ──────────────────────────────────────────── */}
        <section className="bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-center text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              How it works
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-12 sm:mb-16 text-center">
              The Forge System
            </h2>
            <div className="space-y-10 sm:space-y-14">
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative flex items-start gap-6 sm:gap-10">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[22px] sm:left-[26px] top-12 h-[calc(100%+2rem)] sm:h-[calc(100%+3.5rem)] w-px bg-[#2A2927]" />
                  )}
                  <span className="font-heading text-3xl sm:text-4xl font-bold text-forge-orange flex-shrink-0 leading-none w-11 sm:w-14 text-center">
                    {step.n}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#A09FA0] leading-[1.65]">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Feature Grid ──────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-center text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The arsenal
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 sm:mb-14 text-center">
              Built for people who are serious.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#2A2927]">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="group bg-[#111110] p-6 sm:p-8 transition-colors duration-200 hover:bg-[#141312]"
                >
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-white mb-2 group-hover:text-forge-orange-text transition-colors duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-[1.65] text-[#6B7280]">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Pricing ───────────────────────────────────────────────── */}
        <section className="bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-16 sm:py-24" id="pricing">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-center text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              Pricing
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 text-center">
              Start free. Upgrade when you're serious.
            </h2>
            <p className="text-center text-sm text-[#6B7280] mb-10 sm:mb-14">
              No trial periods. No upsell pressure. Just pick your level.
            </p>
            <LandingPricing />
          </div>
        </section>

        {/* ── 6. Social Proof ──────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-center text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              Early forgers
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 sm:mb-14 text-center">
              Built for people who are done making excuses.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col justify-between border border-[#2A2927] bg-[#0A0908] p-6 sm:p-8 transition-all duration-200 hover:border-[#3D3B39]"
                >
                  <p className="text-sm sm:text-base text-[#A09FA0] leading-[1.7] mb-6 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-forge-orange font-heading text-sm font-bold text-white">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
                      <p className="text-xs text-[#6B7280]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Final CTA ─────────────────────────────────────────────── */}
        <section className="relative bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,107,43,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="mb-3 text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The forge awaits
            </p>
            <p className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-snug">
              The version of yourself you keep imagining?
            </p>
            <p className="text-base sm:text-lg text-[#A09FA0] mb-10 leading-[1.65]">
              It is built in the forge — one honest day at a time.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-[56px] w-full sm:w-auto items-center justify-center bg-forge-orange px-10 sm:px-14 text-base font-bold text-white transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_32px_rgba(255,107,43,0.45)]"
            >
              Start Forging — It's Free →
            </Link>
            <p className="mt-5 text-xs text-[#4A4845]">No credit card required.</p>
          </div>
        </section>

        {/* ── 8. Footer ────────────────────────────────────────────────── */}
        <footer className="bg-[#111110] border-t border-[#2A2927] px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="font-heading text-base font-bold tracking-tight text-forge-orange">
                  MINDFORGE
                </p>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Rewire your brain. Forge your identity.
                </p>
              </div>
              <nav
                className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3"
                aria-label="Footer navigation"
              >
                <Link
                  href="/privacy"
                  className="text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/login"
                  className="text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[36px] items-center border border-[#2A2927] px-4 text-xs font-semibold text-[#A09FA0] hover:border-forge-orange hover:text-forge-orange transition-all duration-200"
                >
                  Start Free
                </Link>
              </nav>
            </div>
            <div className="mt-8 border-t border-[#1A1918] pt-6">
              <p className="text-center text-xs text-[#4A4845]">
                © {new Date().getFullYear()} MindForge. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
