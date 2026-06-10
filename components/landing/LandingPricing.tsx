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
        <span className={`text-sm ${!annual ? "text-white" : "text-[#6B7280]"}`}>Monthly</span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{ background: annual ? "#FF6B2B" : "#2A2927" }}
          aria-label="Toggle annual billing"
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
            style={{ transform: annual ? "translateX(24px)" : "translateX(4px)" }}
          />
        </button>
        <span className={`text-sm ${annual ? "text-white" : "text-[#6B7280]"}`}>
          Annual{" "}
          <span className="text-[#FF6B2B] text-xs font-semibold ml-1">Save ~38%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#2A2927]">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="bg-[#0A0908] p-8 flex flex-col"
            style={plan.highlighted ? { border: "1px solid #FF6B2B" } : {}}
          >
            {plan.highlighted && (
              <p className="text-xs font-semibold text-[#FF6B2B] tracking-widest uppercase mb-3">
                Most Popular
              </p>
            )}
            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-sm text-[#6B7280] mb-5">{plan.description}</p>
            <div className="mb-6">
              {plan.monthly === 0 ? (
                <span className="text-4xl font-bold text-white">Free</span>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">
                    ${annual ? Math.round(plan.annual / 12) : plan.monthly}
                  </span>
                  <span className="text-[#6B7280] text-sm ml-1">/month</span>
                  {annual && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      ${plan.annual}/year billed annually
                    </p>
                  )}
                </>
              )}
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#A09FA0]">
                  <span className="text-[#FF6B2B] flex-shrink-0 mt-0.5">—</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block text-center font-semibold text-sm py-3 transition-opacity"
              style={
                plan.highlighted
                  ? { background: "#FF6B2B", color: "#fff" }
                  : { border: "1px solid #2A2927", color: "#A09FA0" }
              }
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
