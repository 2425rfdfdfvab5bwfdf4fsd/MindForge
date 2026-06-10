"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

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
}

export function CookieJarEntry({ entry, onEdit, onDelete }: CookieJarEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = entry.dateOfVictory
    ? new Date(entry.dateOfVictory + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="group relative bg-[#111110] border border-forge-border hover:border-forge-border-strong transition-colors overflow-hidden"
      style={{ borderTop: "1px solid #2A2927" }}
    >
      {/* Orange corner accent */}
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderStyle: "solid",
          borderWidth: "0 28px 28px 0",
          borderColor: `transparent #FF6B2B transparent transparent`,
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xl font-bold text-text-primary leading-snug">
              {entry.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {formattedDate && (
                <span className="text-xs text-text-muted">
                  {formattedDate}
                </span>
              )}
              {entry.similarity !== undefined && (
                <span
                  className="text-xs px-1.5 py-0.5 font-mono"
                  style={{
                    background: "rgba(255,107,43,0.15)",
                    color: "#FF6B2B",
                    border: "1px solid rgba(255,107,43,0.3)",
                  }}
                >
                  {Math.round(entry.similarity * 100)}% match
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description — 3 lines clamped, expand on click */}
        <div className="mt-3">
          <p
            className={`text-base text-text-secondary ${expanded ? "" : "line-clamp-3"}`}
          >
            {entry.description}
          </p>
          {entry.description.length > 160 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-forge-orange hover:text-forge-orange-hover transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Edit / Delete — visible on hover */}
        <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary border border-forge-border hover:border-forge-border-strong transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Sure?</span>
              <button
                onClick={() => onDelete(entry.id)}
                className="px-3 py-1.5 text-xs font-bold text-white transition-colors"
                style={{ background: "#EF4444" }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary border border-forge-border transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-red-400 border border-forge-border hover:border-red-800 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
