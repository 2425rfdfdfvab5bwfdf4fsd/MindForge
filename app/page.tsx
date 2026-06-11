import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { BarChart2, Brain, Zap, Cookie, Flame, Ban, Trophy, MessageSquareOff, TrendingDown } from "lucide-react";

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
    icon: BarChart2,
    title: "Forge Score",
    body: "A real-time accountability score that reflects your actual behavior — not your effort.",
  },
  {
    icon: Brain,
    title: "AI Memory",
    body: "Your coach remembers your patterns, triggers, and past victories across every session. No other app does this.",
  },
  {
    icon: Zap,
    title: "40% Rule Engine",
    body: "When you are about to quit, the system triggers. Research shows you are at 40% of your true capacity.",
  },
  {
    icon: Cookie,
    title: "Cookie Jar",
    body: "Store your past victories. Your coach surfaces them when you are struggling.",
  },
  {
    icon: Flame,
    title: "Callousing Challenges",
    body: "A library of graduated discomfort challenges that build real mental toughness.",
  },
  {
    icon: Ban,
    title: "No Skip Option",
    body: "Completed or missed. No grace period. No undo. No excuses.",
  },
];

const PROBLEMS = [
  {
    icon: Trophy,
    title: "Participation trophies",
    body: "They reward showing up, not results. Your brain learns to tolerate failure.",
  },
  {
    icon: MessageSquareOff,
    title: "No memory, no coaching",
    body: "Generic reminders are not coaching. No app builds a real relationship with you.",
  },
  {
    icon: TrendingDown,
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
          className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-14 sm:py-20 2xl:py-28"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 60% 40%, rgba(255,107,43,0.07) 0%, transparent 65%), #0A0908",
          }}
        >
          {/* Decorative top rule */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-64 sm:w-96 bg-gradient-to-r from-transparent via-forge-orange to-transparent opacity-50" />
          {/* Faint grid texture */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#FF6B2B 1px, transparent 1px), linear-gradient(90deg, #FF6B2B 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

          <div className="relative mx-auto max-w-6xl 2xl:max-w-9xl">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 2xl:gap-24">

              {/* Left: copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-5 inline-flex items-center gap-2 border border-forge-orange/25 bg-forge-orange/5 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-forge-orange animate-pulse" />
                  <span className="text-xs tracking-[0.18em] text-forge-orange uppercase font-semibold">
                    The first accountability system that tells you the truth
                  </span>
                </div>

                <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-7xl 2xl:text-8xl font-bold text-white leading-[1.04] mb-6 sm:mb-8 2xl:mb-10">
                  Stop being soft<br className="hidden sm:block" /> with yourself.
                </h1>

                <p className="text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-[#A09FA0] max-w-[42ch] mx-auto lg:mx-0 leading-[1.7] mb-10 sm:mb-12 2xl:mb-14">
                  MindForge uses neuroscience-backed behavior change and an AI coach
                  that builds a persistent memory of who you are — and holds you to who
                  you said you&apos;d be.
                </p>

                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-4">
                  <Link
                    href="/login"
                    className="inline-flex min-h-[52px] 2xl:min-h-[60px] w-full sm:w-auto items-center justify-center bg-forge-orange px-8 sm:px-10 2xl:px-12 text-sm sm:text-base 2xl:text-lg font-bold text-white transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_32px_rgba(255,107,43,0.45)] active:scale-[0.98]"
                  >
                    Start Forging — It&apos;s Free →
                  </Link>
                  <Link
                    href="#pricing"
                    className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center border border-[#2A2927] px-8 sm:px-10 text-sm font-medium text-[#87857F] transition-all duration-200 hover:border-[#3D3B39] hover:text-white"
                  >
                    View Pricing
                  </Link>
                </div>

                <p className="mt-5 text-xs text-[#4A4845] text-center lg:text-left">
                  No credit card. No gentle encouragement. Just accountability.
                </p>
              </div>

              {/* Right: product mockup */}
              <div className="w-full max-w-[360px] sm:max-w-sm lg:max-w-[400px] 2xl:max-w-[460px] flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative">
                  <div className="absolute -inset-6 bg-forge-orange/5 blur-3xl" />
                  <div className="absolute -inset-px bg-gradient-to-b from-forge-orange/20 to-transparent" />
                  <div className="relative border border-[#2A2927] bg-[#111110]">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2927] bg-[#0F0E0D]">
                      <div>
                        <p className="text-[10px] text-[#4A4845] uppercase tracking-widest">Thursday · Jan 16</p>
                        <p className="font-heading text-sm font-bold text-white mt-0.5">Daily Forge</p>
                      </div>
                      <div className="border border-forge-orange/30 bg-forge-orange/8 px-2.5 py-1">
                        <span className="text-[10px] font-bold text-forge-orange tracking-wider">DAY 47</span>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Forge Score */}
                      <div className="mb-4 border border-[#2A2927] bg-[#0A0908] px-4 py-4 text-center">
                        <p className="text-[9px] tracking-[0.2em] text-[#6B7280] uppercase mb-1.5">Forge Score</p>
                        <p className="font-heading text-5xl font-bold text-forge-orange leading-none tabular-nums">847</p>
                        <div className="mt-3 h-1 bg-[#2A2927] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-forge-orange to-[#FF9A5C]" style={{ width: "84.7%" }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-[#6B7280]">Elite tier</span>
                          <span className="text-[10px] text-forge-orange font-semibold">Top 12%</span>
                        </div>
                      </div>

                      {/* Habits */}
                      <div className="space-y-1.5 mb-4">
                        {[
                          { label: "Morning Run", done: true, xp: "+15 XP" },
                          { label: "Cold Shower", done: true, xp: "+10 XP" },
                          { label: "Deep Work Block", done: false },
                        ].map((h) => (
                          <div key={h.label} className="flex items-center gap-2.5 px-3 py-2 bg-[#0A0908] border border-[#2A2927]">
                            <div className={`h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center ${h.done ? "bg-forge-orange" : "border border-[#3D3B39]"}`}>
                              {h.done && <span className="text-[8px] text-white font-black leading-none">✓</span>}
                            </div>
                            <span className={`text-xs flex-1 ${h.done ? "text-[#4A4845] line-through" : "text-[#C2C0BE]"}`}>{h.label}</span>
                            {h.done && <span className="text-[10px] text-green-400 font-semibold tabular-nums">{h.xp}</span>}
                            {!h.done && <span className="text-[10px] text-[#4A4845]">pending</span>}
                          </div>
                        ))}
                      </div>

                      {/* AI message */}
                      <div className="flex bg-[#0A0908] border border-[#2A2927]">
                        <div className="w-0.5 bg-forge-orange flex-shrink-0" />
                        <div className="px-3 py-2.5">
                          <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">AI Coach</p>
                          <p className="text-xs text-[#A09FA0] leading-relaxed italic">&ldquo;47 days in. You said you&apos;d never miss two in a row. Deep Work is still pending.&rdquo;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        <div className="border-y border-[#2A2927] bg-[#111110] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {([
              { value: "100%", label: "Honest feedback" },
              { value: "0", label: "Participation trophies" },
              { value: "3", label: "Steps to accountability" },
              { value: "∞", label: "Excuses eliminated" },
            ] as const).map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-bold text-forge-orange tabular-nums">{s.value}</p>
                <p className="text-xs sm:text-sm text-[#6B7280] mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Problem ───────────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-12 sm:py-24 2xl:py-32">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl">
            <p className="mb-3 text-center text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The problem
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-10 sm:mb-14 text-center">
              Every other app is lying to you.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 2xl:gap-8">
              {PROBLEMS.map((card) => (
                <div
                  key={card.title}
                  className="group border border-[#2A2927] bg-[#0A0908] p-6 sm:p-8 2xl:p-10 transition-all duration-200 hover:border-[#3D3B39] hover:bg-[#0F0D0C]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[#2A2927] bg-[#111110] group-hover:border-forge-orange/30 transition-colors duration-200">
                    <card.icon className="h-5 w-5 text-forge-orange" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg 2xl:text-xl font-semibold text-white mb-3 group-hover:text-forge-orange-text transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="text-sm 2xl:text-base leading-[1.65] text-[#6B7280]">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. How It Works ──────────────────────────────────────────── */}
        <section className="bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-12 sm:py-24 2xl:py-32">
          <div className="mx-auto max-w-3xl 2xl:max-w-5xl">
            <p className="mb-3 text-center text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              How it works
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-12 sm:mb-16 text-center">
              The Forge System
            </h2>
            <div className="space-y-10 sm:space-y-14 2xl:space-y-20">
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative flex items-start gap-6 sm:gap-10">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[22px] sm:left-[26px] top-12 h-[calc(100%+2rem)] sm:h-[calc(100%+3.5rem)] w-px bg-[#2A2927]" />
                  )}
                  <span className="font-heading text-3xl sm:text-4xl 2xl:text-5xl font-bold text-forge-orange flex-shrink-0 leading-none w-11 sm:w-14 2xl:w-16 text-center">
                    {step.n}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-heading text-lg sm:text-xl 2xl:text-2xl font-semibold text-white mb-2 sm:mb-3 2xl:mb-4">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base 2xl:text-lg text-[#A09FA0] leading-[1.65]">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Feature Grid ──────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-12 sm:py-24 2xl:py-32">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl">
            <p className="mb-3 text-center text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The arsenal
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-10 sm:mb-14 text-center">
              Built for people who are serious.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2A2927]">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="group bg-[#111110] p-6 sm:p-8 2xl:p-10 transition-colors duration-200 hover:bg-[#141312]"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center bg-forge-orange/10 border border-forge-orange/20 group-hover:bg-forge-orange/15 transition-colors duration-200">
                    <feat.icon className="h-4 w-4 text-forge-orange" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg 2xl:text-xl font-semibold text-white mb-2 group-hover:text-forge-orange-text transition-colors duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-sm 2xl:text-base leading-[1.65] text-[#6B7280]">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Pricing ───────────────────────────────────────────────── */}
        <section className="bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-12 sm:py-24 2xl:py-32" id="pricing">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl">
            <p className="mb-3 text-center text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              Pricing
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-3 text-center">
              Start free. Upgrade when you're serious.
            </h2>
            <p className="text-center text-sm text-[#6B7280] mb-10 sm:mb-14">
              No trial periods. No upsell pressure. Just pick your level.
            </p>
            <LandingPricing />
          </div>
        </section>

        {/* ── 6. Social Proof ──────────────────────────────────────────── */}
        <section className="bg-[#111110] px-4 sm:px-6 lg:px-8 py-12 sm:py-24 2xl:py-32">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl">
            <p className="mb-3 text-center text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              Early forgers
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-10 sm:mb-14 text-center">
              Built for people who are done making excuses.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 2xl:gap-8">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col justify-between border border-[#2A2927] bg-[#0A0908] p-6 sm:p-8 2xl:p-10 transition-all duration-200 hover:border-[#3D3B39]"
                >
                  <div>
                    <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-3.5 w-3.5 fill-forge-orange text-forge-orange" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm sm:text-base 2xl:text-lg text-[#A09FA0] leading-[1.7] mb-6 italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#1A1918]">
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
        <section className="relative bg-[#0A0908] px-4 sm:px-6 lg:px-8 py-14 sm:py-28 2xl:py-40 text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,107,43,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="mb-3 text-xs 2xl:text-sm tracking-[0.18em] text-forge-orange uppercase font-semibold">
              The forge awaits
            </p>
            <p className="font-heading text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl font-bold text-white mb-4 leading-snug">
              The version of yourself you keep imagining?
            </p>
            <p className="text-base sm:text-lg 2xl:text-xl text-[#A09FA0] mb-10 leading-[1.65]">
              It is built in the forge — one honest day at a time.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-[56px] 2xl:min-h-[64px] w-full sm:w-auto items-center justify-center bg-forge-orange px-10 sm:px-14 2xl:px-16 text-base 2xl:text-lg font-bold text-white transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_32px_rgba(255,107,43,0.45)]"
            >
              Start Forging — It's Free →
            </Link>
            <p className="mt-5 text-xs text-[#4A4845]">No credit card required.</p>
          </div>
        </section>

        {/* ── 8. Footer ────────────────────────────────────────────────── */}
        <footer className="bg-[#111110] border-t border-[#2A2927] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 2xl:py-16">
          <div className="mx-auto max-w-5xl 2xl:max-w-8xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="font-heading text-base 2xl:text-lg font-bold tracking-tight text-forge-orange">
                  MINDFORGE
                </p>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Rewire your brain. Forge your identity.
                </p>
              </div>
              <nav
                className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-1"
                aria-label="Footer navigation"
              >
                <Link
                  href="/privacy"
                  className="inline-flex min-h-[40px] items-center text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex min-h-[40px] items-center text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[40px] items-center text-xs text-[#6B7280] hover:text-white transition-colors duration-200"
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
