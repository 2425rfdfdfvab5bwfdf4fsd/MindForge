"use client";

import { useState } from "react";
import { Check, Zap, Crown, Shield } from "lucide-react";
import { api } from "@/lib/trpc/client";

type Billing = "annual" | "monthly";

const PLANS = {
  free: {
    name: "Free",
    icon: Shield,
    monthlyPrice: 0,
    annualPrice: 0,
    color: "#6B7280",
    planKey: null,
    features: [
      "Up to 3 active habits",
      "Up to 5 Cookie Jar entries",
      "Difficulty-1 challenges only",
      "Daily check-in (no AI debrief)",
      "No Forge Coach chat",
    ],
  },
  pro: {
    name: "Pro",
    icon: Zap,
    monthlyPrice: 12,
    annualPrice: 89,
    annualSaving: "Save 38%",
    color: "#FF6B2B",
    planKeyMonthly: "pro_monthly",
    planKeyAnnual: "pro_annual",
    features: [
      "Unlimited habits",
      "Unlimited Cookie Jar entries",
      "Full challenge library",
      "AI debrief after every check-in",
      "Direct Forge Coach chat (unlimited)",
      "Weekly Neural Report email",
      "Persistent AI memory system",
    ],
  },
  elite: {
    name: "Elite",
    icon: Crown,
    monthlyPrice: 29,
    annualPrice: 219,
    annualSaving: "Save 37%",
    color: "#A855F7",
    planKeyMonthly: "elite_monthly",
    planKeyAnnual: "elite_annual",
    features: [
      "Everything in Pro",
      "Weekly AI group coaching session",
      "Priority AI response speed",
      "One-time Identity Reset",
      "Founding member badge",
    ],
  },
};

export default function UpgradePage() {
  const [billing, setBilling] = useState<Billing>("annual");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const currentTier = profile?.tier ?? "free";

  async function handleUpgrade(planKey: string) {
    setLoadingPlan(planKey);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0908] px-4 py-12 2xl:py-16">
      <div className="max-w-5xl 2xl:max-w-8xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-bold text-white mb-3 tracking-tight">
            Forge Your Best Self
          </h1>
          <p className="text-[#6B7280] text-base sm:text-lg 2xl:text-xl max-w-xl mx-auto">
            Choose the level of accountability that matches your ambition.
          </p>

          <div className="inline-flex items-center gap-1 mt-8 bg-[#111110] border border-[#2A2927] rounded-lg p-1">
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 min-h-[40px] rounded-md text-sm font-medium transition-colors ${
                billing === "annual"
                  ? "bg-[#FF6B2B] text-white"
                  : "text-[#6B7280] hover:text-white"
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 min-h-[40px] rounded-md text-sm font-medium transition-colors ${
                billing === "monthly"
                  ? "bg-[#FF6B2B] text-white"
                  : "text-[#6B7280] hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-10">
          {(["free", "pro", "elite"] as const).map((tier) => {
            const plan = PLANS[tier];
            const isPro = tier === "pro";
            const isCurrent = currentTier === tier;
            const price =
              tier === "free"
                ? 0
                : billing === "annual"
                ? plan.annualPrice
                : plan.monthlyPrice;
            const planKey =
              tier === "free"
                ? null
                : billing === "annual"
                ? (plan as typeof PLANS.pro).planKeyAnnual
                : (plan as typeof PLANS.pro).planKeyMonthly;
            const isLoading = loadingPlan === planKey;
            const Icon = plan.icon;

            return (
              <div
                key={tier}
                className={`relative flex flex-col bg-[#111110] rounded-xl p-6 2xl:p-8 border transition-colors ${
                  isPro
                    ? "border-[#FF6B2B]"
                    : "border-[#2A2927]"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FF6B2B] text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-[#1A2A1A] text-green-400 text-xs font-semibold px-2 py-0.5 rounded border border-green-500/30">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <span className="text-white font-bold text-lg 2xl:text-xl">{plan.name}</span>
                </div>

                <div className="mb-6">
                  {tier === "free" ? (
                    <div className="text-4xl 2xl:text-5xl font-bold text-white">
                      $0
                      <span className="text-base font-normal text-[#6B7280] ml-1">
                        / forever
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl 2xl:text-5xl font-bold text-white">
                        ${billing === "annual" ? plan.annualPrice : plan.monthlyPrice}
                        <span className="text-base font-normal text-[#6B7280] ml-1">
                          / {billing === "annual" ? "year" : "month"}
                        </span>
                      </div>
                      {billing === "annual" && "annualSaving" in plan && (
                        <div
                          className="text-sm font-semibold mt-1"
                          style={{ color: plan.color }}
                        >
                          {plan.annualSaving}
                        </div>
                      )}
                      {billing === "annual" && (
                        <div className="text-xs text-[#6B7280] mt-0.5">
                          ${Math.round((plan.annualPrice as number) / 12)}/mo billed annually
                        </div>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm 2xl:text-base">
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: plan.color }}
                      />
                      <span className="text-[#A09FA0]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier === "free" ? (
                  <div className="w-full py-3 rounded-lg border border-[#2A2927] text-center text-[#6B7280] text-sm font-medium">
                    {isCurrent ? "Current Plan" : "Free Forever"}
                  </div>
                ) : (
                  <button
                    onClick={() => planKey && handleUpgrade(planKey)}
                    disabled={isCurrent || isLoading}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: plan.color,
                      color: "#fff",
                    }}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : isLoading
                      ? "Redirecting…"
                      : `Get ${plan.name} ${billing === "annual" ? "Annual" : "Monthly"}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-[#6B7280] text-xs 2xl:text-sm mt-10">
          Payments processed securely by Lemon Squeezy. Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}
