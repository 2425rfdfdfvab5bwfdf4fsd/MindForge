"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Calendar } from "lucide-react";

export interface CookieJarEntryData {
  id: string;
  title: string;
  description: string;
  dateOfVictory?: string | null;
  similarity?: number;
}

interface CookieJarEntryProps {
  entry: CookieJarEntryData;
  onEdit: (entry: CookieJarEntryData) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function CookieJarEntry({ entry, onEdit, onDelete, isDeleting = false }: CookieJarEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isDeleting) setConfirmDelete(false);
  }, [isDeleting]);

  const formattedDate = entry.dateOfVictory
    ? new Date(entry.dateOfVictory + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isLong = entry.description.length > 160;

  return (
    <div className={`group relative bg-forge-elevated border border-forge-border hover:border-forge-border-strong transition-all duration-200 flex flex-col overflow-hidden ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Left orange accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-forge-orange opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="pl-6 pr-5 pt-5 pb-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-bold text-text-primary leading-snug">
              {entry.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {formattedDate && (
                <span className="inline-flex items-center gap-1 text-xs text-text-disabled">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}
              {entry.similarity !== undefined && (
                <span className="text-xs px-1.5 py-0.5 font-mono border"
                  style={{ background: "rgba(255,107,43,0.12)", color: "#FF6B2B", borderColor: "rgba(255,107,43,0.25)" }}>
                  {Math.round(entry.similarity * 100)}% match
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-text-disabled hover:text-text-primary hover:bg-forge-overlay transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(entry.id)}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-text-disabled hover:text-red-400 hover:bg-red-950/30 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex-1">
          <p className={`text-sm leading-relaxed text-text-secondary ${expanded ? "" : "line-clamp-3"}`}>
            {entry.description}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-xs text-forge-orange hover:text-forge-orange-hover transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
