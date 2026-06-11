"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, ChevronDown, BarChart2, Activity, Zap, Target } from "lucide-react";
import { api } from "@/lib/trpc/client";

type Range = 7 | 30 | 90;

const TOOLTIP_STYLE = {
  background: "#232220",
  border: "1px solid #3D3B39",
  borderRadius: 0,
  color: "#C2C0BE",
  fontSize: 12,
};

const GRID_STROKE = "#2A2927";
const TICK_STYLE = { fill: "#87857F", fontSize: 11 };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-5 2xl:p-6">
      <div className="text-xs 2xl:text-sm text-[#6B7280] uppercase tracking-wider mb-1">{label}</div>
      <div
        className={`text-3xl 2xl:text-4xl font-bold ${accent ? "text-[#FF6B2B]" : "text-white"}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-[#6B7280] mt-1">{sub}</div>}
    </div>
  );
}

function ChartShell({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-5 2xl:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-[#6B7280]" />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-[#4A4947] text-sm">
      {message}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>(30);

  const { data: forgeHistory = [] } = api.analytics.forgeScoreHistory.useQuery({ days: range });
  const { data: habitRates = [] } = api.analytics.habitCompletionByHabit.useQuery({ days: range });
  const { data: honestyTrend = [] } = api.analytics.checkinHonestyTrend.useQuery({ days: range });
  const { data: xpHistory = [] } = api.analytics.xpHistory.useQuery({ days: range });
  const { data: stats } = api.analytics.getPeriodStats.useQuery({ days: range });
  const { data: weeklyReport } = api.analytics.getLatestWeeklyReport.useQuery();
  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });

  const isPro = profile?.tier === "pro" || profile?.tier === "elite";

  return (
    <div className="min-h-screen bg-[#0A0908] px-4 py-8 2xl:py-12">
      <div className="max-w-5xl 2xl:max-w-7xl mx-auto space-y-8 2xl:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-white tracking-tight">
              Your Neural Progress
            </h1>
            <p className="text-[#6B7280] text-sm 2xl:text-base mt-1">
              Forge Score history, habit patterns, and honesty trends
            </p>
          </div>

          <div className="relative sm:flex-shrink-0">
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value) as Range)}
              className="appearance-none bg-[#111110] border border-[#2A2927] rounded-lg px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-[#FF6B2B] transition-colors"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
          </div>
        </div>

        {isPro && weeklyReport && (
          <WeeklyReportCard report={weeklyReport} />
        )}
        {isPro && !weeklyReport && (
          <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-5 2xl:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B2B]/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#FF6B2B]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Weekly Neural Report</div>
                <div className="text-xs text-[#6B7280] mt-0.5">
                  Your first weekly report arrives next Sunday
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 2xl:gap-6">
          <StatCard
            label="Check-ins"
            value={stats?.checkinCount ?? 0}
            sub={`last ${range} days`}
          />
          <StatCard
            label="Avg Honesty"
            value={stats?.avgHonestyScore ?? 0}
            sub="out of 10"
          />
          <StatCard
            label="Habits Completed"
            value={stats?.habitsCompleted ?? 0}
            sub={`last ${range} days`}
          />
          <StatCard
            label="Forge Score"
            value={stats?.forgeScore ?? 0}
            accent
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 2xl:gap-8">
          <div className="md:col-span-2">
            <ChartShell title="Forge Score History" icon={TrendingUp}>
              {forgeHistory.length === 0 ? (
                <EmptyChart message="No forge score data yet — keep checking in" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={forgeHistory}>
                    <defs>
                      <linearGradient id="forgeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={TICK_STYLE}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 1000]}
                      tick={TICK_STYLE}
                      axisLine={false}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`${v} pts`, "Forge Score"]}
                      labelFormatter={(l: string) => formatDate(l)}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#FF6B2B"
                      strokeWidth={2}
                      fill="url(#forgeGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>

          <ChartShell title="Habit Completion by Habit" icon={Target}>
            {habitRates.length === 0 ? (
              <EmptyChart message="No habits tracked yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={habitRates} barSize={28}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`${v}%`, "Completion"]}
                  />
                  <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                    {habitRates.map((_, i) => (
                      <Cell key={i} fill="#22C55E" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartShell>

          <ChartShell title="Check-in Honesty Trend" icon={Activity}>
            {honestyTrend.length === 0 ? (
              <EmptyChart message="No check-in data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={honestyTrend}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 10]}
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`${v}/10`, "Honesty"]}
                    labelFormatter={(l: string) => formatDate(l)}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartShell>

          <div className="md:col-span-2">
            <ChartShell title="Total XP Over Time" icon={Zap}>
              {xpHistory.length === 0 ? (
                <EmptyChart message="No XP earned yet — complete habits and check-ins" />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={xpHistory}>
                    <defs>
                      <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={TICK_STYLE}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={TICK_STYLE}
                      axisLine={false}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`${v} XP`, "XP Earned"]}
                      labelFormatter={(l: string) => formatDate(l)}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="#FF6B2B"
                      strokeWidth={2}
                      fill="url(#xpGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyReportCard({ report }: { report: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  const weekStart = report.weekStartDate as string;
  const weekEnd = weekStart
    ? new Date(new Date(weekStart + "T00:00:00").getTime() + 6 * 86400000)
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const weekStartFormatted = weekStart
    ? new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  const scoreDelta = report.forgeScoreChange as number;

  return (
    <div className="bg-[#111110] border border-[#FF6B2B]/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1A1918] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B2B]/15 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-[#FF6B2B]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Weekly Neural Report
            </div>
            <div className="text-xs text-[#6B7280]">
              {weekStartFormatted} — {weekEnd}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {scoreDelta !== 0 && (
            <span
              className={`text-sm font-bold ${
                scoreDelta > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {scoreDelta > 0 ? "+" : ""}
              {scoreDelta} pts
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#6B7280] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#2A2927]">
          {Boolean(report.behavioralArc) && (
            <div className="pt-4">
              <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
                Behavioral Arc
              </div>
              <p className="text-sm text-[#A09FA0] leading-relaxed">
                {String(report.behavioralArc)}
              </p>
            </div>
          )}
          {Boolean(report.keyInsight) && (
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
                Key Insight
              </div>
              <p className="text-sm font-semibold text-[#FF6B2B] leading-relaxed">
                {String(report.keyInsight)}
              </p>
            </div>
          )}
          {Boolean(report.nextWeekChallenge) && (
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
                Next Week Challenge
              </div>
              <p className="text-sm text-white leading-relaxed">
                {String(report.nextWeekChallenge)}
              </p>
            </div>
          )}
          {Boolean(report.bestStreakThisWeek) && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A1918] border border-[#2A2927] rounded-lg">
              <span className="text-xs text-[#6B7280]">Best streak:</span>
              <span className="text-xs font-semibold text-white">
                {String(report.bestStreakThisWeek)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
