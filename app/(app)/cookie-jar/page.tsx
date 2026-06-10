"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Search, X, Cookie } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { CookieJarEntry, type CookieJarEntryData } from "@/components/forge/CookieJarEntry";

// ─── Add/Edit Modal ──────────────────────────────────────────────────────────

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
    onSuccess: () => {
      utils.cookiejar.list.invalidate();
      onSaved();
    },
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.upgradeRequired) {
          setError("upgrade");
          return;
        }
      } catch {}
      setError(err.message);
    },
  });

  const edit = api.cookiejar.edit.useMutation({
    onSuccess: () => {
      utils.cookiejar.list.invalidate();
      onSaved();
    },
    onError: (err) => setError(err.message),
  });

  const isPending = add.isPending || edit.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (isEdit && entry) {
      edit.mutate({
        id: entry.id,
        title: title.trim(),
        description: description.trim(),
        dateOfVictory: dateOfVictory || null,
      });
    } else {
      add.mutate({
        title: title.trim(),
        description: description.trim(),
        dateOfVictory: dateOfVictory || undefined,
      });
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-forge-subtle border border-forge-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-forge-border px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {isEdit ? "Edit Victory" : "Lock In a Victory"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upgrade gate */}
        {error === "upgrade" ? (
          <div className="px-6 py-8 text-center">
            <Cookie size={40} className="mx-auto mb-3 text-forge-orange opacity-60" />
            <p className="font-heading text-lg font-bold text-text-primary mb-2">
              Cookie Jar is Full
            </p>
            <p className="text-sm text-text-muted mb-6">
              You have 5 victories stored. Upgrade to Pro to save unlimited victories.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-white"
              style={{ background: "#FF6B2B" }}
            >
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-text-secondary">
                  Victory Title <span className="text-forge-orange">*</span>
                </label>
                <span className={`text-xs font-mono ${title.length > 72 ? "text-forge-orange" : "text-text-muted"}`}>
                  {title.length}/80
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="e.g. Finished my first marathon"
                className="w-full bg-forge-input border border-forge-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange transition-colors"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-text-secondary">
                  What made it meaningful? <span className="text-forge-orange">*</span>
                </label>
                <span className={`text-xs font-mono ${description.length > 460 ? "text-forge-orange" : "text-text-muted"}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Describe what you overcame, why it matters, how it felt..."
                rows={4}
                className="w-full bg-forge-input border border-forge-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange transition-colors resize-none"
              />
            </div>

            {/* Date of Victory */}
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">
                Date of Victory{" "}
                <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={dateOfVictory}
                onChange={(e) => setDateOfVictory(e.target.value)}
                className="w-full bg-forge-input border border-forge-border px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-forge-orange transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Error */}
            {error && error !== "upgrade" && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-forge-border hover:border-forge-border-strong transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim() || !description.trim()}
                className="px-6 py-2 text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#FF6B2B" }}
              >
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Lock It In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Entry = CookieJarEntryData & { similarity?: number };

export default function CookieJarPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CookieJarEntryData | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const utils = api.useUtils();

  const { data: entries = [], isLoading } = api.cookiejar.list.useQuery(undefined, {
    retry: false,
  });

  const { data: searchResults, isFetching: isSearching } = api.cookiejar.search.useQuery(
    { query: activeQuery },
    { enabled: !!activeQuery, retry: false }
  );

  const deleteMutation = api.cookiejar.delete.useMutation({
    onSuccess: () => utils.cookiejar.list.invalidate(),
  });

  // Debounced search — fires 500ms after last keystroke
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setActiveQuery("");
      return;
    }
    debounceRef.current = setTimeout(() => {
      setActiveQuery(value.trim());
    }, 500);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchInput.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActiveQuery(searchInput.trim());
    }
  }

  function clearSearch() {
    setSearchInput("");
    setActiveQuery("");
  }

  function openAdd() {
    setEditEntry(null);
    setModalOpen(true);
  }

  function openEdit(entry: CookieJarEntryData) {
    setEditEntry(entry);
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    setEditEntry(null);
  }

  const isSearchMode = !!activeQuery;
  const displayEntries: Entry[] = isSearchMode
    ? (searchResults ?? [])
    : entries;

  return (
    <>
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-text-primary">
            Cookie Jar
          </h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#FF6B2B" }}
          >
            <Plus size={16} />
            Add Victory
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-8">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search your victories..."
            className="w-full bg-forge-input border border-forge-border pl-10 pr-10 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange transition-colors"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-muted transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search mode label */}
        {isSearchMode && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {isSearching
                ? "Searching…"
                : `${displayEntries.length} result${displayEntries.length !== 1 ? "s" : ""} for "${activeQuery}"`}
            </span>
            <button
              onClick={clearSearch}
              className="text-xs text-forge-orange hover:text-forge-orange-hover transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Entries grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse bg-forge-subtle border border-forge-border"
              />
            ))}
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="py-20 text-center">
            <Cookie
              size={48}
              className="mx-auto mb-4 text-forge-orange opacity-30"
            />
            {isSearchMode ? (
              <>
                <p className="font-heading text-lg font-bold text-text-primary mb-1">
                  No matches found
                </p>
                <p className="text-sm text-text-muted">
                  Try different keywords or{" "}
                  <button
                    onClick={clearSearch}
                    className="text-forge-orange hover:underline"
                  >
                    browse all victories
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-lg font-bold text-text-primary mb-1">
                  Your jar is empty
                </p>
                <p className="text-sm text-text-muted mb-6">
                  On hard days, come here and remember what you&apos;re made of.
                </p>
                <button
                  onClick={openAdd}
                  className="px-6 py-2 text-sm font-bold text-white"
                  style={{ background: "#FF6B2B" }}
                >
                  Add Your First Victory
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayEntries.map((entry) => (
              <CookieJarEntry
                key={entry.id}
                entry={entry}
                onEdit={openEdit}
                onDelete={(id) => deleteMutation.mutate({ id })}
              />
            ))}
          </div>
        )}

        {/* Free tier counter */}
        {!isSearchMode && entries.length > 0 && (
          <div className="mt-6 text-center">
            {entries.length >= 5 ? (
              <p className="text-xs text-text-muted">
                You have 5 victories stored.{" "}
                <span className="text-forge-orange cursor-pointer hover:underline">
                  Upgrade to Pro
                </span>{" "}
                to save unlimited victories.
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                {entries.length}/5 victories — free tier
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <VictoryModal
          entry={editEntry}
          onClose={() => {
            setModalOpen(false);
            setEditEntry(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
