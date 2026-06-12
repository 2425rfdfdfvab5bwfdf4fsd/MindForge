"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Search, X, Cookie, Trophy, Zap, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";
import { CookieJarEntry, type CookieJarEntryData } from "@/components/forge/CookieJarEntry";

// ─── Motivational quotes for sidebar ─────────────────────────────────────────

const GOGGINS_QUOTES = [
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", attr: "David Goggins" },
  { text: "The Cookie Jar is where you store evidence of who you really are — so you can reach in on the hard days.", attr: "David Goggins" },
  { text: "Don't stop when you're tired. Stop when you're done.", attr: "David Goggins" },
  { text: "We all have a cookie jar inside us. You just have to reach in there on the bad days and remind yourself what you're made of.", attr: "David Goggins" },
];

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  entry?: CookieJarEntryData | null;
  onClose: () => void;
  onSaved: () => void;
}

function VictoryModal({ entry, onClose, onSaved }: ModalProps) {
  const isEdit = !!entry;
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [dateOfVictory, setDateOfVictory] = useState(entry?.dateOfVictory ?? "");
  const [error, setError] = useState("");

  const utils = api.useUtils();

  const add = api.cookiejar.add.useMutation({
    onSuccess: () => { utils.cookiejar.list.invalidate(); onSaved(); },
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.upgradeRequired) { setError("upgrade"); return; }
      } catch {}
      setError(err.message);
    },
  });

  const edit = api.cookiejar.edit.useMutation({
    onSuccess: () => { utils.cookiejar.list.invalidate(); onSaved(); },
    onError: (err) => setError(err.message),
  });

  const isPending = add.isPending || edit.isPending;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (isEdit && entry) {
      edit.mutate({ id: entry.id, title: title.trim(), description: description.trim(), dateOfVictory: dateOfVictory || null });
    } else {
      add.mutate({ title: title.trim(), description: description.trim(), dateOfVictory: dateOfVictory || undefined });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg bg-forge-subtle border border-forge-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-forge-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-4 w-4 text-forge-orange" />
            <h2 className="font-heading text-lg font-bold text-text-primary">
              {isEdit ? "Edit Victory" : "Lock In a Victory"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upgrade gate */}
        {error === "upgrade" ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-forge-orange/30 bg-forge-orange/10">
              <Cookie className="h-7 w-7 text-forge-orange" />
            </div>
            <p className="font-heading text-lg font-bold text-text-primary mb-2">
              Cookie Jar is Full
            </p>
            <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
              You have 5 victories stored. Upgrade to Pro to save unlimited victories and never lose a win.
            </p>
            <Link
              href="/upgrade"
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-forge-orange px-6 py-2.5 text-sm font-bold text-forge-base hover:bg-forge-orange-hover transition-colors"
            >
              Upgrade to Pro <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Victory Title <span className="text-forge-orange">*</span>
                </label>
                <span className={`text-xs font-mono ${title.length > 72 ? "text-forge-orange" : "text-text-disabled"}`}>
                  {title.length}/80
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="e.g. Finished my first marathon"
                className="w-full bg-forge-input border border-forge-border px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/20 transition-colors"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  What made it meaningful? <span className="text-forge-orange">*</span>
                </label>
                <span className={`text-xs font-mono ${description.length > 460 ? "text-forge-orange" : "text-text-disabled"}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Describe what you overcame, why it matters, how it felt..."
                rows={4}
                className="w-full bg-forge-input border border-forge-border px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/20 transition-colors resize-none"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Date of Victory <span className="text-text-disabled font-normal normal-case">(optional)</span>
              </label>
              <input
                type="date"
                value={dateOfVictory}
                onChange={(e) => setDateOfVictory(e.target.value)}
                className="w-full bg-forge-input border border-forge-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/20 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {error && error !== "upgrade" && (
              <p className="text-xs text-red-400 border border-red-800/30 bg-red-950/20 px-3 py-2">{error}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-1 border-t border-forge-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 min-h-[44px] text-sm text-text-muted hover:text-text-primary border border-forge-border hover:border-forge-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim() || !description.trim()}
                className="px-6 py-2.5 min-h-[44px] text-sm font-bold text-forge-base bg-forge-orange hover:bg-forge-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Lock It In →"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Entry = CookieJarEntryData & { similarity?: number };

export default function CookieJarPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CookieJarEntryData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * GOGGINS_QUOTES.length));

  const utils = api.useUtils();

  const { data: entries = [], isLoading } = api.cookiejar.list.useQuery(undefined, { retry: false });
  const { data: searchResults, isFetching: isSearching } = api.cookiejar.search.useQuery(
    { query: activeQuery },
    { enabled: !!activeQuery, retry: false }
  );
  const deleteMutation = api.cookiejar.delete.useMutation({
    onSuccess: () => {
      utils.cookiejar.list.invalidate();
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete. Please try again.");
      setDeletingId(null);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setActiveQuery(""); return; }
    debounceRef.current = setTimeout(() => setActiveQuery(value.trim()), 500);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchInput.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActiveQuery(searchInput.trim());
    }
  }

  function clearSearch() { setSearchInput(""); setActiveQuery(""); }
  function openAdd() { setEditEntry(null); setModalOpen(true); }
  function openEdit(entry: CookieJarEntryData) { setEditEntry(entry); setModalOpen(true); }
  function handleSaved() { setModalOpen(false); setEditEntry(null); }

  const isSearchMode = !!activeQuery;
  const displayEntries: Entry[] = isSearchMode ? (searchResults ?? []) : entries;
  const FREE_LIMIT = 5;
  // Free users are hard-capped at FREE_LIMIT by the server. If entries exceed
  // that limit the user must be on Pro — hide the free-tier bar entirely.
  const isDefinitelyPro = entries.length > FREE_LIMIT;
  const showFreeBar = !isSearchMode && entries.length > 0 && !isDefinitelyPro;
  const isFreeAtLimit = entries.length >= FREE_LIMIT;
  const quote = GOGGINS_QUOTES[quoteIdx];

  return (
    <>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-6xl">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="h-4 w-4 text-forge-orange" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-forge-orange">
                Cookie Jar
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
                  Your Victories
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Evidence of who you are. Reach in on hard days.
                </p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-3 min-h-[48px] text-sm font-bold text-forge-base bg-forge-orange hover:bg-forge-orange-hover transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add Victory
              </button>
            </div>
          </div>

          {/* ── Two-column grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Entries ────────────────────────────────────────── */}
            <div className="min-w-0 space-y-5">

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search your victories by feeling, event, or theme…"
                  className="w-full bg-forge-input border border-forge-border pl-10 pr-10 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/20 transition-colors"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search label */}
              {isSearchMode && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    {isSearching
                      ? "Searching semantically…"
                      : `${displayEntries.length} result${displayEntries.length !== 1 ? "s" : ""} for "${activeQuery}"`}
                  </span>
                  <button onClick={clearSearch} className="text-xs text-forge-orange hover:text-forge-orange-hover transition-colors">
                    Clear
                  </button>
                </div>
              )}

              {/* Entries */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[100px] animate-pulse bg-forge-elevated border border-forge-border" />
                  ))}
                </div>
              ) : displayEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-forge-border bg-forge-elevated py-20 text-center"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-forge-orange/20 bg-forge-orange/5">
                    <Cookie className="h-8 w-8 text-forge-orange opacity-50" />
                  </div>
                  {isSearchMode ? (
                    <>
                      <p className="font-heading text-lg font-bold text-text-primary mb-1">No matches found</p>
                      <p className="text-sm text-text-muted mb-4">
                        Try different keywords or{" "}
                        <button onClick={clearSearch} className="text-forge-orange hover:underline">
                          browse all victories
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-heading text-lg font-bold text-text-primary mb-2">Your jar is empty</p>
                      <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
                        On hard days, come here and remember what you&apos;re made of. Start by adding your first victory.
                      </p>
                      <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 bg-forge-orange px-6 py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Victory
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {displayEntries.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15, delay: i * 0.04 }}
                      >
                        <CookieJarEntry
                          entry={entry}
                          onEdit={openEdit}
                          onDelete={(id) => { setDeletingId(id); deleteMutation.mutate({ id }); }}
                          isDeleting={deletingId === entry.id}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}

              {/* Free tier usage bar — only shown for free-tier users (≤ FREE_LIMIT entries) */}
              {showFreeBar && (
                <div className="border border-forge-border bg-forge-elevated px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">
                      {isFreeAtLimit
                        ? "Free tier limit reached"
                        : `${entries.length} of ${FREE_LIMIT} free victories`}
                    </span>
                    {isFreeAtLimit && (
                      <Link href="/upgrade" className="text-xs font-bold text-forge-orange hover:text-forge-orange-hover transition-colors">
                        Upgrade to Pro →
                      </Link>
                    )}
                  </div>
                  <div className="h-1 w-full bg-forge-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((entries.length / FREE_LIMIT) * 100, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full ${isFreeAtLimit ? "bg-forge-orange" : "bg-forge-border-strong"}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sidebar ───────────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Stats */}
              <div className="border border-forge-border bg-forge-elevated">
                <div className="border-b border-forge-border px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Your Jar</span>
                </div>
                <div className="divide-y divide-forge-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 text-text-muted">
                      <Trophy className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs">Total Victories</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">
                      {isLoading ? "—" : entries.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 text-text-muted">
                      <Flame className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs">Latest</span>
                    </div>
                    <span className="text-xs text-text-secondary max-w-[140px] truncate text-right">
                      {entries[0]?.title ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 text-text-muted">
                      <Zap className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs">Search Mode</span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      Semantic AI
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote card */}
              <div className="border border-forge-border/50 bg-forge-subtle px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-disabled mb-3">
                  The Philosophy
                </p>
                <blockquote className="text-xs leading-relaxed text-text-muted italic mb-2">
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                <p className="text-xs text-text-disabled">— {quote.attr}</p>
              </div>

              {/* How it works */}
              <div className="border border-forge-border bg-forge-elevated px-4 py-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">How to Use It</p>
                <div className="space-y-2.5">
                  {[
                    { n: "1", text: "Add every win — small or massive." },
                    { n: "2", text: "On hard days, open the jar and read." },
                    { n: "3", text: "Search by feeling to find the right proof." },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center border border-forge-border text-[10px] font-bold text-forge-orange mt-0.5">
                        {n}
                      </span>
                      <p className="text-xs text-text-disabled leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="border border-forge-border bg-forge-elevated divide-y divide-forge-border">
                {[
                  { href: "/checkin", label: "Daily Mirror" },
                  { href: "/coach", label: "AI Coach" },
                  { href: "/challenges", label: "Challenges" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-4 py-3 text-xs text-text-muted hover:text-text-primary hover:bg-forge-overlay transition-colors group"
                  >
                    <span>{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <VictoryModal
            entry={editEntry}
            onClose={() => { setModalOpen(false); setEditEntry(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
}
