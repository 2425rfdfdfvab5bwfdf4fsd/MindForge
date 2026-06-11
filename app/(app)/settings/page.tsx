"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Brain,
  Settings2,
  CreditCard,
  Database,
  Check,
  Lock,
  ChevronDown,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/trpc/client";

type Tab = "profile" | "identity" | "coach" | "subscription" | "data";

const BADGE_DEFINITIONS = {
  identity_locked: {
    label: "Identity Locked",
    description: "Complete Why Excavation and set your identity declaration",
    emoji: "🔒",
  },
  mirror_gazer: {
    label: "Mirror Gazer",
    description: "Complete 30 consecutive daily check-ins",
    emoji: "🪞",
  },
  cookie_jar_founder: {
    label: "Cookie Jar Founder",
    description: "Log 10 victories in your Cookie Jar",
    emoji: "🍪",
  },
  forty_percent_survivor: {
    label: "40% Survivor",
    description: "Push through the 40% Rule 5 times",
    emoji: "🔥",
  },
  cold_mind: {
    label: "Cold Mind",
    description: "Complete 7 cold category challenges",
    emoji: "❄️",
  },
  tempered: {
    label: "Tempered",
    description: "Reach Level 2 (500 XP)",
    emoji: "⚒️",
  },
} as const;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

function TabButton({
  id,
  active,
  onClick,
  icon: Icon,
  label,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors shrink-0 whitespace-nowrap lg:w-full text-left ${
        active
          ? "bg-[#FF6B2B]/15 text-[#FF6B2B]"
          : "text-[#6B7280] hover:text-white hover:bg-[#1A1918]"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  loading,
  saved,
}: {
  onClick: () => void;
  loading: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-4 px-5 py-2 bg-[#FF6B2B] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
    >
      {saved ? <Check className="w-4 h-4" /> : null}
      {loading ? "Saving…" : saved ? "Saved" : "Save Changes"}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const { data: profile, refetch: refetchProfile } = api.user.getProfile.useQuery(undefined, {
    retry: false,
  });
  const { data: subscription } = api.user.getSubscription.useQuery(undefined, { retry: false });
  const { data: badges = [] } = api.user.getBadges.useQuery(undefined, { retry: false });

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      refetchProfile();
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [coachIntensity, setCoachIntensity] = useState<"hard" | "firm">("hard");
  const [profileSaved, setProfileSaved] = useState(false);
  const [coachSaved, setCoachSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setTimezone(profile.timezone ?? "UTC");
      setCoachIntensity((profile.coachIntensity as "hard" | "firm") ?? "hard");
    }
  }, [profile]);

  async function saveProfile() {
    await updateProfile.mutateAsync({ displayName: displayName.trim() || undefined });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function saveCoach() {
    await updateProfile.mutateAsync({ coachIntensity, timezone });
    setCoachSaved(true);
    setTimeout(() => setCoachSaved(false), 2000);
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindforge-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleteLoading(true);
    try {
      await fetch("/api/user/delete", { method: "POST" });
      router.push("/");
    } finally {
      setDeleteLoading(false);
    }
  }

  const tierLabel =
    profile?.tier === "elite"
      ? "Elite"
      : profile?.tier === "pro"
      ? "Pro"
      : "Free";

  const tierColor =
    profile?.tier === "elite"
      ? "#A855F7"
      : profile?.tier === "pro"
      ? "#FF6B2B"
      : "#6B7280";

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "identity", icon: Brain, label: "Identity" },
    { id: "coach", icon: Settings2, label: "Coach Preferences" },
    { id: "subscription", icon: CreditCard, label: "Subscription" },
    { id: "data", icon: Database, label: "Data" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0908] px-4 py-8 2xl:py-12">
      <div className="max-w-4xl 2xl:max-w-7xl mx-auto">
        <h1 className="text-2xl 2xl:text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 2xl:gap-8">
          <aside className="w-full lg:w-52 2xl:w-64 lg:flex-shrink-0">
            <nav className="flex overflow-x-auto gap-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:space-y-1">
              {tabs.map((t) => (
                <TabButton
                  key={t.id}
                  id={t.id}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                  icon={t.icon}
                  label={t.label}
                />
              ))}
            </nav>
          </aside>

          <main className="flex-1 bg-[#111110] border border-[#2A2927] rounded-xl p-5 sm:p-6 2xl:p-8 space-y-8 2xl:space-y-10">
            {tab === "profile" && (
              <>
                <Section title="Profile">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm 2xl:text-base text-[#A09FA0] mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-2.5 2xl:py-3 text-white text-sm 2xl:text-base placeholder-[#4A4947] focus:outline-none focus:border-[#FF6B2B] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A09FA0] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile?.email ?? ""}
                        readOnly
                        className="w-full bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-2.5 text-[#6B7280] text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-[#4A4947] mt-1">
                        Email is managed by your Replit account
                      </p>
                    </div>
                  </div>
                  <SaveButton
                    onClick={saveProfile}
                    loading={updateProfile.isPending}
                    saved={profileSaved}
                  />
                </Section>
              </>
            )}

            {tab === "identity" && (
              <>
                <Section title="Your Why">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#A09FA0] mb-1.5">
                        Why Statement
                      </label>
                      <div className="w-full bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-3 text-sm text-[#A09FA0] min-h-[80px]">
                        {profile?.whyStatement ?? (
                          <span className="text-[#4A4947] italic">
                            Not set — complete Why Excavation onboarding
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#A09FA0] mb-1.5">
                        Identity Declaration
                      </label>
                      <div className="w-full bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-3 text-sm text-[#A09FA0] min-h-[60px]">
                        {profile?.identityDeclaration ?? (
                          <span className="text-[#4A4947] italic">
                            Not set — complete Why Excavation onboarding
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#4A4947]">
                      Why Excavation reset is available on the Elite plan. Contact support to request it.
                    </p>
                  </div>
                </Section>

                <Section title="Badges">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.entries(BADGE_DEFINITIONS) as [string, { label: string; description: string; emoji: string }][]).map(
                      ([key, def]) => {
                        const earned = badges.some((b) => b.badgeKey === key);
                        const earnedBadge = badges.find((b) => b.badgeKey === key);
                        return (
                          <div
                            key={key}
                            className={`relative rounded-lg p-4 border transition-colors ${
                              earned
                                ? "border-[#FF6B2B]/40 bg-[#FF6B2B]/5"
                                : "border-[#2A2927] bg-[#1A1918] opacity-50"
                            }`}
                          >
                            {!earned && (
                              <Lock className="absolute top-2 right-2 w-3 h-3 text-[#4A4947]" />
                            )}
                            <div className="text-2xl mb-2">
                              {earned ? def.emoji : "🔘"}
                            </div>
                            <div className="text-xs font-semibold text-white mb-1">
                              {def.label}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {earned && earnedBadge?.earnedAt
                                ? `Earned ${new Date(earnedBadge.earnedAt).toLocaleDateString()}`
                                : def.description}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </Section>
              </>
            )}

            {tab === "coach" && (
              <>
                <Section title="Coaching Style">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm text-[#A09FA0] mb-3">
                        Coach Intensity
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["hard", "firm"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setCoachIntensity(mode)}
                            className={`p-4 rounded-lg border text-left transition-colors ${
                              coachIntensity === mode
                                ? "border-[#FF6B2B] bg-[#FF6B2B]/10"
                                : "border-[#2A2927] bg-[#1A1918] hover:border-[#3A3937]"
                            }`}
                          >
                            <div className="text-sm font-semibold text-white mb-1">
                              {mode === "hard" ? "Hard Truth" : "Firm but Kind"}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {mode === "hard"
                                ? "Raw accountability. No sugar-coating."
                                : "Firm guidance with compassion."}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A09FA0] mb-1.5">
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full appearance-none bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6B2B] transition-colors pr-10"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#1A1918] border border-[#2A2927] rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Weekly Neural Report
                        </div>
                        <div className="text-xs text-[#6B7280] mt-0.5">
                          {profile?.tier === "free"
                            ? "Available on Pro plan"
                            : "Email delivered every Sunday"}
                        </div>
                      </div>
                      {profile?.tier === "free" ? (
                        <a
                          href="/upgrade"
                          className="text-xs text-[#FF6B2B] font-semibold hover:underline"
                        >
                          Upgrade
                        </a>
                      ) : (
                        <div className="w-10 h-6 bg-[#FF6B2B] rounded-full flex items-center justify-end px-0.5">
                          <div className="w-5 h-5 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <SaveButton
                    onClick={saveCoach}
                    loading={updateProfile.isPending}
                    saved={coachSaved}
                  />
                </Section>
              </>
            )}

            {tab === "subscription" && (
              <>
                <Section title="Current Plan">
                  <div className="p-4 bg-[#1A1918] border border-[#2A2927] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${tierColor}20` }}
                      >
                        {tierLabel === "Elite" ? "👑" : tierLabel === "Pro" ? "⚡" : "🛡️"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{tierLabel}</span>
                          {subscription && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                subscription.status === "active"
                                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                                  : subscription.status === "cancelled"
                                  ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                                  : "text-red-400 border-red-500/30 bg-red-500/10"
                              }`}
                            >
                              {subscription.status}
                            </span>
                          )}
                        </div>
                        {subscription?.status === "cancelled" &&
                          subscription.currentPeriodEnd && (
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              Access continues until{" "}
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Billing">
                  {profile?.tier === "free" ? (
                    <a
                      href="/upgrade"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2B] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade to Pro
                    </a>
                  ) : (
                    <div className="space-y-3">
                      {subscription?.lemonsqueezyCustomerId && (
                        <a
                          href={`https://app.lemonsqueezy.com/my-orders`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1918] border border-[#2A2927] text-white text-sm font-medium rounded-lg hover:border-[#3A3937] transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          Manage Billing
                        </a>
                      )}
                    </div>
                  )}
                </Section>

                {profile?.tier === "elite" && (
                  <Section title="Elite Options">
                    <div className="p-4 bg-[#1A1918] border border-purple-500/30 rounded-lg">
                      <div className="text-sm font-semibold text-white mb-1">
                        Identity Reset
                      </div>
                      <p className="text-xs text-[#6B7280] mb-3">
                        Redo your Why Excavation and forge a new identity declaration.
                        One-time use per account.
                      </p>
                      <button
                        onClick={async () => {
                          await updateProfile.mutateAsync({ onboardingStep: "why" });
                          router.push("/onboarding/why");
                        }}
                        disabled={updateProfile.isPending}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        Reset Why Excavation
                      </button>
                    </div>
                  </Section>
                )}
              </>
            )}

            {tab === "data" && (
              <>
                <Section title="Export">
                  <p className="text-sm text-[#A09FA0] mb-4">
                    Download all your MindForge data — check-ins, habits, Cookie Jar, and more.
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="px-5 py-2.5 bg-[#1A1918] border border-[#2A2927] text-white text-sm font-medium rounded-lg hover:border-[#FF6B2B] transition-colors disabled:opacity-50"
                  >
                    {exportLoading ? "Preparing export…" : "Export My Data"}
                  </button>
                </Section>

                <Section title="Danger Zone">
                  <div className="p-4 border border-red-500/30 rounded-lg bg-red-900/10">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">Delete Account</div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Permanently delete your account and all associated data.
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete My Account
                    </button>
                  </div>
                </Section>
              </>
            )}
          </main>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-lg font-bold text-white">Delete Account</h2>
            </div>
            <p className="text-sm text-[#A09FA0] mb-6">
              This will permanently delete your account, habits, check-ins, Cookie Jar, and all
              progress. Type <strong className="text-white">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-[#1A1918] border border-[#2A2927] rounded-lg px-4 py-2.5 text-white text-sm mb-4 placeholder-[#4A4947] focus:outline-none focus:border-red-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2927] text-[#A09FA0] text-sm font-medium hover:border-[#3A3937] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleteLoading}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

