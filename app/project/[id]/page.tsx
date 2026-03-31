"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, Plus, Trash2, Copy, CheckCircle,
  DollarSign, ChevronRight, Edit3, Save
} from "lucide-react";
import { Project, Task, DailyTask, RevisionRound, TeamMember, STAGES, STAGE_ORDER } from "@/lib/types";
import { RetainerAdmin } from "@/app/components/RetainerAdmin";
import { getProject, updateProject, deleteProject, getTeam } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { DailyTasks } from "@/app/components/DailyTasks";
import { RevisionRounds } from "@/app/components/RevisionRounds";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "@/lib/nanoid";

function stageIndex(stage: string) {
  return STAGE_ORDER.indexOf(stage as any);
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [id, setId] = useState<string>("");
  const [newTask, setNewTask] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    let projectId = "";

    const load = async () => {
      setTeam(await getTeam());
      const { id } = await params;
      projectId = id;
      setId(id);
      const p = await getProject(id);
      if (p) { setProject(p); setNotes(p.notes); }
    };
    load();

    // Real-time: update project detail when client makes changes
    const channel = supabase
      .channel("project-detail")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, async (payload) => {
        if (payload.new.id === projectId) {
          const p = await getProject(projectId);
          if (p) setProject(p);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params]);

  async function refresh() {
    const p = await getProject(id);
    if (p) setProject(p);
  }

  async function setStage(stage: string) {
    const updated = await updateProject(id, { stage: stage as any });
    if (updated) setProject(updated);
  }

  async function toggleInvoicePaid() {
    if (!project) return;
    const updated = await updateProject(id, { invoicePaid: !project.invoicePaid });
    if (updated) setProject(updated);
  }

  async function addTask() {
    if (!newTask.trim() || !project) return;
    const task: Task = { id: nanoid(), title: newTask.trim(), completed: false };
    const updated = await updateProject(id, { tasks: [...project.tasks, task] });
    setNewTask("");
    if (updated) setProject(updated);
  }

  async function toggleTask(taskId: string) {
    if (!project) return;
    const tasks = project.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t);
    const updated = await updateProject(id, { tasks });
    if (updated) setProject(updated);
  }

  async function deleteTask(taskId: string) {
    if (!project) return;
    const updated = await updateProject(id, { tasks: project.tasks.filter((t) => t.id !== taskId) });
    if (updated) setProject(updated);
  }

  async function saveNotes() {
    const updated = await updateProject(id, { notes });
    setEditingNotes(false);
    if (updated) setProject(updated);
  }

  function copyClientLink() {
    if (!project) return;
    navigator.clipboard.writeText(`${window.location.origin}/client/${project.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>Loading...</div>
      </div>
    );
  }

  const currentIdx = stageIndex(project.stage);
  const pct = Math.round(((currentIdx + 1) / STAGES.length) * 100);
  const completedTasks = project.tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ borderColor: "var(--card-border)", background: "var(--background)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                <ArrowLeft size={18} style={{ color: "var(--muted)" }} />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-sm">{project.projectTitle}</h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{project.clientName} · {project.clientEmail}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyClientLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={copied
              ? { background: "rgba(34,211,160,0.1)", borderColor: "var(--success)", color: "var(--success)" }
              : { background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Client Link"}
          </motion.button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Retainer view */}
          {project.projectType === "retainer" && (
            <RetainerAdmin
              project={project}
              onChange={async (updates) => { const u = await updateProject(id, updates); if (u) setProject(u); }}
            />
          )}

          {project.projectType !== "retainer" && <>
          <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-1">Project Stage</h2>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Click a stage to update progress</p>
            <div className="flex flex-col gap-2">
              {STAGES.map((stage, idx) => {
                const isActive = project.stage === stage.id;
                const isPast = idx < currentIdx;
                const isFuture = idx > currentIdx;
                return (
                  <motion.button
                    key={stage.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setStage(stage.id)}
                    className="flex items-center gap-4 p-3 rounded-xl text-left transition-all border"
                    style={
                      isActive
                        ? { background: "var(--accent-glow)", borderColor: "var(--accent)" }
                        : isPast
                        ? { background: "rgba(34,211,160,0.05)", borderColor: "rgba(34,211,160,0.2)" }
                        : { background: "transparent", borderColor: "var(--card-border)" }
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={
                        isActive
                          ? { background: "var(--accent)", color: "#fff" }
                          : isPast
                          ? { background: "rgba(34,211,160,0.15)", color: "var(--success)" }
                          : { background: "var(--card-border)", color: "var(--muted)" }
                      }
                    >
                      {isPast ? <Check size={14} /> : stage.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{stage.label}</span>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{stage.description}</p>
                    </div>
                    {!isFuture && <ChevronRight size={14} style={{ color: "var(--muted)" }} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Tasks</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {completedTasks}/{project.tasks.length} completed
                </p>
              </div>
            </div>

            {/* Progress */}
            {project.tasks.length > 0 && (
              <div className="mb-4">
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--accent), var(--success))" }}
                    animate={{ width: `${project.tasks.length ? (completedTasks / project.tasks.length) * 100 : 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
              <AnimatePresence>
                {project.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl group border"
                    style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all"
                      style={
                        task.completed
                          ? { background: "var(--success)", borderColor: "var(--success)" }
                          : { borderColor: "var(--card-border)" }
                      }
                    >
                      {task.completed && <Check size={12} color="#fff" />}
                    </button>
                    <span
                      className="flex-1 text-sm"
                      style={task.completed ? { color: "var(--muted)", textDecoration: "line-through" } : {}}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={13} style={{ color: "var(--muted)" }} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a task..."
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
              />
              <button
                onClick={addTask}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Notes</h2>
              <button
                onClick={editingNotes ? saveNotes : () => setEditingNotes(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                {editingNotes ? <><Save size={12} /> Save</> : <><Edit3 size={12} /> Edit</>}
              </button>
            </div>
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ background: "var(--background)", borderColor: "var(--accent)", color: "var(--foreground)" }}
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: notes ? "var(--foreground)" : "var(--muted)" }}>
                {notes || "No notes yet. Click Edit to add notes."}
              </p>
            )}
          </div>

          {/* Daily Tasks */}
          <DailyTasks
            tasks={project.dailyTasks || []}
            onChange={async (dailyTasks) => {
              const u = await updateProject(id, { dailyTasks });
              if (u) setProject(u);
            }}
          />

          {/* Revision Rounds */}
          <RevisionRounds
            rounds={project.revisionRounds || []}
            onChange={async (revisionRounds) => {
              const u = await updateProject(id, { revisionRounds });
              if (u) setProject(u);
            }}
          />
          </>}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Invoice */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-4">Invoice</h2>
            <div className="text-3xl font-bold mb-1">${project.invoiceAmount.toLocaleString()}</div>
            <div
              className="text-sm mb-4 font-medium"
              style={{ color: project.invoicePaid ? "var(--success)" : "var(--warning)" }}
            >
              {project.invoicePaid ? "✓ Payment received" : "⏳ Awaiting payment"}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleInvoicePaid}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={
                project.invoicePaid
                  ? { borderColor: "var(--card-border)", color: "var(--muted)" }
                  : { background: "var(--success)", color: "#fff", borderColor: "transparent" }
              }
            >
              {project.invoicePaid ? "Mark as Unpaid" : "Mark as Paid"}
            </motion.button>
          </div>

          {/* Delivery date */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-3">Delivery Date</h2>
            <input
              type="date"
              value={project.deliveryDate || ""}
              onChange={async (e) => { const u = await updateProject(id, { deliveryDate: e.target.value }); if (u) setProject(u); }}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
            />
            {project.deliveryDate && (
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                {new Date(project.deliveryDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            )}
          </div>

          {/* Overall progress */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-4">Overall Progress</h2>
            <div className="flex items-end gap-2 mb-3">
              <div className="text-4xl font-bold" style={{ color: "var(--accent)" }}>{pct}%</div>
              <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>
                Stage {currentIdx + 1} of {STAGES.length}
              </div>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--card-border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #7c5cfc, #22d3a0)" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {STAGES[currentIdx].icon} {STAGES[currentIdx].label}
            </p>
          </div>

          {/* Client link */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-2">Client Portal</h2>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Share this link with {project.clientName} so they can track progress in real time.
            </p>
            <div
              className="p-3 rounded-xl text-xs break-all mb-3 font-mono"
              style={{ background: "var(--background)", color: "var(--muted)" }}
            >
              /client/{project.token.slice(0, 20)}...
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyClientLink}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={copied ? { background: "rgba(34,211,160,0.15)", color: "var(--success)" } : { background: "var(--accent)", color: "#fff" }}
            >
              {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </motion.button>
          </div>

          {/* Editor assignment */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <h2 className="font-semibold mb-3">Assigned Editor</h2>
            <div className="flex flex-col gap-2">
              {team.map((member) => {
                const isAssigned = project.assignedEditorId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={async () => {
                      const u = await updateProject(id, { assignedEditorId: isAssigned ? undefined : member.id });
                      if (u) setProject(u);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={isAssigned
                      ? { background: "var(--accent-glow)", borderColor: "var(--accent)" }
                      : { background: "var(--background)", borderColor: "var(--card-border)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: member.color }}>
                      {member.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{member.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{member.role}</p>
                    </div>
                    {isAssigned && <CheckCircle size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                  </button>
                );
              })}
              {team.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>
                  No team members yet. Add them from the dashboard.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
