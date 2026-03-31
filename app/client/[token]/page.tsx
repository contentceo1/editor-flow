"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Video, Clock, ExternalLink, Send, CheckCircle,
  ChevronRight, Film, ThumbsUp, CalendarDays, AlertCircle,
  Hourglass, Star
} from "lucide-react";
import {
  Project, STAGES, STAGE_ORDER, DAILY_TASK_CATEGORIES,
  DailyTask, RevisionRound, RevisionNote, TeamMember,
  Production, PRODUCTION_STAGES, PRODUCTION_STAGE_ORDER,
} from "@/lib/types";
import { getProjectByToken, updateProject, getTeam } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { nanoid } from "@/lib/nanoid";

function stageIndex(s: string) { return STAGE_ORDER.indexOf(s as any); }

// ── Confetti ────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#7c5cfc","#22d3a0","#f59e0b","#3b82f6","#ec4899"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 rounded-sm"
          style={{ background: colors[i % colors.length], left: `${Math.random()*100}%`, top:"-20px" }}
          animate={{ y:["0vh","110vh"], x:[0,(Math.random()-.5)*200], rotate:[0,Math.random()*720], opacity:[1,0] }}
          transition={{ duration:2+Math.random()*2, delay:Math.random()*1.5, ease:"easeIn" }} />
      ))}
    </div>
  );
}

// ── Action Banner ────────────────────────────────────────────────────────────
function ActionBanner({ project }: { project: Project }) {
  const rounds = project.revisionRounds || [];
  const latest = rounds[rounds.length - 1];
  const stage = project.stage;

  let icon: React.ReactNode;
  let bg: string;
  let border: string;
  let title: string;
  let body: string;
  let cta: React.ReactNode = null;

  if (stage === "invoice_sent") {
    icon = <AlertCircle size={18} color="#d97706" />;
    bg = "#fffbeb"; border = "#fde68a";
    title = "Action needed — Invoice awaiting payment";
    body = "Your invoice has been sent. Once payment is received, we'll get the production process started.";
  } else if (stage === "invoice_paid") {
    icon = <CheckCircle size={18} color="#16a37a" />;
    bg = "#f0fdf4"; border = "#bbf7d0";
    title = "Payment received — Production coming soon";
    body = "We've confirmed your payment. We'll be in touch shortly to schedule your production day.";
  } else if (stage === "production") {
    icon = <Film size={18} color="#7c5cfc" />;
    bg = "#f5f3ff"; border = "#d4c5fd";
    title = "Production day is underway";
    body = "Your footage is being captured. Sit tight — your editor will begin post-production shortly after.";
  } else if (stage === "post_production" && !latest) {
    icon = <Hourglass size={18} color="#7c5cfc" />;
    bg = "#f5f3ff"; border = "#d4c5fd";
    title = "Your editor is working on it";
    body = "Post-production is in progress. You'll receive a link to review your video as soon as the first cut is ready.";
  } else if (stage === "post_production" && latest && !latest.approvedAt) {
    icon = <Film size={18} color="#7c5cfc" />;
    bg = "#f5f3ff"; border = "#7c5cfc";
    title = `Round ${latest.roundNumber} is ready — your review is needed`;
    body = "Watch the video, leave any notes below, and approve when you're happy with it.";
    cta = (
      <a href={latest.dropboxUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm font-bold"
        style={{ background: "#7c5cfc", color: "#fff" }}>
        <Film size={14} /> Watch Now
      </a>
    );
  } else if (stage === "post_production" && latest?.approvedAt) {
    icon = <CheckCircle size={18} color="#16a37a" />;
    bg = "#f0fdf4"; border = "#bbf7d0";
    title = "Round approved — your editor is making the final touches";
    body = "We've received your approval. Final delivery is coming up soon.";
  } else if (stage === "delivered") {
    icon = <Star size={18} color="#f59e0b" />;
    bg = "#fffbeb"; border = "#fde68a";
    title = "Your project has been delivered!";
    body = "We hope you love the final result. Thank you for trusting us with your vision.";
  } else {
    return null;
  }

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
      className="rounded-2xl border p-4 mb-5 flex gap-3"
      style={{ background: bg, borderColor: border }}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-bold mb-0.5" style={{ color: "#111118" }}>{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{body}</p>
        {cta}
      </div>
    </motion.div>
  );
}

// ── Note form ────────────────────────────────────────────────────────────────
function ClientNoteForm({ round, project, onUpdate }: {
  round: RevisionRound; project: Project; onUpdate: (p: Project) => void;
}) {
  const [timecode, setTimecode] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!note.trim()) return;
    const newNote: RevisionNote = {
      id: nanoid(), timecode: timecode.trim() || "—", note: note.trim(),
      createdAt: new Date().toISOString(), resolved: false,
    };
    const updatedRounds = (project.revisionRounds || []).map((r) =>
      r.id !== round.id ? r : { ...r, notes:[...r.notes, newNote], status:"feedback_received" as const }
    );
    await updateProject(project.id, { revisionRounds: updatedRounds });
    onUpdate({ ...project, revisionRounds: updatedRounds });
    setTimecode(""); setNote("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="px-5 py-4 border-t" style={{ borderColor: "#f0f0f5" }}>
      <p className="text-xs font-semibold mb-3" style={{ color: "#6b7280" }}>ADD A NOTE</p>
      <div className="flex gap-2 mb-3">
        <div className="flex-shrink-0">
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Timecode</label>
          <input value={timecode} onChange={(e) => setTimecode(e.target.value)}
            placeholder="0:00"
            className="w-20 px-3 py-2.5 rounded-xl border text-sm font-mono outline-none text-center"
            style={{ background:"#fff", borderColor:"#e2e2ea", color:"#111118" }}
            onFocus={(e)=>(e.target.style.borderColor="#7c5cfc")}
            onBlur={(e)=>(e.target.style.borderColor="#e2e2ea")} />
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Your note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key==="Enter" && submit()}
            placeholder="e.g. Can we cut this scene a bit shorter?"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background:"#fff", borderColor:"#e2e2ea", color:"#111118" }}
            onFocus={(e)=>(e.target.style.borderColor="#7c5cfc")}
            onBlur={(e)=>(e.target.style.borderColor="#e2e2ea")} />
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color:"#9ca3af" }}>
        Timecode is optional but helps your editor find the exact moment.
      </p>
      <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
        onClick={submit} disabled={!note.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        style={submitted ? { background:"#d1fae5", color:"#065f46" } : { background:"#7c5cfc", color:"#fff" }}>
        {submitted ? <><CheckCircle size={15}/> Sent!</> : <><Send size={14}/> Submit Note</>}
      </motion.button>
    </div>
  );
}

// ── Approve button ───────────────────────────────────────────────────────────
function ApproveButton({ round, project, onUpdate }: {
  round: RevisionRound; project: Project; onUpdate: (p: Project) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(!!round.approvedAt);

  if (done || round.approvedAt) {
    return (
      <div className="mx-5 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border"
        style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
        <CheckCircle size={16} color="#16a37a" />
        <span className="text-sm font-semibold" style={{ color:"#16a37a" }}>
          You approved this on {new Date(round.approvedAt!).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
        </span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="mx-5 mb-4 rounded-xl border p-4" style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
        <p className="text-sm font-semibold mb-1" style={{ color:"#111118" }}>Approve this version?</p>
        <p className="text-xs mb-3" style={{ color:"#6b7280" }}>
          This tells your editor you're happy with this round and they can proceed.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)}
            className="flex-1 py-2 rounded-xl border text-xs font-semibold"
            style={{ borderColor:"#e2e2ea", color:"#6b7280" }}>
            Cancel
          </button>
          <button onClick={async () => {
            const updatedRounds = (project.revisionRounds || []).map((r) =>
              r.id !== round.id ? r : { ...r, approvedAt: new Date().toISOString(), status:"resolved" as const }
            );
            await updateProject(project.id, { revisionRounds: updatedRounds });
            onUpdate({ ...project, revisionRounds: updatedRounds });
            setDone(true); setConfirming(false);
          }}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{ background:"#16a37a", color:"#fff" }}>
            ✓ Yes, Approve
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-4">
      <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
        onClick={() => setConfirming(true)}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border"
        style={{ background:"#f0fdf4", borderColor:"#bbf7d0", color:"#16a37a" }}>
        <ThumbsUp size={15}/> I'm happy with this — Approve Round {round.roundNumber}
      </motion.button>
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="border-b sticky top-0 z-20" style={{ background:"#fff", borderColor:"#e2e2ea" }}>
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background:"#f0ebff" }}>
            <Video size={14} style={{ color:"#7c5cfc" }} />
          </div>
          <span className="text-sm font-bold" style={{ color:"#111118" }}>EditorFlow</span>
        </div>
        <span className="text-xs" style={{ color:"#6b7280" }}>
          Updated {new Date(updatedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
        </span>
      </div>
    </div>
  );
}

// ── Progress strip (used in post-production revision view) ───────────────────
function ProgressStrip({ stage }: { stage: string }) {
  const currentIdx = stageIndex(stage);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGES.map((s, idx) => {
        const isPast = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={isActive
                ? { background:"#7c5cfc", borderColor:"#7c5cfc", color:"#fff" }
                : isPast
                ? { background:"#f0fdf4", borderColor:"#bbf7d0", color:"#16a37a" }
                : { background:"#f9fafb", borderColor:"#f0f0f5", color:"#9ca3af" }}>
              {isPast ? <Check size={10}/> : <span style={{ fontSize:"10px" }}>{s.icon}</span>}
              <span className={isActive || isPast ? "" : "hidden sm:inline"}>{s.label}</span>
            </div>
            {idx < STAGES.length-1 && <ChevronRight size={10} style={{ color:"#d1d5db", flexShrink:0 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Editor card ──────────────────────────────────────────────────────────────
function EditorCard({ editor }: { editor: TeamMember | null }) {
  if (!editor) return null;
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
      className="rounded-2xl border p-4 mb-4 flex items-center gap-3"
      style={{ background:"#fff", borderColor:"#e2e2ea" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background:editor.color }}>{editor.initials}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color:"#9ca3af" }}>Your Editor</p>
        <p className="font-bold text-sm" style={{ color:"#111118" }}>{editor.name}</p>
        <p className="text-xs" style={{ color:"#6b7280" }}>{editor.role}</p>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <p className="text-center text-xs mt-6 pb-8" style={{ color:"#9ca3af" }}>
      Powered by EditorFlow · Questions? Reach out to your editor directly.
    </p>
  );
}

// ── Retainer sub-components ──────────────────────────────────────────────────
function RetainerNoteForm({ round, onSubmit }: { round: RevisionRound; onSubmit: (note: RevisionNote) => void }) {
  const [timecode, setTimecode] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!note.trim()) return;
    onSubmit({ id: nanoid(), timecode: timecode.trim() || "—", note: note.trim(), createdAt: new Date().toISOString(), resolved: false });
    setTimecode(""); setNote("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="px-5 py-4 border-t" style={{ borderColor: "#f0f0f5" }}>
      <p className="text-xs font-semibold mb-3" style={{ color: "#6b7280" }}>ADD A NOTE</p>
      <div className="flex gap-2 mb-3">
        <div className="flex-shrink-0">
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Timecode</label>
          <input value={timecode} onChange={(e) => setTimecode(e.target.value)} placeholder="0:00"
            className="w-20 px-3 py-2.5 rounded-xl border text-sm font-mono outline-none text-center"
            style={{ background: "#fff", borderColor: "#e2e2ea", color: "#111118" }}
            onFocus={(e) => (e.target.style.borderColor = "#7c5cfc")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e2ea")} />
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Your note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Can we cut this scene a bit shorter?"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: "#fff", borderColor: "#e2e2ea", color: "#111118" }}
            onFocus={(e) => (e.target.style.borderColor = "#7c5cfc")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e2ea")} />
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={submit} disabled={!note.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        style={submitted ? { background: "#d1fae5", color: "#065f46" } : { background: "#7c5cfc", color: "#fff" }}>
        {submitted ? <><CheckCircle size={15} /> Sent!</> : <><Send size={14} /> Submit Note</>}
      </motion.button>
    </div>
  );
}

function RetainerApproveButton({ roundNumber, onApprove }: { roundNumber: number; onApprove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mx-5 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border"
        style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        <CheckCircle size={16} color="#16a37a" />
        <span className="text-sm font-semibold" style={{ color: "#16a37a" }}>Approved!</span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="mx-5 mb-4 rounded-xl border p-4" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#111118" }}>Approve this version?</p>
        <p className="text-xs mb-3" style={{ color: "#6b7280" }}>This tells your editor you're happy and they can proceed.</p>
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)}
            className="flex-1 py-2 rounded-xl border text-xs font-semibold"
            style={{ borderColor: "#e2e2ea", color: "#6b7280" }}>Cancel</button>
          <button onClick={() => { onApprove(); setDone(true); setConfirming(false); }}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{ background: "#16a37a", color: "#fff" }}>✓ Yes, Approve</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-4">
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => setConfirming(true)}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border"
        style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a37a" }}>
        <ThumbsUp size={15} /> I'm happy with this — Approve Round {roundNumber}
      </motion.button>
    </div>
  );
}

// ── Retainer Client View ─────────────────────────────────────────────────────
function RetainerClientView({ project, editor, onUpdate }: {
  project: Project; editor: TeamMember | null; onUpdate: (p: Project) => void;
}) {
  const periods = project.retainerPeriods || [];
  const latestPeriod = periods[periods.length - 1];

  async function addNoteToProduction(periodId: string, prodId: string, roundId: string, note: RevisionNote) {
    const updated = {
      ...project,
      retainerPeriods: project.retainerPeriods!.map((period) =>
        period.id !== periodId ? period : {
          ...period,
          productions: period.productions.map((prod) =>
            prod.id !== prodId ? prod : {
              ...prod,
              revisionRounds: prod.revisionRounds.map((round) =>
                round.id !== roundId ? round : {
                  ...round, notes: [...round.notes, note], status: "feedback_received" as const,
                }
              ),
            }
          ),
        }
      ),
    };
    await updateProject(project.id, { retainerPeriods: updated.retainerPeriods });
    onUpdate(updated);
  }

  async function approveProductionRound(periodId: string, prodId: string, roundId: string) {
    const updated = {
      ...project,
      retainerPeriods: project.retainerPeriods!.map((period) =>
        period.id !== periodId ? period : {
          ...period,
          productions: period.productions.map((prod) =>
            prod.id !== prodId ? prod : {
              ...prod,
              revisionRounds: prod.revisionRounds.map((round) =>
                round.id !== roundId ? round : {
                  ...round, approvedAt: new Date().toISOString(), status: "resolved" as const,
                }
              ),
            }
          ),
        }
      ),
    };
    await updateProject(project.id, { retainerPeriods: updated.retainerPeriods });
    onUpdate(updated);
  }

  if (!latestPeriod) {
    return (
      <div className="min-h-screen" style={{ background: "#f5f5f8" }}>
        <TopBar updatedAt={project.updatedAt} />
        <div className="max-w-2xl mx-auto px-5 py-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#111118" }}>Hi {project.clientName.split(" ")[0]} 👋</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>Your retainer is being set up. Check back soon!</p>
        </div>
      </div>
    );
  }

  const activeProductions = latestPeriod.productions.filter(
    (p) => p.stage === "revisions" && p.revisionRounds.length > 0
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f8" }}>
      <TopBar updatedAt={project.updatedAt} />
      <div className="max-w-2xl mx-auto px-5 py-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9ca3af" }}>
            {project.projectTitle} · Monthly Retainer
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#111118" }}>
            Hi {project.clientName.split(" ")[0]} 👋
          </h1>
        </motion.div>

        {/* Current billing period */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border p-4 mb-4 flex items-center justify-between"
          style={{ background: "#fff", borderColor: "#e2e2ea" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9ca3af" }}>Current Period</p>
            <p className="font-bold" style={{ color: "#111118" }}>{latestPeriod.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              {latestPeriod.productions.filter((p) => p.stage === "delivered").length} of {latestPeriod.productions.length} productions delivered
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>Invoice</p>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold"
              style={latestPeriod.invoicePaid
                ? { background: "#d1fae5", color: "#065f46" }
                : { background: "#fde68a", color: "#92400e" }}>
              {latestPeriod.invoicePaid ? "✓ Paid" : "⏳ Pending"}
            </span>
          </div>
        </motion.div>

        {/* Action banner for pending review */}
        {activeProductions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-4 mb-5 flex gap-3"
            style={{ background: "#f5f3ff", borderColor: "#7c5cfc" }}>
            <Film size={18} color="#7c5cfc" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold mb-0.5" style={{ color: "#111118" }}>
                {activeProductions.length} video{activeProductions.length > 1 ? "s" : ""} ready for your review
              </p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Watch, leave notes, and approve when you're happy.</p>
            </div>
          </motion.div>
        )}

        {/* Productions list */}
        <div className="flex flex-col gap-4 mb-4">
          {latestPeriod.productions.map((prod, pi) => {
            const prodStageIdx = PRODUCTION_STAGE_ORDER.indexOf(prod.stage);
            const latestRound = prod.revisionRounds[prod.revisionRounds.length - 1];
            const isReview = prod.stage === "revisions" && latestRound && !latestRound.approvedAt;

            return (
              <motion.div key={prod.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + pi * 0.05 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "#fff", borderColor: isReview ? "#7c5cfc" : "#e2e2ea",
                  boxShadow: isReview ? "0 0 0 2px #7c5cfc22" : "none" }}>

                {/* Production header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#f0f0f5" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: prod.stage === "delivered" ? "#d1fae5" : isReview ? "#7c5cfc" : "#f0ebff",
                      color: prod.stage === "delivered" ? "#065f46" : isReview ? "#fff" : "#7c5cfc" }}>
                    {prod.stage === "delivered" ? <Check size={14} /> : `#${prod.number}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#111118" }}>Production #{prod.number}</span>
                      {isReview && (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                          className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "#fde68a", color: "#92400e" }}>
                          Needs your review
                        </motion.span>
                      )}
                      {prod.stage === "delivered" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "#d1fae5", color: "#065f46" }}>✓ Delivered</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                      {new Date(prod.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  {/* Stage mini-strip */}
                  <div className="hidden sm:flex items-center gap-1">
                    {PRODUCTION_STAGES.map((s, idx) => (
                      <div key={s.id} className="w-6 h-6 rounded-full flex items-center justify-center text-xs border"
                        style={idx < prodStageIdx
                          ? { background: "#d1fae5", borderColor: "#34d399", color: "#065f46" }
                          : idx === prodStageIdx
                          ? { background: "#7c5cfc", borderColor: "#7c5cfc", color: "#fff" }
                          : { background: "#f9fafb", borderColor: "#e2e2ea", color: "#9ca3af" }}>
                        {idx < prodStageIdx ? <Check size={9} /> : <span style={{ fontSize: "9px" }}>{s.icon}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revision round */}
                {prod.revisionRounds.length > 0 && (() => {
                  const round = prod.revisionRounds[prod.revisionRounds.length - 1];
                  const isLatestActive = !round.approvedAt;
                  return (
                    <div>
                      <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "#f0f0f5" }}>
                        <Film size={14} style={{ color: "#7c5cfc" }} />
                        <span className="text-sm flex-1" style={{ color: "#6b7280" }}>{round.label}</span>
                        <a href={round.dropboxUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                          style={{ background: "#7c5cfc", color: "#fff" }}>
                          <ExternalLink size={13} /> Watch
                        </a>
                      </div>

                      {round.notes.length > 0 && (
                        <div className="px-5 pt-4 flex flex-col gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9ca3af" }}>Your Notes</p>
                          {round.notes.map((n) => (
                            <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl border"
                              style={{ background: n.resolved ? "#f0fdf4" : "#fafafa", borderColor: n.resolved ? "#bbf7d0" : "#e2e2ea" }}>
                              {n.timecode !== "—" && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                                  style={{ background: "#f0ebff", color: "#7c5cfc" }}>{n.timecode}</span>
                              )}
                              <p className="flex-1 text-sm leading-relaxed" style={{ color: n.resolved ? "#6b7280" : "#111118" }}>{n.note}</p>
                              {n.resolved
                                ? <span className="text-xs font-bold flex-shrink-0" style={{ color: "#16a37a" }}>✓ Fixed</span>
                                : <span className="text-xs flex-shrink-0" style={{ color: "#9ca3af" }}>Pending</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {isLatestActive && (
                        <RetainerNoteForm
                          round={round}
                          onSubmit={(note) => addNoteToProduction(latestPeriod.id, prod.id, round.id, note)}
                        />
                      )}

                      {isLatestActive && (
                        <RetainerApproveButton
                          roundNumber={round.roundNumber}
                          onApprove={() => approveProductionRound(latestPeriod.id, prod.id, round.id)}
                        />
                      )}

                      {round.approvedAt && (
                        <div className="mx-5 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border"
                          style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                          <CheckCircle size={16} color="#16a37a" />
                          <span className="text-sm font-semibold" style={{ color: "#16a37a" }}>
                            Approved on {new Date(round.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>

        {/* Past periods */}
        {periods.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border p-5 mb-4"
            style={{ background: "#fff", borderColor: "#e2e2ea" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9ca3af" }}>Past Periods</p>
            <div className="flex flex-col gap-2">
              {[...periods].slice(0, -1).reverse().map((period) => {
                const delivered = period.productions.filter((p) => p.stage === "delivered").length;
                return (
                  <div key={period.id} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "#f0f0f5" }}>
                    <span className="text-sm font-medium" style={{ color: "#111118" }}>{period.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6b7280" }}>{delivered}/{period.productions.length} delivered</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "#d1fae5", color: "#065f46" }}>✓ Done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <EditorCard editor={editor} />
        <Footer />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ClientView({ params }: { params: Promise<{ token: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [editor, setEditor] = useState<TeamMember | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let projectId = "";

    const load = async () => {
      const { token } = await params;
      const p = await getProjectByToken(token);
      if (!p) { setNotFound(true); return; }
      projectId = p.id;
      setProject(p);
      if (p.stage === "delivered") setTimeout(() => setShowConfetti(true), 600);
      if (p.assignedEditorId) {
        const team = await getTeam();
        setEditor(team.find((m) => m.id === p.assignedEditorId) || null);
      }
    };
    load();

    // Real-time: update when admin pushes changes
    const channel = supabase
      .channel("client-project")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, async (payload) => {
        if (payload.new.id === projectId) {
          const p = await getProjectByToken(payload.new.token as string);
          if (p) {
            setProject(p);
            if (p.stage === "delivered") setTimeout(() => setShowConfetti(true), 600);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#f5f5f8" }}>
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🎬</div>
          <h1 className="text-xl font-bold mb-2" style={{ color:"#111118" }}>Project not found</h1>
          <p className="text-sm" style={{ color:"#6b7280" }}>This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"#f5f5f8" }}>
        <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:1.5 }}
          className="flex items-center gap-2 text-sm" style={{ color:"#6b7280" }}>
          <Video size={16}/> Loading your project...
        </motion.div>
      </div>
    );
  }

  // Retainer portal
  if (project.projectType === "retainer") {
    return <RetainerClientView project={project} editor={editor} onUpdate={setProject} />;
  }

  const currentIdx = stageIndex(project.stage);
  const pct = Math.round(((currentIdx+1)/STAGES.length)*100);
  const isDelivered = project.stage === "delivered";
  const isPostProd = project.stage === "post_production";
  const rounds = project.revisionRounds || [];
  const latestRound = rounds.length > 0 ? rounds[rounds.length-1] : null;
  const visibleTasks = (project.dailyTasks || []).filter((t) => t.visibleToClient);
  const currentStage = STAGES[currentIdx];
  const nextStage = STAGES[currentIdx+1];

  function formatDate(iso: string) {
    const today = new Date().toISOString().slice(0,10);
    const yest = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if (iso===today) return "Today";
    if (iso===yest) return "Yesterday";
    return new Date(iso+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  }

  // ── POST-PRODUCTION with revision rounds ──────────────────────────────────
  if (isPostProd && latestRound) {
    return (
      <div className="min-h-screen" style={{ background:"#f5f5f8" }}>
        <TopBar updatedAt={project.updatedAt} />
        <div className="max-w-2xl mx-auto px-5 py-6">

          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"#9ca3af" }}>
              {project.projectTitle}
            </p>
            <h1 className="text-2xl font-bold" style={{ color:"#111118" }}>
              Hi {project.clientName.split(" ")[0]} 👋
            </h1>
            {project.deliveryDate && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color:"#6b7280" }}>
                <CalendarDays size={12}/>
                <span>Estimated delivery: <strong style={{ color:"#111118" }}>
                  {new Date(project.deliveryDate+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"})}
                </strong></span>
              </div>
            )}
          </motion.div>

          <ActionBanner project={project} />

          {/* Progress strip */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
            className="rounded-2xl border p-4 mb-5"
            style={{ background:"#fff", borderColor:"#e2e2ea" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color:"#6b7280" }}>Overall Progress</span>
              <span className="text-sm font-bold" style={{ color:"#7c5cfc" }}>{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background:"#f0f0f5" }}>
              <motion.div className="h-full rounded-full"
                style={{ background:"linear-gradient(90deg,#7c5cfc,#22d3a0)" }}
                animate={{ width:`${pct}%` }} transition={{ duration:1.2, delay:0.2 }} />
            </div>
            <ProgressStrip stage={project.stage} />
          </motion.div>

          {/* Revision cards */}
          {[...rounds].reverse().map((round, ri) => {
            const isLatest = round.id === latestRound.id;
            return (
              <motion.div key={round.id}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15+ri*0.05 }}
                className="rounded-2xl border overflow-hidden mb-4"
                style={{ background:"#fff", borderColor: isLatest ? "#7c5cfc" : "#e2e2ea",
                  boxShadow: isLatest ? "0 0 0 2px #7c5cfc22" : "none" }}>

                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor:"#f0f0f5" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: isLatest ? "#7c5cfc" : "#f0ebff", color: isLatest ? "#fff" : "#7c5cfc" }}>
                    R{round.roundNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color:"#111118" }}>{round.label}</span>
                      {isLatest && !round.approvedAt && (
                        <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:2 }}
                          className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background:"#fde68a", color:"#92400e" }}>
                          Needs your review
                        </motion.span>
                      )}
                      {round.approvedAt && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background:"#d1fae5", color:"#065f46" }}>✓ Approved</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color:"#6b7280" }}>
                      Shared {new Date(round.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric"})}
                      {round.notes.length > 0 && ` · ${round.notes.length} note${round.notes.length!==1?"s":""}`}
                    </p>
                  </div>
                  <a href={round.dropboxUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: isLatest ? "#7c5cfc" : "#f0ebff", color: isLatest ? "#fff" : "#7c5cfc" }}>
                    <Film size={13}/> Watch
                  </a>
                </div>

                {round.notes.length > 0 && (
                  <div className="px-5 pt-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:"#9ca3af" }}>Your Notes</p>
                    {round.notes.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl border"
                        style={{ background: n.resolved?"#f0fdf4":"#fafafa", borderColor: n.resolved?"#bbf7d0":"#e2e2ea" }}>
                        {n.timecode !== "—" && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                            style={{ background:"#f0ebff", color:"#7c5cfc" }}>{n.timecode}</span>
                        )}
                        <p className="flex-1 text-sm leading-relaxed" style={{ color: n.resolved?"#6b7280":"#111118" }}>
                          {n.note}
                        </p>
                        {n.resolved
                          ? <span className="text-xs font-bold flex-shrink-0" style={{ color:"#16a37a" }}>✓ Fixed</span>
                          : <span className="text-xs flex-shrink-0" style={{ color:"#9ca3af" }}>Pending</span>}
                      </div>
                    ))}
                  </div>
                )}

                {isLatest && !round.approvedAt && (
                  <>
                    <ClientNoteForm round={round} project={project} onUpdate={setProject} />
                    <ApproveButton round={round} project={project} onUpdate={setProject} />
                  </>
                )}

                {!isLatest && round.notes.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color:"#9ca3af" }}>No feedback was left on this round.</p>
                )}
              </motion.div>
            );
          })}

          {/* Daily tasks */}
          {visibleTasks.length > 0 && (() => {
            const grouped = visibleTasks.reduce<Record<string,typeof visibleTasks>>((acc,t)=>{
              (acc[t.date]=acc[t.date]||[]).push(t); return acc;
            },{});
            const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
            const done = visibleTasks.filter((t)=>t.completed).length;
            return (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                className="rounded-2xl border p-5 mb-4"
                style={{ background:"#fff", borderColor:"#e2e2ea", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:"#9ca3af" }}>
                    What We've Been Working On
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background:"#f0ebff", color:"#7c5cfc" }}>{done}/{visibleTasks.length}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ background:"#f0f0f5" }}>
                  <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#7c5cfc,#22d3a0)" }}
                    animate={{ width:`${visibleTasks.length?(done/visibleTasks.length)*100:0}%` }}
                    transition={{ duration:0.8, delay:0.4 }} />
                </div>
                {sortedDates.map((date) => (
                  <div key={date} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold"
                        style={{ color: date===new Date().toISOString().slice(0,10)?"#7c5cfc":"#9ca3af" }}>
                        {formatDate(date)}
                      </span>
                      <div className="flex-1 h-px" style={{ background:"#f0f0f5" }}/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {grouped[date].map((task) => {
                        const cat = DAILY_TASK_CATEGORIES.find((c)=>c.id===task.category);
                        return (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                            style={{ background:task.completed?"#f0fdf4":"#fafafa", borderColor:task.completed?"#bbf7d0":"#e2e2ea" }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={task.completed?{background:"#d1fae5",color:"#16a37a"}:{background:"#e2e2ea",color:"#9ca3af"}}>
                              {task.completed?<Check size={11}/>:<Clock size={11}/>}
                            </div>
                            <span className="flex-1 text-sm" style={{ color:task.completed?"#374151":"#6b7280" }}>{task.title}</span>
                            <span>{cat?.icon}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            );
          })()}

          <EditorCard editor={editor} />
          <Footer />
        </div>
      </div>
    );
  }

  // ── ALL OTHER STAGES (circular ring + journey timeline) ───────────────────
  return (
    <div className="min-h-screen" style={{ background:"#f5f5f8" }}>
      {showConfetti && <Confetti />}
      <TopBar updatedAt={project.updatedAt} />

      <div className="max-w-2xl mx-auto px-5 py-6">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-5">
          {isDelivered ? (
            <div className="rounded-2xl p-6 text-center border"
              style={{ background:"linear-gradient(135deg,#f0ebff,#e0f7f0)", borderColor:"#d4c5fd" }}>
              <div className="text-4xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold mb-1" style={{ color:"#111118" }}>Your video is ready!</h1>
              <p className="text-sm" style={{ color:"#6b7280" }}>
                <strong style={{ color:"#111118" }}>{project.projectTitle}</strong> has been delivered.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"#9ca3af" }}>
                {project.projectTitle}
              </p>
              <h1 className="text-2xl font-bold" style={{ color:"#111118" }}>
                Hi {project.clientName.split(" ")[0]} 👋
              </h1>
              {project.deliveryDate && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color:"#6b7280" }}>
                  <CalendarDays size={12}/>
                  <span>Estimated delivery: <strong style={{ color:"#111118" }}>
                    {new Date(project.deliveryDate+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"})}
                  </strong></span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <ActionBanner project={project} />

        {/* Circular progress ring */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="rounded-2xl border p-5 mb-4"
          style={{ background:"#fff", borderColor:"#e2e2ea", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0 w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f0f0f5" strokeWidth="7"/>
                <motion.circle cx="40" cy="40" r="32" fill="none" stroke="url(#cg)" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray={`${2*Math.PI*32}`}
                  initial={{ strokeDashoffset: 2*Math.PI*32 }}
                  animate={{ strokeDashoffset: 2*Math.PI*32*(1-pct/100) }}
                  transition={{ duration:1.4, ease:"easeOut", delay:0.3 }} />
                <defs>
                  <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c5cfc"/><stop offset="100%" stopColor="#22d3a0"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold" style={{ color:"#111118" }}>{pct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg">{currentStage.icon}</span>
                <span className="font-bold" style={{ color:"#111118" }}>{currentStage.label}</span>
                {!isDelivered && (
                  <motion.span animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:2 }}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background:"#f0ebff", color:"#7c5cfc" }}>In Progress</motion.span>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color:"#6b7280" }}>{currentStage.description}</p>
              {nextStage && !isDelivered && (
                <p className="text-xs" style={{ color:"#9ca3af" }}>
                  Up next: <strong style={{ color:"#374151" }}>{nextStage.icon} {nextStage.label}</strong>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Production Journey timeline */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="rounded-2xl border p-5 mb-4"
          style={{ background:"#fff", borderColor:"#e2e2ea", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color:"#9ca3af" }}>
            Production Journey
          </p>
          <div className="flex flex-col gap-3">
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentIdx;
              const isActive = idx === currentIdx;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2"
                    style={isActive ? { background:"#7c5cfc", borderColor:"#7c5cfc", color:"#fff" }
                      : isPast ? { background:"#d1fae5", borderColor:"#34d399", color:"#065f46" }
                      : { background:"#f9fafb", borderColor:"#e2e2ea", color:"#9ca3af" }}>
                    {isPast ? <Check size={13}/> : stage.icon}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: isActive||isPast?"#111118":"#9ca3af" }}>
                      {stage.label}
                    </span>
                    {isActive && (
                      <motion.div className="flex gap-0.5" animate={{ opacity:[1,0.3,1] }} transition={{ repeat:Infinity, duration:1.5 }}>
                        {[0,1,2].map((i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background:"#7c5cfc" }}/>)}
                      </motion.div>
                    )}
                    {isPast && <span className="text-xs" style={{ color:"#16a37a" }}>Done</span>}
                  </div>
                  {idx < STAGES.length-1 && <ChevronRight size={12} style={{ color:"#d1d5db" }}/>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Daily tasks grouped by date */}
        {visibleTasks.length > 0 && (() => {
          const grouped = visibleTasks.reduce<Record<string,typeof visibleTasks>>((acc,t)=>{
            (acc[t.date]=acc[t.date]||[]).push(t); return acc;
          },{});
          const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
          const done = visibleTasks.filter((t)=>t.completed).length;
          return (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="rounded-2xl border p-5 mb-4"
              style={{ background:"#fff", borderColor:"#e2e2ea", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color:"#9ca3af" }}>
                  What We've Been Working On
                </p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background:"#f0ebff", color:"#7c5cfc" }}>{done}/{visibleTasks.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ background:"#f0f0f5" }}>
                <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#7c5cfc,#22d3a0)" }}
                  animate={{ width:`${visibleTasks.length?(done/visibleTasks.length)*100:0}%` }}
                  transition={{ duration:0.8, delay:0.4 }} />
              </div>
              {sortedDates.map((date) => (
                <div key={date} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold"
                      style={{ color: date===new Date().toISOString().slice(0,10)?"#7c5cfc":"#9ca3af" }}>
                      {formatDate(date)}
                    </span>
                    <div className="flex-1 h-px" style={{ background:"#f0f0f5" }}/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {grouped[date].map((task) => {
                      const cat = DAILY_TASK_CATEGORIES.find((c)=>c.id===task.category);
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl border"
                          style={{ background:task.completed?"#f0fdf4":"#fafafa", borderColor:task.completed?"#bbf7d0":"#e2e2ea" }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={task.completed?{background:"#d1fae5",color:"#16a37a"}:{background:"#e2e2ea",color:"#9ca3af"}}>
                            {task.completed?<Check size={11}/>:<Clock size={11}/>}
                          </div>
                          <span className="flex-1 text-sm" style={{ color:task.completed?"#374151":"#6b7280" }}>{task.title}</span>
                          <span>{cat?.icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          );
        })()}

        <EditorCard editor={editor} />
        <Footer />
      </div>
    </div>
  );
}
