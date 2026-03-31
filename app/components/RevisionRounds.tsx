"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Link2, CheckCircle, Clock, MessageSquare,
  ChevronDown, ChevronUp, ExternalLink, Check, X
} from "lucide-react";
import { RevisionRound, RevisionNote, RevisionStatus } from "@/lib/types";
import { nanoid } from "@/lib/nanoid";

const STATUS_CONFIG: Record<RevisionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  awaiting_feedback: {
    label: "Awaiting Feedback",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: <Clock size={11} />,
  },
  feedback_received: {
    label: "Feedback Received",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <MessageSquare size={11} />,
  },
  resolved: {
    label: "All Resolved",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: <CheckCircle size={11} />,
  },
};

interface Props {
  rounds: RevisionRound[];
  onChange: (rounds: RevisionRound[]) => void;
}

export function RevisionRounds({ rounds, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [rounds[rounds.length - 1]?.id ?? ""]: true });
  const [showAddRound, setShowAddRound] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  function addRound() {
    if (!newUrl.trim()) return;
    const round: RevisionRound = {
      id: nanoid(),
      roundNumber: rounds.length + 1,
      label: newLabel.trim() || `Round ${rounds.length + 1}`,
      dropboxUrl: newUrl.trim(),
      createdAt: new Date().toISOString(),
      notes: [],
      status: "awaiting_feedback",
    };
    const updated = [...rounds, round];
    onChange(updated);
    setExpanded((e) => ({ ...e, [round.id]: true }));
    setNewUrl("");
    setNewLabel("");
    setShowAddRound(false);
  }

  function resolveNote(roundId: string, noteId: string) {
    onChange(rounds.map((r) => {
      if (r.id !== roundId) return r;
      const notes = r.notes.map((n) => n.id === noteId ? { ...n, resolved: !n.resolved } : n);
      const allResolved = notes.every((n) => n.resolved);
      return { ...r, notes, status: (allResolved && notes.length > 0 ? "resolved" : r.status === "resolved" ? "feedback_received" : r.status) as RevisionStatus };
    }));
  }

  function resolveAll(roundId: string) {
    onChange(rounds.map((r) => {
      if (r.id !== roundId) return r;
      return { ...r, notes: r.notes.map((n) => ({ ...n, resolved: true })), status: "resolved" as RevisionStatus };
    }));
  }

  function toggleExpand(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  const totalNotes = rounds.reduce((sum, r) => sum + r.notes.length, 0);
  const resolvedNotes = rounds.reduce((sum, r) => sum + r.notes.filter((n) => n.resolved).length, 0);
  const pendingFeedback = rounds.filter((r) => r.status === "feedback_received" && r.notes.some((n) => !n.resolved)).length;

  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-semibold text-base flex items-center gap-2">
            Revision Rounds
            {pendingFeedback > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {pendingFeedback}
              </span>
            )}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {rounds.length} round{rounds.length !== 1 ? "s" : ""} · {resolvedNotes}/{totalNotes} notes resolved
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddRound(!showAddRound)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={13} />
          New Round
        </motion.button>
      </div>

      {/* Add round form */}
      <AnimatePresence>
        {showAddRound && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border p-4 mt-4" style={{ background: "var(--background)", borderColor: "var(--accent)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>
                Share a new video for client review
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>Round Label</label>
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={`Round ${rounds.length + 1} — e.g. "Color Pass"`}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>Dropbox / Video Link</label>
                  <input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://www.dropbox.com/s/..."
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddRound(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium border"
                    style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addRound}
                    disabled={!newUrl.trim()}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Share with Client
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rounds list */}
      {rounds.length === 0 ? (
        <div className="text-center py-8 mt-4" style={{ color: "var(--muted)" }}>
          <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">No revision rounds yet.</p>
          <p className="text-xs mt-1">Share a Dropbox link to start collecting client feedback.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {[...rounds].reverse().map((round) => {
            const isOpen = expanded[round.id];
            const unresolvedCount = round.notes.filter((n) => !n.resolved).length;
            const statusCfg = STATUS_CONFIG[round.status];

            return (
              <div
                key={round.id}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: round.status === "feedback_received" && unresolvedCount > 0 ? "rgba(124,92,252,0.4)" : "var(--card-border)" }}
              >
                {/* Round header */}
                <button
                  onClick={() => toggleExpand(round.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                  >
                    R{round.roundNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{round.label}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {unresolvedCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(124,92,252,0.15)", color: "var(--accent)" }}>
                          {unresolvedCount} open
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {round.notes.length} note{round.notes.length !== 1 ? "s" : ""} ·{" "}
                      {new Date(round.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={14} style={{ color: "var(--muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted)" }} />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                        {/* Video link */}
                        <div className="flex items-center gap-2 mt-3 p-3 rounded-xl border" style={{ background: "var(--background)", borderColor: "var(--card-border)" }}>
                          <Link2 size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                          <span className="text-xs font-mono flex-1 truncate" style={{ color: "var(--muted)" }}>
                            {round.dropboxUrl}
                          </span>
                          <a href={round.dropboxUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0">
                            <ExternalLink size={13} style={{ color: "var(--accent)" }} />
                          </a>
                        </div>

                        {/* Notes */}
                        {round.notes.length === 0 ? (
                          <div className="text-center py-5 mt-3" style={{ color: "var(--muted)" }}>
                            <p className="text-xs">Waiting for client to leave feedback.</p>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                                Client Notes
                              </span>
                              {unresolvedCount > 0 && (
                                <button
                                  onClick={() => resolveAll(round.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                                  style={{ color: "var(--success)", background: "rgba(34,211,160,0.1)" }}
                                >
                                  Resolve all
                                </button>
                              )}
                            </div>
                            {round.notes.map((note) => (
                              <motion.div
                                key={note.id}
                                layout
                                className="flex items-start gap-3 p-3 rounded-xl border"
                                style={{
                                  background: note.resolved ? "rgba(34,211,160,0.04)" : "var(--background)",
                                  borderColor: note.resolved ? "rgba(34,211,160,0.15)" : "var(--card-border)",
                                }}
                              >
                                {/* Timecode chip */}
                                <span
                                  className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold mt-0.5"
                                  style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                                >
                                  {note.timecode}
                                </span>
                                <p
                                  className="flex-1 text-sm leading-relaxed"
                                  style={note.resolved ? { color: "var(--muted)", textDecoration: "line-through" } : {}}
                                >
                                  {note.note}
                                </p>
                                <button
                                  onClick={() => resolveNote(round.id, note.id)}
                                  className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all mt-0.5"
                                  title={note.resolved ? "Mark unresolved" : "Mark resolved"}
                                  style={
                                    note.resolved
                                      ? { background: "rgba(34,211,160,0.15)", borderColor: "var(--success)", color: "var(--success)" }
                                      : { borderColor: "var(--card-border)", color: "var(--muted)" }
                                  }
                                >
                                  <Check size={11} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
