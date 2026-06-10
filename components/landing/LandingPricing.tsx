"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Get started with the basics.",
    features: [
      "Up to 3 habits",
      "Daily check-ins (no AI debrief)",
      "Cookie Jar (up to 10 entries)",
      "Basic Forge Score",
      "Challenge library access",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 12,
    annual: 89,
    description: "For people serious about change.",
    features: [
      "Unlimited habits",
      "Full AI coaching (persistent memory)",
      "AI debrief on every check-in",
      "Unlimited Cookie Jar",
      "Weekly Neural Report",
      "Analytics dashboard",
      "Challenge completion tracking",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Elite",
    monthly: 29,
    annual: 219,
    description: "Maximum accountability.",
    features: [
      "Everything in Pro",
      "Priority AI response",
      "Advanced analytics",
      "Early access to new features",
      "Accountability pod (coming soon)",
    ],
    cta: "Start Elite",
    highlighted: false,
  },
];

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm transition-colors duration-200 ${!annual ? "text-white font-medium" : "text-[#6B7280]"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-forge-orange"
          style={{ background: annual ? "#FF6B2B" : "#2A2927" }}
          aria-label="Toggle annual billing"
          aria-checked={annual}
          role="switch"
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300"
            style={{ transform: annual ? "translateX(26px)" : "translateX(4px)" }}
          />
        </button>
        <span className={`text-sm transition-colors duration-200 ${annual ? "text-white font-medium" : "text-[#6B7280]"}`}>
          Annual{" "}
          <span className="ml-1 bg-forge-orange px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
            Save 38%
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-6 sm:p-8 transition-all duration-200 ${
              plan.highlighted
                ? "border border-forge-orange bg-[#0F0D0C] shadow-[0_0_32px_rgba(255,107,43,0.12)]"
                : "border border-[#2A2927] bg-[#0A0908] hover:border-[#3D3B39]"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-px left-0 right-0 h-0.5 bg-forge-orange" />
            )}

            {plan.highlighted && (
              <p className="mb-3 text-xs font-bold tracking-[0.15em] text-forge-orange uppercase">
                Most Popular
              </p>
            )}

            <h3 className="font-heading text-xl font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">{plan.description}</p>

            <div className="mb-6">
              {plan.monthly === 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-white">Free</span>
                  <span className="text-[#6B7280] text-sm">forever</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-bold text-white">
                      ${annual ? Math.round(plan.annual / 12) : plan.monthly}
                    </span>
                    <span className="text-[#6B7280] text-sm">/month</span>
                  </div>
                  {annual && (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      ${plan.annual} billed annually
                    </p>
                  )}
                </div>
              )}
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#A09FA0] leading-relaxed">
                  <span className="mt-0.5 flex-shrink-0 text-forge-orange font-bold">—</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className={`flex min-h-[48px] items-center justify-center text-sm font-bold transition-all duration-200 ${
                plan.highlighted
                  ? "bg-forge-orange text-white hover:bg-forge-orange-hover hover:shadow-[0_0_20px_rgba(255,107,43,0.4)]"
                  : "border border-[#2A2927] text-[#A09FA0] hover:border-[#3D3B39] hover:text-white"
              }`}
            >
              {plan.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
